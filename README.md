# Ghost Interface

> AI-powered ATS form autofill with per-field confidence scoring — fills smarter, not faster.

A Chrome MV3 extension that reads your saved profile, analyzes the job description, and fills job application forms on supported ATS platforms. Every field gets a color-coded confidence ring so you can review what was filled before submitting.

---

## Features

**Fit Score** — Before filling a single field, Ghost Interface compares the job description against your profile. You see which skills match, which are missing, and how your years of experience line up. Click once to get the score, a second time to fill.

**Per-field confidence rings** — Each filled field gets a color ring based on how certain the extension was:
- Green (95%) — exact match from your profile
- Amber (75%) — fuzzy or inferred value
- Red (40%) — open-ended question, needs your input
- Gray (10%) — unknown field, left blank

**Decision Tree panel** — A sidebar shows every field, its confidence score, and the fill method used. Inspect why each value was chosen.

**AI open-ended answers** — For essay questions ("Why do you want to work here?"), you get three options: a concise template, an AI-generated answer from Claude Haiku tailored to the company and role, or a blank editor to write your own.

**Submit Gate** — Blocks the form from being submitted if any field has a confidence score below 0.6, so you don't accidentally send incomplete applications.

---

## Supported Platforms

| ATS | URL Pattern |
|-----|-------------|
| Greenhouse | `boards.greenhouse.io`, `job-boards.greenhouse.io` |
| Workday | `*.myworkdayjobs.com` |
| Lever | `jobs.lever.co` |
| iCIMS | `*.icims.com` |
| BambooHR | `*.bamboohr.com` |
| Ashby | `jobs.ashbyhq.com` |
| Loxo | `*.app.loxo.co` |

> Note: Dropdowns and file upload fields (resume PDF) are not auto-filled — those still need manual input.

---

## Installation

### From Chrome Web Store
*(Pending review)*

### Local development build

```bash
git clone https://github.com/cristianrm11/ghost-interface.git
cd ghost-interface
pnpm install
pnpm build
```

Then in Chrome:
1. Go to `chrome://extensions`
2. Enable **Developer mode**
3. Click **Load unpacked** and select the `dist/` folder

---

## Setup

1. Click the Ghost Interface icon in your toolbar
2. Fill in your profile: name, email, phone, LinkedIn, portfolio, resume text, skills, and work experience
3. Optionally add your **Anthropic API key** if you want Claude-generated answers for open-ended questions
4. Navigate to any job application on a supported ATS platform
5. Click the **Ghost Interface pill** that appears in the bottom-right corner

---

## How it works

```
Job page loads
    └── Content script detects ATS type
    └── Ghost pill appears (bottom-right)

User clicks pill
    └── JD parser extracts title, skills, YOE from job description
    └── Fit score computed against profile
    └── FitScoreModal shows match percentage + gap analysis

User clicks Fill
    └── FormScanner scans all visible fields → FieldDefinition[]
    └── ConfidenceEngine scores each field (exact / fuzzy / inferred / open-ended)
    └── FieldFiller writes values + attaches colored rings
    └── DecisionTree panel opens showing all field scores

User reviews open-ended fields
    └── OpenEndedHandler: template / Claude Haiku / custom
    └── User applies preferred answer

Submit Gate
    └── Intercepts form submit
    └── Blocks if any field score < 0.6
    └── Shows list of fields needing review
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Extension | Chrome MV3, TypeScript |
| Build | Vite 5 + @crxjs/vite-plugin |
| UI | React 18, shadow DOM (closed mode) |
| State | Zustand |
| AI | Anthropic Claude Haiku (via user-provided API key) |
| Tests | Vitest, @testing-library/react |
| E2E | Playwright |

---

## Privacy

Everything stays on your device. Profile data and your API key are stored in `chrome.storage.local` and never sent to any server we control. The Anthropic API is called only when you explicitly click "Generate" on an open-ended field.

See [PRIVACY.md](./PRIVACY.md) for the full policy.

---

## Project context

Ghost Interface is app #1 of a 5-project browser automation portfolio built to demonstrate production-quality Chrome extension development with AI integration.

| # | Project | Status |
|---|---------|--------|
| 1 | Ghost Interface (ATS autofill) | Complete |
| 2 | ATS Browser Agent | Planned |
| 3 | Large-scale scraper | Planned |
| 4 | CAPTCHA solver | Planned |
| 5 | Proxy rotator | Planned |

---

## License

MIT
