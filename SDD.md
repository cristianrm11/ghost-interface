# SDD: ATS Form Extension — Ghost Interface

> **Note**: This document reflects the initial design. The [README](./README.md) is the current source of truth for supported platforms, architecture, and setup.

**Version**: 1.0  
**Stack**: TypeScript, React 18, Vite, Chrome Manifest V3  
**Target**: Chrome Web Store (public)  
**Deployment**: Static extension ZIP + CWS review

---

## 1. What We're Building

A Chrome extension that invisibly monitors ATS job application forms and surfaces a Ghost Interface (ambient overlay) only when needed. Differentiates from Simplify by:

1. **Per-field confidence rings** — visual trust signal per field, not all-or-nothing fill
2. **Submit gate** — blocks form submission when any field has confidence < 0.6
3. **3-variant open-ended handler** — for "Why this company?" fields: Concise / Detailed / Custom
4. **ATS-aware formatting** — detects Greenhouse / Workday / Lever and formats Experience accordingly
5. **Pre-fill JD Fit Score** — shows match % before autofilling; surfaces missing keywords and YOE gaps

---

## 2. Architecture

```
┌─────────────────────────────────────────────────────┐
│  Chrome Extension (MV3)                             │
│                                                     │
│  ┌──────────────┐     ┌──────────────────────────┐  │
│  │ Service      │◄───►│ Content Script           │  │
│  │ Worker       │     │ (injected on ATS pages)  │  │
│  │              │     │                          │  │
│  │ - Profile    │     │ - ATS Detector           │  │
│  │   storage    │     │ - Form Scanner           │  │
│  │ - Message    │     │ - Field Filler           │  │
│  │   routing    │     │ - JD Parser              │  │
│  │ - API calls  │     │ - Confidence Scorer      │  │
│  └──────────────┘     └──────────┬───────────────┘  │
│                                  │ mounts            │
│                        ┌─────────▼───────────────┐  │
│                        │ Ghost Overlay (React)   │  │
│                        │                         │  │
│                        │ - Dynamic Island pill   │  │
│                        │ - Fit Score modal       │  │
│                        │ - Confidence rings      │  │
│                        │ - Submit gate banner    │  │
│                        │ - Open-ended handler    │  │
│                        │ - Decision tree panel   │  │
│                        └─────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

The overlay is a **shadow DOM** injected into the page — isolated from the host page's CSS, invisible by default, activates on hover near a detected form field or on pill click.

---

## 3. ATS Detection

### Detection Strategy

Priority order: URL pattern → DOM fingerprint → fallback generic

```typescript
type ATSType = 'greenhouse' | 'workday' | 'lever' | 'icims' | 'bamboohr' | 'ashby' | 'generic';

const ATS_SIGNATURES: Record<ATSType, ATSSignature> = {
  greenhouse: {
    urlPatterns: [/boards\.greenhouse\.io/, /greenhouse\.io\/applications/],
    domSelectors: ['#application_form', '[data-source="greenhouse"]'],
    fieldMap: GREENHOUSE_FIELD_MAP,
  },
  workday: {
    urlPatterns: [/myworkdayjobs\.com/, /wd\d+\.myworkday\.com/],
    domSelectors: ['[data-automation-id="formContainer"]'],
    fieldMap: WORKDAY_FIELD_MAP,
  },
  lever: {
    urlPatterns: [/jobs\.lever\.co/],
    domSelectors: ['.application-form', '[data-qa="apply-form"]'],
    fieldMap: LEVER_FIELD_MAP,
  },
  icims: {
    urlPatterns: [/\.icims\.com/],
    domSelectors: ['#iCIMS_MainColumn'],
    fieldMap: ICIMS_FIELD_MAP,
  },
  bamboohr: {
    urlPatterns: [/bamboohr\.com\/careers/],
    domSelectors: ['.applicationQuestion'],
    fieldMap: BAMBOOHR_FIELD_MAP,
  },
  ashby: {
    urlPatterns: [/jobs\.ashbyhq\.com/],
    domSelectors: ['[data-testid="application-form"]'],
    fieldMap: ASHBY_FIELD_MAP,
  },
  generic: {
    urlPatterns: [],
    domSelectors: ['form[action*="apply"]', 'form[action*="job"]', 'form[action*="career"]'],
    fieldMap: GENERIC_FIELD_MAP,
  },
};
```

### ATS-Aware Experience Formatting

Each ATS renders multi-entry fields differently:

| ATS | Experience order | Known quirk |
|-----|-----------------|-------------|
| Greenhouse | Newest first | Projects must NOT go in experience section |
| Workday | Oldest first (reversed) | Requires month+year, not just year |
| Lever | Newest first | Free-text area, no structured fields |
| iCIMS | User-defined | Often has a max character limit per entry |

The `FieldFiller` reads `ats.fieldMap.experienceOrder` and reverses the profile's experience array as needed.

---

## 4. Confidence Scoring

Every field fill gets a confidence score 0.0–1.0:

```typescript
type ConfidenceLevel = 'high' | 'medium' | 'low' | 'unknown';

