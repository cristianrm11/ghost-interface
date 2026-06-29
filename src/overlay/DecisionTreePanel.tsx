import { useMemo } from 'react';
import type { DecisionNode } from '../shared/types';
import { humanize } from '../shared/humanize';

interface Props {
  nodes: DecisionNode[];
  onClose: () => void;
}

const LEVEL_COLOR: Record<string, string> = {
  high:    '#22c55e',
  medium:  '#f59e0b',
  low:     '#ef4444',
  unknown: '#6b7280',
};

export function DecisionTreePanel({ nodes, onClose }: Props) {
  const stats = useMemo(() =>
    nodes.reduce(
      (acc, n) => { acc[n.confidence.level] = (acc[n.confidence.level] ?? 0) + 1; return acc; },
      {} as Record<string, number>,
    ),
  [nodes]);

  return (
    <div style={PANEL_STYLE}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
        <span style={{ fontWeight: 700, fontSize: '13px' }}>Decision Tree</span>
        <button onClick={onClose} style={CLOSE_BTN}>✕</button>
      </div>

      {/* Summary bar */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '14px' }}>
        {Object.entries(stats).map(([level, count]) => count > 0 && (
          <div key={level} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: LEVEL_COLOR[level], display: 'inline-block' }} />
            <span style={{ fontSize: '11px', color: '#9ca3af' }}>{count} {level}</span>
          </div>
        ))}
      </div>

      {nodes.length === 0 ? (
        <div style={{ color: '#4b5563', fontSize: '12px', textAlign: 'center', padding: '20px 0' }}>
          No decisions yet — click the pill to start filling
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '360px', overflowY: 'auto' }}>
          {nodes.map((node) => (
            <DecisionRow key={node.id} node={node} />
          ))}
        </div>
      )}

      <div style={{ marginTop: '14px', paddingTop: '12px', borderTop: '1px solid #1f2937', fontSize: '10px', color: '#374151' }}>
        Canvas DAG view — next iteration
      </div>
    </div>
  );
}

function DecisionRow({ node }: { node: DecisionNode }) {
  const color = LEVEL_COLOR[node.confidence.level];
  return (
    <div
      title={node.confidence.reason}
      style={{
        display: 'flex', alignItems: 'center', gap: '8px',
        padding: '6px 8px', borderRadius: '8px', background: '#0f172a',
        border: `1px solid ${color}22`,
      }}
    >
      <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: color, flexShrink: 0 }} />
      <span style={{ flex: 1, fontSize: '11px', color: '#d1d5db', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {humanize(node.fieldKey)}
      </span>
      <span style={{ fontSize: '10px', color: color, flexShrink: 0 }}>
        {Math.round(node.confidence.score * 100)}%
      </span>
      <span style={{ fontSize: '10px', color: '#4b5563', flexShrink: 0 }}>
        {node.fillMethod}
      </span>
    </div>
  );
}


const PANEL_STYLE: React.CSSProperties = {
  position: 'fixed',
  top: '50%',
  right: '24px',
  transform: 'translateY(-50%)',
  width: '280px',
  background: 'rgba(10,10,10,0.96)',
  color: '#f9fafb',
  borderRadius: '14px',
  padding: '18px 16px',
  fontFamily: 'system-ui, sans-serif',
  zIndex: 2147483646,
  boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
  backdropFilter: 'blur(16px)',
  border: '1px solid #1f2937',
};

const CLOSE_BTN: React.CSSProperties = {
  background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', fontSize: '13px',
};
