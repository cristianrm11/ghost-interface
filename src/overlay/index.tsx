import { createRoot } from 'react-dom/client';
import { GhostOverlay } from './GhostOverlay';
import type { ATSType } from '../shared/types';
import type { OverlayCallbacks } from './GhostOverlay';

export function mountOverlay(atsType: ATSType, callbacks: OverlayCallbacks): void {
  if (document.getElementById('ghost-interface-host')) return;

  const host = document.createElement('div');
  host.id = 'ghost-interface-host';
  host.style.cssText = 'all:initial;position:fixed;z-index:2147483647;pointer-events:none;';
  document.body.appendChild(host);

  const shadow = host.attachShadow({ mode: 'closed' });
  const container = document.createElement('div');
  container.style.pointerEvents = 'auto';
  shadow.appendChild(container);

  createRoot(container).render(
    <GhostOverlay atsType={atsType} callbacks={callbacks} />,
  );
}