function scoreConfidence(fieldKey: string, profileValue: string | undefined): ConfidenceScore {
  if (!profileValue) return { score: 0.0, level: 'unknown', reason: 'No profile data' };

  // EXACT: field name matches a known profile key directly
  if (EXACT_FIELD_KEYS.has(fieldKey)) return { score: 0.95, level: 'high', reason: 'Direct profile match' };

  // FUZZY: string similarity against profile keys
  const fuzzyScore = bestFuzzyMatch(fieldKey, Object.keys(profile));
  if (fuzzyScore > 0.8) return { score: 0.80, level: 'medium', reason: `Fuzzy match (${fuzzyScore})` };

  // INFERRED: derived from context (e.g. "salary expectation" → inferred from location + role level)
  const inferred = attemptInference(fieldKey, profile);
  if (inferred) return { score: 0.55, level: 'medium', reason: 'Inferred from context' };

  // OPEN-ENDED: free-text fields with no direct mapping
  if (isOpenEnded(field)) return { score: 0.40, level: 'low', reason: 'Open-ended — review required' };

  return { score: 0.1, level: 'unknown', reason: 'No mapping found' };
}
```

### Visual Encoding

| Score | Ring color | Behavior |
|-------|-----------|----------|
| 0.8–1.0 | `#22c55e` green | Auto-fills silently |
| 0.6–0.79 | `#f59e0b` amber | Fills + highlights for review |
| 0.3–0.59 | `#ef4444` red | Fills tentatively, blocks submit |
| 0.0–0.29 | `#6b7280` gray | Does not fill, opens handler |

Submit is blocked if **any field** is red or gray. The submit gate banner lists each blocking field.

---

## 5. JD Fit Score (Pre-Fill Check)

Before filling the form, Ghost Interface parses the job description from the current page and runs a lightweight match against the user's profile.

```typescript
interface FitScore {
  overall: number;           // 0–100
  yearsMatch: boolean;       // required YOE <= user YOE
  keywordHits: string[];     // matched skills/techs
  keywordMisses: string[];   // required skills not in profile
  titleMatch: 'exact' | 'related' | 'unrelated';
}
```

**JD parsing approach**: Look for structured sections (Qualifications, Requirements, Must Have) using regex over `document.body.innerText`. No API call needed for this — client-side only.

Fit Score modal appears **before** any field is filled. User can:
- **Fill Anyway** → proceed with low fit (intentional decision)
- **Review JD** → expand JD with highlighted gaps inline
- **Skip** → dismiss overlay entirely

---

## 6. Open-Ended Question Handler

Detects fields where `type="textarea"` or field character limit > 300.

```
┌──────────────────────────────────────────┐
│ Why do you want to work at Stripe?       │
│                                          │
│ ○ Concise  (2-3 sentences, ATS-safe)    │
│ ● Detailed (3-4 paragraphs, tailored)   │
│ ○ Custom   (write your own)             │
│                                          │
│ [Preview text...]                        │
│                                          │
│ [Use This]  [Regenerate]                 │
└──────────────────────────────────────────┘
```

