import type { FieldDefinition, UserProfile, DecisionNode, ATSType } from '../shared/types';
import { scoreConfidence, isBlocking } from '../shared/confidence';
import { decorateRing } from './confidence-ring';

export interface FillResult {
  node: DecisionNode;
  filled: boolean;
  isOpenEnded: boolean;
  element: HTMLElement;
}

export function fillField(
  field: FieldDefinition,
  profile: UserProfile,
  atsType: ATSType,
): FillResult {
  const confidence = scoreConfidence(field.key, profile, field.charLimit);

  const isOpenEnded =
    field.type === 'textarea' && isBlocking(confidence);

  const fillMethod = (() => {
    if (isOpenEnded) return 'skipped' as const;
    if (confidence.level === 'high') return 'exact' as const;
    if (confidence.level === 'medium') return 'fuzzy' as const;
    if (confidence.level === 'low') return 'inferred' as const;
    return 'skipped' as const;
  })();

  const node: DecisionNode = {
    id: crypto.randomUUID(),
    fieldKey: field.key,
    atsType,
    confidence,
    fillMethod,
    timestamp: Date.now(),
    children: [],
  };

  // Decorate the real DOM element with a confidence ring
  decorateRing(field.element, confidence.level);

  let filled = false;
  if (confidence.value && !isOpenEnded && field.type !== 'file' && field.type !== 'select') {
    setNativeValue(field.element, confidence.value);
    filled = true;
  }

  return { node, filled, isOpenEnded, element: field.element };
}

// Trigger framework synthetic events after setting value.
function setNativeValue(el: HTMLElement, value: string) {
  const inputDescriptor = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value');
  const textareaDescriptor = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value');

  if (el instanceof HTMLTextAreaElement && textareaDescriptor?.set) {
    textareaDescriptor.set.call(el, value);
  } else if (el instanceof HTMLInputElement && inputDescriptor?.set) {
    inputDescriptor.set.call(el, value);
  } else {
    (el as HTMLInputElement).value = value;
  }

  el.dispatchEvent(new Event('input', { bubbles: true }));
  el.dispatchEvent(new Event('change', { bubbles: true }));
}
