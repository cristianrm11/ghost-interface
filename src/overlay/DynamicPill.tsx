import type { OverlayState } from '../shared/types';

interface Props {
  overlayState: OverlayState;
  filledCount: number;
  totalCount: number;
  hasBlocking: boolean;
  onClick: () => void;
  onTreeClick: () => void;
  bottomOffset: number;
}

const STATE_DOT: Record<OverlayState, string> = {
  idle:       '#6b7280',
  'fit-check':'#3b82f6',
  filling:    '#f59e0b',
  review:     '#f59e0b',
  blocked:    '#ef4444',
  ready:      '#22c55e',
};

const STATE_LABEL: Record<OverlayState, string> = {
  idle:       'Ghost Interface',
  'fit-check':'Checking fit…',
  filling:    'Filling…',
  review:     'Review fields',
  blocked:    'Review required',
  ready:      'Ready to submit',
};

export function DynamicPill({ overlayState, filledCount, totalCount, onClick, onTreeClick, bottomOffset }: Props) {
  const dotColor = STATE_DOT[overlayState];
  const label = overlayState === 'idle' || overlayState === 'fit-check'
    ? STATE_LABEL[overlayState]
    : `${STATE_LABEL[overlayState]}  ${filledCount}/${totalCount}`;

  const isGlowing = overlayState === 'ready';

  return (
    <div
      style={{
        position: 'fixed', bottom: `${bottomOffset}px`, right: '24px',
        display: 'flex', alignItems: 'center', gap: '2px',
        zIndex: 2147483647,
      }}
    >
      {/* Main pill */}
      <button
        data-ghost="pill"
        onClick={onClick}
        style={{
          background: 'rgba(15,15,15,0.90)',
          color: '#f9fafb',
          border: 'none',
          borderRadius: '20px 6px 6px 20px',
          padding: '8px 14px',
          fontSize: '12px',
          fontFamily: 'system-ui, sans-serif',
          fontWeight: 500,
          cursor: 'pointer',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          display: 'flex',
          alignItems: 'center',
          gap: '7px',
          boxShadow: isGlowing
            ? '0 0 14px #22c55e44, 0 2px 12px rgba(0,0,0,0.25)'
            : '0 2px 12px rgba(0,0,0,0.25)',
          letterSpacing: '0.01em',
          transition: 'box-shadow 400ms ease',
          userSelect: 'none',
        }}
      >
        <span
          style={{
            width: '7px', height: '7px', borderRadius: '50%',
            background: dotColor, flexShrink: 0,
            boxShadow: isGlowing ? `0 0 6px ${dotColor}` : undefined,
            transition: 'background 300ms ease',
          }}
        />
        {label}
      </button>

      {/* Tree icon button */}
      <button
        onClick={onTreeClick}
        title="Decision tree"
        style={{
          background: 'rgba(15,15,15,0.90)',
          color: '#6b7280',
          border: 'none',
          borderRadius: '6px 20px 20px 6px',
          padding: '8px 12px',
          fontSize: '13px',
          cursor: 'pointer',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          boxShadow: '0 2px 12px rgba(0,0,0,0.25)',
          lineHeight: 1,
        }}
      >
        ⬡
      </button>
    </div>
  );
}