- **Concise**: pre-written template with `{company}` + `{role}` substituted from page
- **Detailed**: calls the service worker → Claude API (`claude-haiku-4-5-20251001`) with profile + JD context
- **Custom**: opens editable textarea pre-populated with Concise variant

The service worker holds the API key (not exposed to content script directly).

---

## 7. Decision Tree (Observability)

Every fill action is logged as a node in a DAG:

```typescript
interface DecisionNode {
  id: string;
  fieldKey: string;
  atsType: ATSType;
  confidence: ConfidenceScore;
  fillMethod: 'exact' | 'fuzzy' | 'inferred' | 'openEnded' | 'skipped';
  value: string;           // redacted for PII in export
  timestamp: number;
  children: string[];      // next decisions dependent on this
}
```

The Decision Tree panel (accessible via pill icon) renders this DAG using a minimal canvas renderer (no heavy library — raw `<canvas>` API):
- Node color = confidence level color
- Edge thickness = frequency (same decision made on past fills)
- Click node → see why that confidence score was assigned

---

## 8. Data Model (Profile)

Stored in `chrome.storage.local`. Never sent to any server.

```typescript
interface UserProfile {
  personal: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    location: { city: string; state: string; country: string; };
    linkedIn: string;
    github: string;
    portfolio: string;
  };
  experience: WorkExperience[];  // newest first always; filler reverses if ATS needs it
  education: Education[];
  skills: string[];
  resumeText: string;            // raw text for open-ended context
  salaryExpectation?: number;
  yearsOfExperience: number;     // computed from experience array on save
}
```

---

## 9. Key Flows

### Flow A: Page Load

```
navigate to ATS job page
  → content script injected
  → ATSDetector.detect() → ATSType
  → FormScanner.scan() → FieldMap[]
  → JDParser.parse() → JobDescription
  → FitScorer.score(profile, jd) → FitScore
  → mount Ghost Overlay (shadow DOM)
  → show Dynamic Island pill (bottom right, 48×20px collapsed)
```

### Flow B: User Clicks Pill

```
pill click
  → if FitScore.overall < 60 → show FitScore modal
  → else → begin field fill sequence
  → for each field:
      score = Confidence.score(field, profile)
      fill field with value
      decorate field with confidence ring (CSS outline via content script)
      log DecisionNode
  → if any field.confidence < 0.6 → show SubmitGate banner
  → else → show "Ready to submit" state
```

### Flow C: Submit Gate

```
user attempts form submit (intercept via capture listener)
  → check: any red/gray fields?
  → yes → preventDefault()
        → show SubmitGate banner listing blocking fields
        → each field has [Edit] button → focus that field
  → no → allow submit, log submission event to DecisionTree
```

---

## 10. File Structure

```
01-ats-form-extension/
├── manifest.json
├── src/
│   ├── background/
│   │   └── service-worker.ts       # Message routing, Claude API calls, profile storage
│   ├── content/
│   │   ├── index.ts                # Entry point, bootstraps on DOMContentLoaded
│   │   ├── ats-detector.ts         # URL + DOM fingerprinting → ATSType
│   │   ├── form-scanner.ts         # Traverse form elements → FieldMap[]
│   │   ├── field-filler.ts         # Fill + decorate fields, handle ATS quirks
│   │   ├── jd-parser.ts            # Extract requirements from page text
│   │   └── submit-interceptor.ts   # Capture submit events for gate
│   ├── overlay/
│   │   ├── index.tsx               # Shadow DOM mount point
│   │   ├── GhostOverlay.tsx        # Root overlay, state machine
│   │   ├── DynamicPill.tsx         # Collapsed pill (default state)
│   │   ├── FitScoreModal.tsx       # Pre-fill fit check
│   │   ├── ConfidenceRing.tsx      # Per-field ring decorator
│   │   ├── SubmitGate.tsx          # Block submit banner
│   │   ├── OpenEndedHandler.tsx    # 3-variant textarea handler
│   │   └── DecisionTreePanel.tsx   # Canvas-based DAG renderer
│   ├── popup/
│   │   ├── index.html
│   │   └── Popup.tsx               # Profile editor + settings
│   ├── shared/
│   │   ├── types.ts
│   │   ├── confidence.ts           # Scoring algorithm
│   │   ├── field-maps/
│   │   │   ├── greenhouse.ts
│   │   │   ├── workday.ts
│   │   │   ├── lever.ts
│   │   │   └── generic.ts
│   │   └── messages.ts             # chrome.runtime message types (type-safe)
│   └── assets/
│       └── icons/                  # 16, 48, 128px PNGs
├── public/
├── vite.config.ts                  # Multi-entry: content + overlay + popup + SW
├── tsconfig.json
├── package.json
└── .env.example                    # ANTHROPIC_API_KEY (service worker only)
```

