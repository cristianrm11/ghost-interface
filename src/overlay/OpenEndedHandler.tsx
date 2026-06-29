import { useState } from 'react';
import type { OpenEndedVariant } from '../shared/types';
import { sendToBackground } from '../shared/messages';
import { humanize } from '../shared/humanize';

interface Props {
  fieldKey: string;
  company: string;
  role: string;
  profileSummary: string;
  bottomOffset: number;
  onApply: (text: string) => void;
  onClose: () => void;
}

const CONCISE_TEMPLATE = (company: string, role: string) =>
  `I'm excited about ${company}'s mission and this ${role} opportunity. My background aligns well with what you're looking for, and I'm eager to bring that experience to your team.`;

export function OpenEndedHandler({ fieldKey, company, role, profileSummary, bottomOffset, onApply, onClose }: Props) {
  const [variant, setVariant] = useState<OpenEndedVariant>('concise');
  const [customText, setCustomText] = useState('');
  const [detailedText, setDetailedText] = useState('');
  const [loading, setLoading] = useState(false);

  const conciseText = CONCISE_TEMPLATE(company || 'your company', role || 'this role');

  const previewText =
    variant === 'concise' ? conciseText :
    variant === 'detailed' ? (detailedText || '— click Generate —') :
    customText;

  async function handleGenerate() {
    if (variant !== 'detailed') return;
    setLoading(true);
    const res = await sendToBackground({
      type: 'GENERATE_OPEN_ENDED',
      payload: { fieldKey, question: fieldKey, company, role, variant: 'detailed', profileSummary },
    });
    if (res.type === 'OPEN_ENDED_TEXT') setDetailedText(res.text);
    setLoading(false);
  }

  function handleApply() {
    onApply(previewText);
  }

  return (
    <div style={PANEL_STYLE(bottomOffset)}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <span style={{ fontWeight: 700, fontSize: '12px', color: '#f9fafb' }}>Open-ended field</span>
        <button onClick={onClose} style={CLOSE_BTN}>✕</button>
      </div>

      <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '12px', wordBreak: 'break-word' }}>
        {humanize(fieldKey)}
      </div>

      {/* Variant selector */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '12px' }}>
        {(['concise', 'detailed', 'custom'] as OpenEndedVariant[]).map((v) => (
          <button
            key={v}
            onClick={() => setVariant(v)}
            style={{
              ...VARIANT_BTN,
              background: variant === v ? '#2563eb' : '#1f2937',
              color: variant === v ? '#fff' : '#9ca3af',
              border: `1px solid ${variant === v ? '#2563eb' : '#374151'}`,
            }}
          >
            {v.charAt(0).toUpperCase() + v.slice(1)}
          </button>
        ))}
      </div>

      {/* Preview / edit area */}
      {variant === 'custom' ? (
        <textarea
          value={customText}
          onChange={(e) => setCustomText(e.target.value)}
          placeholder="Write your answer here…"
          rows={5}
          style={TEXTAREA_STYLE}
        />
      ) : (
        <div style={PREVIEW_STYLE}>
          {loading ? '⏳ Generating…' : previewText}
        </div>
      )}

      <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
        <button onClick={handleApply} style={{ ...ACTION_BTN, background: '#2563eb' }} disabled={!previewText || previewText === '— click Generate —'}>
          Use This
        </button>
        {variant === 'detailed' && (
          <button onClick={handleGenerate} style={{ ...ACTION_BTN, background: '#374151' }} disabled={loading}>
            {loading ? '…' : 'Generate'}
          </button>
        )}
      </div>
    </div>
  );
}


const PANEL_STYLE = (bottom: number): React.CSSProperties => ({
  position: 'fixed',
  bottom: `${bottom}px`,
  right: '24px',
  width: '300px',
  background: 'rgba(10,10,10,0.95)',
  borderRadius: '14px',
  padding: '16px',
  fontFamily: 'system-ui, sans-serif',
  zIndex: 2147483646,
  boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
  backdropFilter: 'blur(16px)',
  border: '1px solid #1f2937',
});

const CLOSE_BTN: React.CSSProperties = {
  background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', fontSize: '13px',
};

const VARIANT_BTN: React.CSSProperties = {
  flex: 1, fontSize: '11px', fontWeight: 500, borderRadius: '6px',
  padding: '5px 0', cursor: 'pointer', fontFamily: 'system-ui, sans-serif',
};

const PREVIEW_STYLE: React.CSSProperties = {
  background: '#111827', borderRadius: '8px', padding: '10px',
  fontSize: '12px', color: '#d1d5db', lineHeight: 1.6, minHeight: '80px',
};

const TEXTAREA_STYLE: React.CSSProperties = {
  width: '100%', background: '#111827', border: '1px solid #374151',
  borderRadius: '8px', padding: '10px', fontSize: '12px', color: '#f9fafb',
  resize: 'vertical', fontFamily: 'system-ui, sans-serif', lineHeight: 1.6,
  boxSizing: 'border-box',
};

const ACTION_BTN: React.CSSProperties = {
  flex: 1, color: '#fff', border: 'none', borderRadius: '8px',
  padding: '8px', fontSize: '12px', fontWeight: 600, cursor: 'pointer',
  fontFamily: 'system-ui, sans-serif',
};
