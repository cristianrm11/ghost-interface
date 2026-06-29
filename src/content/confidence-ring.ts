import type { ConfidenceLevel } from '../shared/types';

const RING_COLORS: Record<ConfidenceLevel, string> = {
  high:    '#22c55e',
  medium:  '#f59e0b',
  low:     '#ef4444',
  unknown: '#6b7280',
};

export function decorateRing(el: HTMLElement, level: ConfidenceLevel): void {
  el.style.setProperty('outline', `2px solid ${RING_COLORS[level]}`, 'important');
  el.style.setProperty('outline-offset', '2px', 'important');
  el.style.setProperty('border-radius', '4px', 'important');
  el.setAttribute('data-ghost', 'ring');
  el.setAttribute('data-ghost-level', level);
}

export function clearAllRings(): void {
  document.querySelectorAll<HTMLElement>('[data-ghost="ring"]').forEach((el) => {
    el.style.removeProperty('outline');
    el.style.removeProperty('outline-offset');
    el.style.removeProperty('border-radius');
    el.removeAttribute('data-ghost');
    el.removeAttribute('data-ghost-level');
  });
}
