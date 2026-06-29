import { useState, useCallback, useEffect, useMemo } from 'react';
import { DynamicPill } from './DynamicPill';
import { FitScoreModal } from './FitScoreModal';
import { SubmitGate } from './SubmitGate';
import { OpenEndedHandler } from './OpenEndedHandler';
import { DecisionTreePanel } from './DecisionTreePanel';
import { computeFitScore } from '../shared/fit-scorer';
import { isBlocking } from '../shared/confidence';
import type {
  ATSType, OverlayState, FitScore, JobDescription,
  UserProfile, DecisionNode,
} from '../shared/types';
import type { FillResult } from '../content/field-filler';

interface OpenEndedTarget {
  key: string;
  element: HTMLTextAreaElement;
}

export interface OverlayCallbacks {
  scanAndFill: () => Promise<FillResult[]>;
  getJD: () => JobDescription;
  getProfile: () => Promise<UserProfile | null>;
  fillOpenEnded: (element: HTMLTextAreaElement, text: string) => void;
  focusField: (key: string) => void;
}

interface Props {
  atsType: ATSType;
  callbacks: OverlayCallbacks;
}

// Fixed-position widgets that commonly occupy bottom-right corner
const BOTTOM_RIGHT_WIDGETS = [
  '.grecaptcha-badge',
  'iframe[src*="recaptcha"]',
  '[class*="intercom-launcher"]',
  '[id*="hubspot-messages"]',
  '[class*="drift-widget-controller"]',
  '[class*="crisp-client"]',
  '[id="chat-widget-container"]',
  '.cc-window',
];

function useBottomOffset(): number {
  const [offset, setOffset] = useState(24);

  useEffect(() => {
    function measure() {
      let maxFromBottom = 0;
      for (const sel of BOTTOM_RIGHT_WIDGETS) {
        const el = document.querySelector<HTMLElement>(sel);
        if (!el) continue;
        const style = window.getComputedStyle(el);
        // Only care about fixed elements anchored to the right
        if (style.position !== 'fixed') continue;
        const rect = el.getBoundingClientRect();
        // Only care if it's actually in the right side of the screen
        if (rect.left < window.innerWidth / 2) continue;
        const fromBottom = window.innerHeight - rect.top;
        if (fromBottom > maxFromBottom) maxFromBottom = fromBottom;
      }
      setOffset(maxFromBottom > 0 ? maxFromBottom + 12 : 24);
    }

    measure();
    // Re-measure after widgets finish loading (reCAPTCHA renders late)
    const t1 = setTimeout(measure, 1000);
    const t2 = setTimeout(measure, 3000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  return offset;
}

export function GhostOverlay({ atsType: _atsType, callbacks }: Props) {
  const [state, setState] = useState<OverlayState>('idle');
  const [fit, setFit] = useState<FitScore | null>(null);
  const [jd, setJD] = useState<JobDescription | null>(null);
  const [results, setResults] = useState<FillResult[]>([]);
  const [showTree, setShowTree] = useState(false);
  const [openEnded, setOpenEnded] = useState<OpenEndedTarget | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  const bottomOffset = useBottomOffset();

  const filledCount = useMemo(() => results.filter((r) => r.filled).length, [results]);
  const totalCount = results.length;
  const blockingFields = useMemo(
    () => results.filter((r) => isBlocking(r.node.confidence)).map((r) => r.node.fieldKey),
    [results],
  );
  const treeNodes = useMemo<DecisionNode[]>(() => results.map((r) => r.node), [results]);

  // ── Pill click ────────────────────────────────────────────────────────────
  const handlePillClick = useCallback(async () => {
    if (state !== 'idle') return;
    try {
      const [parsedJD, userProfile] = await Promise.all([
        Promise.resolve(callbacks.getJD()),
        callbacks.getProfile(),
      ]);
      setJD(parsedJD);
      setProfile(userProfile);
      if (userProfile) setFit(computeFitScore(userProfile, parsedJD));
      setState('fit-check');
    } catch {
      setState('idle');
    }
  }, [state, callbacks]);

  // ── Fill sequence ─────────────────────────────────────────────────────────
  const handleFill = useCallback(async () => {
    setState('filling');
    let fillResults: FillResult[] = [];
    try {
      fillResults = await callbacks.scanAndFill();
    } catch {
      setState('idle');
      return;
    }
    setResults(fillResults);

    const openEndedFields = fillResults.filter(
      (r) => r.isOpenEnded && r.element instanceof HTMLTextAreaElement,
    );

    if (openEndedFields.length > 0) {
      const first = openEndedFields[0]!;
      setOpenEnded({ key: first.node.fieldKey, element: first.element as HTMLTextAreaElement });
    }

    const blocking = fillResults.filter((r) => isBlocking(r.node.confidence));
    setState(blocking.length > 0 ? 'blocked' : 'ready');
  }, [callbacks]);

  // ── Open-ended apply ──────────────────────────────────────────────────────
  const handleOpenEndedApply = useCallback((text: string) => {
    if (!openEnded) return;
    callbacks.fillOpenEnded(openEnded.element, text);
    setOpenEnded(null);
    const stillBlocking = results.filter(
      (r) => isBlocking(r.node.confidence) && r.node.fieldKey !== openEnded.key,
    );
    setState(stillBlocking.length > 0 ? 'blocked' : 'ready');
  }, [openEnded, results, callbacks]);

  return (
    <>
      <DynamicPill
        overlayState={state}
        filledCount={filledCount}
        totalCount={totalCount}
        hasBlocking={blockingFields.length > 0}
        onClick={handlePillClick}
        onTreeClick={() => setShowTree((v) => !v)}
        bottomOffset={bottomOffset}
      />

      {state === 'fit-check' && (
        <FitScoreModal
          fit={fit ?? { overall: 0, yearsMatch: false, keywordHits: [], keywordMisses: [], titleMatch: 'unrelated' }}
          jd={jd}
          bottomOffset={bottomOffset + 52}
          onFill={handleFill}
          onDismiss={() => setState('idle')}
        />
      )}

      {state === 'blocked' && blockingFields.length > 0 && (
        <SubmitGate
          blockingFields={blockingFields}
          onFocusField={callbacks.focusField}
          onDismiss={() => setState('review')}
        />
      )}

      {openEnded && (
        <OpenEndedHandler
          fieldKey={openEnded.key}
          company={jd?.company ?? ''}
          role={jd?.title ?? ''}
          profileSummary={profile?.resumeText ?? profile?.skills.join(', ') ?? ''}
          bottomOffset={bottomOffset + 52}
          onApply={handleOpenEndedApply}
          onClose={() => setOpenEnded(null)}
        />
      )}

      {showTree && (
        <DecisionTreePanel
          nodes={treeNodes}
          onClose={() => setShowTree(false)}
        />
      )}
    </>
  );
}
