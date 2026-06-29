import type { ATSType, FieldDefinition, FieldType } from '../shared/types';

export function scanForm(atsType: ATSType): FieldDefinition[] {
  const form = document.querySelector('form');
  if (!form) return [];

  const elements = Array.from(
    form.querySelectorAll<HTMLElement>('input, textarea, select'),
  );

  return elements
    .filter((el) => !isHidden(el) && !isSubmitButton(el) && !isInternalWidget(el))
    .map((el) => ({
      element: el,
      key: deriveKey(el),
      type: deriveType(el),
      charLimit: getCharLimit(el),
      required: (el as HTMLInputElement).required,
    }));
}

function deriveKey(el: HTMLElement): string {
  // 1. Label text is most human-readable (covers Greenhouse numeric IDs)
  const labelText = findLabelText(el);
  if (labelText) return labelText;

  // 2. aria-label
  const ariaLabel = el.getAttribute('aria-label');
  if (ariaLabel && !isGenericAriaLabel(ariaLabel)) return ariaLabel;

  // 3. name (trim Greenhouse verbose path e.g. job_application[answers_attributes][0][text_value])
  const name = el.getAttribute('name');
  if (name) return simplifyName(name);

  // 4. id
  const id = el.getAttribute('id');
  if (id) return id;

  return el.getAttribute('placeholder') ?? 'unknown';
}

function findLabelText(el: HTMLElement): string | null {
  const id = el.getAttribute('id');
  if (id) {
    try {
      const label = document.querySelector<HTMLLabelElement>(`label[for="${CSS.escape(id)}"]`);
      const text = label?.textContent?.trim().replace(/\s+/g, ' ').replace(/\s*\*\s*$/, '').trim();
      if (text && text.length > 1) return text;
    } catch { /* CSS.escape not available in very old browsers */ }
  }

  // aria-labelledby (spec allows space-separated list of IDs)
  const labelledBy = el.getAttribute('aria-labelledby');
  if (labelledBy) {
    const text = labelledBy
      .split(' ')
      .map((id) => document.getElementById(id)?.textContent?.trim())
      .filter(Boolean)
      .join(' ');
    if (text) return text;
  }

  // Ancestor label
  const parentLabel = el.closest('label');
  if (parentLabel) {
    // Clone and remove the input itself to get only label text
    const clone = parentLabel.cloneNode(true) as HTMLElement;
    clone.querySelectorAll('input,textarea,select').forEach((n) => n.remove());
    const text = clone.textContent?.trim().replace(/\s+/g, ' ');
    if (text && text.length > 1) return text;
  }

  return null;
}

// Simplify verbose Greenhouse-style names like job_application[answers_attributes][0][text_value]
function simplifyName(name: string): string {
  const bracketMatch = name.match(/\[([^\]]+)\]$/);
  if (bracketMatch) return bracketMatch[1] ?? name;
  return name;
}

// Filter out aria-labels that are internal widget labels, not user-facing field names
function isGenericAriaLabel(label: string): boolean {
  const lower = label.toLowerCase();
  return (
    lower.includes('search input') ||
    lower.includes('combobox') ||
    /^\w{2,4}\s+\d+\s+/.test(lower) // patterns like "lti 0 search input"
  );
}

function deriveType(el: HTMLElement): FieldType {
  if (el.tagName === 'TEXTAREA') return 'textarea';
  if (el.tagName === 'SELECT') return 'select';
  const type = (el as HTMLInputElement).type?.toLowerCase();
  if (type === 'email') return 'email';
  if (type === 'tel') return 'phone';
  if (type === 'file') return 'file';
  if (type === 'checkbox') return 'checkbox';
  if (type === 'text' || type === 'search') return 'text';
  return 'unknown';
}

function getCharLimit(el: HTMLElement): number | undefined {
  const max = el.getAttribute('maxlength');
  return max ? parseInt(max, 10) : undefined;
}

function isHidden(el: HTMLElement): boolean {
  return (el as HTMLInputElement).type === 'hidden' ||
    el.getAttribute('aria-hidden') === 'true';
}

function isSubmitButton(el: HTMLElement): boolean {
  return (el as HTMLInputElement).type === 'submit';
}

// Autocomplete typeahead inputs used internally by Greenhouse/Workday (not user-facing fields)
function isInternalWidget(el: HTMLElement): boolean {
  const role = el.getAttribute('role');
  if (role === 'combobox' || role === 'option') return true;
  const ariaLabel = (el.getAttribute('aria-label') ?? '').toLowerCase();
  if (isGenericAriaLabel(ariaLabel)) return true;
  // Greenhouse location typeahead uses "location-input" or similar internal IDs
  const id = (el.getAttribute('id') ?? '').toLowerCase();
  if (id.includes('autocomplete') || id.includes('typeahead') || id.includes('search-input')) return true;
  return false;
}