---

## 11. Tech Decisions

| Decision | Choice | Why |
|----------|--------|-----|
| Build tool | Vite + `@crxjs/vite-plugin` | Hot reload in dev, handles MV3 multi-entry automatically |
| UI framework | React 18 + Tailwind (shadow DOM) | Component model fits overlay state machine; Tailwind scoped inside shadow |
| State | Zustand (overlay) | No Redux overhead; works cleanly inside shadow DOM |
| Canvas renderer | Raw `<canvas>` | No D3 / mermaid dependency; keeps bundle small |
| Profile storage | `chrome.storage.local` | Offline, private, no server needed for MVP |
| API key location | `chrome.storage.local`, read by service worker at runtime | Content scripts are inspectable; key never bundled |
| LLM for open-ended | `claude-haiku-4-5-20251001` | Fast + cheap for textarea generation |

---

## 12. Non-Goals (MVP)

- No cloud sync of profiles
- No cover letter generation (open-ended handler only)
- No email tracking
- No LinkedIn scraping
- No multi-profile support
- No Firefox support

---

## 13. OpenAPI Spec

The extension has **no HTTP backend**. All logic runs in the extension. The only external call is:

```
POST https://api.anthropic.com/v1/messages
Authorization: Bearer {ANTHROPIC_API_KEY}
```

Called from service worker only, for the "Detailed" variant of open-ended questions.

**Workflow YAML** (automation logic for the fill sequence) → `workflow.yaml` (next file to write)

---

## 14. Test Strategy

### Unit Tests — Vitest

Run entirely in Node (no browser needed). Fast, covers core logic.

| File | What it tests | Key assertions |
|------|--------------|----------------|
| `confidence.test.ts` | `scoreConfidence()` for all 4 levels | exact → 0.95, unknown → ≤ 0.3, open-ended → 0.4 |
| `ats-detector.test.ts` | URL + DOM pattern matching | greenhouse URL → `'greenhouse'`, unknown → `'generic'` |
| `jd-parser.test.ts` | Extract YOE, skills, title from JD text | "5+ years" → `{ yearsRequired: 5 }` |
| `field-maps/greenhouse.test.ts` | Key mappings resolve correct profile paths | `'first_name'` → `profile.personal.firstName` |
| `field-maps/workday.test.ts` | Experience array is reversed for Workday | newest-first input → oldest-first output |

```bash
# Run
pnpm test
# Coverage gate: 80% on src/shared/ (confidence, ats-detector, jd-parser, field-maps)
```

### Integration Tests — Vitest + JSDOM

Mount real HTML fixtures of ATS forms (saved snapshots from Greenhouse/Workday/Lever). Verify the scanner reads fields correctly and the filler mutates the DOM as expected.

```
src/__fixtures__/
  greenhouse-form.html    # snapshot of real Greenhouse apply page
  workday-form.html
  lever-form.html
```

