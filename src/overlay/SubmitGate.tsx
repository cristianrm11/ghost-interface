import { humanize } from '../shared/humanize';

interface Props {
  blockingFields: string[];
  onFocusField: (key: string) => void;
  onDismiss: () => void;
}

export function SubmitGate({ blockingFields, onFocusField, onDismiss }: Props) {
  return (
    <div data-ghost="submit-gate" style={GATE_STYLE}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
        <span style={{ fontSize: '16px', flexShrink: 0 }}>🔒</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, marginBottom: '6px', fontSize: '12px' }}>
            {blockingFields.length} field{blockingFields.length > 1 ? 's' : ''} need review before submitting
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {blockingFields.map((key) => (
              <button
                key={key}
                onClick={() => onFocusField(key)}
                style={FIELD_BTN}
                title={`Click to focus "${key}" field`}
              >
                {humanize(key)} ↗
              </button>
            ))}
          </div>
        </div>
        <button onClick={onDismiss} style={CLOSE_BTN}>✕</button>
      </div>
    </div>
  );
}


const GATE_STYLE: React.CSSProperties = {
  position: 'fixed',
  top: '16px',
  left: '50%',
  transform: 'translateX(-50%)',
  width: '480px',
  maxWidth: 'calc(100vw - 32px)',
  background: 'rgba(127,29,29,0.95)',
  color: '#fecaca',
  borderRadius: '12px',
  padding: '14px 16px',
  fontFamily: 'system-ui, sans-serif',
  fontSize: '12px',
  zIndex: 2147483646,
  boxShadow: '0 4px 24px rgba(239,68,68,0.3)',
  backdropFilter: 'blur(12px)',
  border: '1px solid #991b1b',
};

const FIELD_BTN: React.CSSProperties = {
  background: 'rgba(239,68,68,0.2)',
  border: '1px solid #991b1b',
  color: '#fca5a5',
  borderRadius: '6px',
  padding: '3px 10px',
  fontSize: '11px',
  cursor: 'pointer',
  fontFamily: 'system-ui, sans-serif',
};

const CLOSE_BTN: React.CSSProperties = {
  background: 'none', border: 'none', color: '#fca5a5',
  cursor: 'pointer', fontSize: '13px', padding: '0 2px', flexShrink: 0,
};
