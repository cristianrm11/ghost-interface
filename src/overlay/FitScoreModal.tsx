import type { FitScore, JobDescription } from '../shared/types';

interface Props {
  fit: FitScore;
  jd: JobDescription | null;
  bottomOffset: number;
  onFill: () => void;
  onDismiss: () => void;
}

export function FitScoreModal({ fit, jd, bottomOffset, onFill, onDismiss }: Props) {
  const scoreColor =
    fit.overall >= 80 ? '#22c55e' :
    fit.overall >= 60 ? '#f59e0b' : '#ef4444';

  return (
    <div style={MODAL_STYLE(bottomOffset)}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
        <span style={{ fontWeight: 700, fontSize: '13px' }}>⚡ Fit Check</span>
        <button onClick={onDismiss} style={CLOSE_BTN}>✕</button>
      </div>

      {jd?.title && (
        <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '12px' }}>
          {jd.company ? `${jd.company} — ` : ''}{jd.title}
        </div>
      )}

      {/* Score ring */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
        <svg width="52" height="52" viewBox="0 0 52 52">
          <circle cx="26" cy="26" r="22" fill="none" stroke="#1f2937" strokeWidth="5" />
          <circle
            cx="26" cy="26" r="22" fill="none"
            stroke={scoreColor} strokeWidth="5"
            strokeDasharray={`${2 * Math.PI * 22 * fit.overall / 100} ${2 * Math.PI * 22}`}
            strokeLinecap="round"
            transform="rotate(-90 26 26)"
            style={{ transition: 'stroke-dasharray 600ms ease' }}
          />
          <text x="26" y="30" textAnchor="middle" fill="#f9fafb" fontSize="12" fontWeight="700">
            {fit.overall}%
          </text>
        </svg>
        <div>
          <div style={{ fontSize: '12px', color: fit.yearsMatch ? '#22c55e' : '#ef4444', marginBottom: '4px' }}>
            {fit.yearsMatch ? '✓' : '✗'} Years of experience
          </div>
          <div style={{ fontSize: '12px', color: '#9ca3af' }}>
            {fit.keywordHits.length}/{fit.keywordHits.length + fit.keywordMisses.length} skills matched
          </div>
        </div>
      </div>

      {/* Keyword breakdown */}
      {(fit.keywordHits.length > 0 || fit.keywordMisses.length > 0) && (
        <div style={{ marginBottom: '16px' }}>
          {fit.keywordHits.slice(0, 5).map((k) => (
            <Tag key={k} label={k} color="#166534" bg="#052e16" />
          ))}
          {fit.keywordMisses.slice(0, 4).map((k) => (
            <Tag key={k} label={`✗ ${k}`} color="#991b1b" bg="#2d0a0a" />
          ))}
        </div>
      )}

      <div style={{ display: 'flex', gap: '8px' }}>
        <button onClick={onFill} style={{ ...ACTION_BTN, background: scoreColor }}>
          Fill Anyway
        </button>
        <button onClick={onDismiss} style={{ ...ACTION_BTN, background: '#374151' }}>
          Dismiss
        </button>
      </div>
    </div>
  );
}

function Tag({ label, color, bg }: { label: string; color: string; bg: string }) {
  return (
    <span style={{
      display: 'inline-block', fontSize: '10px', padding: '2px 7px',
      borderRadius: '10px', margin: '2px 3px 2px 0',
      color, background: bg, border: `1px solid ${color}44`,
    }}>
      {label}
    </span>
  );
}

const MODAL_STYLE = (bottom: number): React.CSSProperties => ({
  position: 'fixed',
  bottom: `${bottom}px`,
  right: '24px',
  width: '280px',
  background: 'rgba(10,10,10,0.94)',
  color: '#f9fafb',
  borderRadius: '14px',
  padding: '18px 20px',
  fontFamily: 'system-ui, sans-serif',
  fontSize: '13px',
  zIndex: 2147483646,
  boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
  backdropFilter: 'blur(16px)',
  border: '1px solid #1f2937',
});

const CLOSE_BTN: React.CSSProperties = {
  background: 'none', border: 'none', color: '#6b7280',
  cursor: 'pointer', fontSize: '13px', padding: '0 2px',
};

const ACTION_BTN: React.CSSProperties = {
  flex: 1, color: '#fff', border: 'none', borderRadius: '8px',
  padding: '8px', fontSize: '12px', fontWeight: 600, cursor: 'pointer',
};