| File | What it tests |
|------|--------------|
| `form-scanner.integration.test.ts` | `FormScanner.scan()` against each HTML fixture returns expected FieldMap |
| `field-filler.integration.test.ts` | `FieldFiller.fill()` sets correct `value` on inputs and fires `input` + `change` events |
| `submit-interceptor.integration.test.ts` | Submit is blocked when a red-confidence field is present; allowed when all green |

### E2E Tests — Playwright

Load the built extension in a real Chromium instance. Navigate to local HTML fixtures served via `vite preview`. These tests prove the full pipeline end-to-end.

```typescript
// e2e/greenhouse-fill.spec.ts
test('fills Greenhouse form and shows confidence rings', async ({ context }) => {
  const page = await context.newPage();
  await page.goto('http://localhost:4173/fixtures/greenhouse-form.html');

  // pill appears
  const pill = page.locator('[data-ghost="pill"]');
  await expect(pill).toBeVisible();

  // trigger fill
  await pill.click();

  // fit score modal if < 60%
  // (fixture is tuned to 80% so modal should not block)

  // confidence rings on fields
  const rings = page.locator('[data-ghost="ring"]');
  await expect(rings).toHaveCount(10); // 10 fields in fixture

  // no red rings → submit gate not shown
  const gate = page.locator('[data-ghost="submit-gate"]');
  await expect(gate).not.toBeVisible();
});
```

```bash
# Run E2E
pnpm e2e
# Requires: pnpm build first, then fixture server up
```

### CI Matrix

```yaml
# .github/workflows/ci.yml
jobs:
  unit:
    runs-on: ubuntu-latest
    steps: [checkout, pnpm install, pnpm test --coverage]

  e2e:
    runs-on: ubuntu-latest
    steps: [checkout, pnpm install, pnpm build, pnpm e2e]
```

All tests run on every push. PRs blocked if unit coverage drops below 80% on `src/shared/`.

---

## 15. Definition of Done

The extension is **done** when the following golden path works end-to-end on a real live Greenhouse job posting (not a fixture):

### Golden Path Scenario

```
1. User opens a real Greenhouse application page
   e.g. boards.greenhouse.io/stripe/jobs/[id]

2. Ghost pill appears bottom-right within 1 second of page load

3. User clicks pill → Fit Score modal appears:
   - Overall score ≥ 60%
   - At least 1 keyword miss shown (realistic gap)

4. User clicks "Fill Anyway"

5. Extension fills all 10–14 standard fields:
   - ≥ 8 fields render green ring (confidence ≥ 0.80)
   - ≤ 2 fields render amber ring (confidence 0.60–0.79)
   - 0 fields render red ring on a well-configured profile

6. 1 open-ended textarea detected ("Why Stripe?"):
   - Handler opens with 3 variants
   - User selects "Concise"
   - Text populated in < 1 second (no API call needed for Concise)

7. No red/gray fields → Submit gate does NOT block

8. Decision Tree panel shows 11–15 nodes, all green or amber,
   with edge weights populated

9. User reviews amber fields, makes 0 manual corrections
   (the fill was accurate enough to submit as-is)
```

### Acceptance Checklist

- [x] Greenhouse golden path above works live (screenrecord as proof)
- [x] Submit gate blocks on a profile with a missing required field
- [x] Extension builds without warnings (`pnpm build`)
- [x] Extension loads in Chrome 120+ without console errors
- [x] No profile data logged to console or sent to any URL except `api.anthropic.com`
- [x] Popup profile editor saves and persists across page reloads
- [x] GitHub repo pushed with README linking to CWS listing
- [x] Submitted to Chrome Web Store (screenshot of submission confirmation)
- [ ] Workday golden path works (reversed experience order verified)
- [ ] Lever golden path works
- [ ] All unit tests pass (`pnpm test`)
- [ ] All E2E tests pass against fixtures (`pnpm e2e`)
- [ ] Unit coverage ≥ 80% on `src/shared/`

### Out of Scope for DoD

The following are NOT required for DoD and will not be built during this phase:
- Workday multi-page form navigation (page 2+)
- CAPTCHA handling
- Auto-detecting resume from Google Drive
- Firefox support
- Cover letter generation
