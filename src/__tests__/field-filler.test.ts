import { describe, it, expect, beforeEach, vi } from 'vitest';
import { fillField } from '../content/field-filler';
import type { UserProfile, FieldDefinition } from '../shared/types';

// Stub DOM-only side effects that don't run in jsdom
vi.mock('../content/confidence-ring', () => ({
  decorateRing: vi.fn(),
}));

const profile: UserProfile = {
  personal: {
    firstName: 'Jane',
    lastName: 'Smith',
    email: 'jane@example.com',
    phone: '+1-555-9900',
    location: { city: 'Austin', state: 'TX', country: 'US' },
    linkedIn: 'https://linkedin.com/in/janesmith',
    github: 'https://github.com/janesmith',
    portfolio: 'https://janesmith.dev',
  },
  experience: [],
  education: [],
  skills: ['TypeScript', 'Playwright'],
  resumeText: '',
  yearsOfExperience: 5,
};

function makeField(overrides: Partial<FieldDefinition> & { element?: HTMLElement }): FieldDefinition {
  const el = overrides.element ?? document.createElement('input');
  return {
    element: el,
    key: 'first_name',
    type: 'text',
    required: false,
    charLimit: undefined,
    ...overrides,
  };
}

describe('fillField', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  describe('high-confidence fields', () => {
    it('fills firstName with exact match', () => {
      const el = document.createElement('input');
      const field = makeField({ element: el, key: 'firstname', type: 'text' });
      const result = fillField(field, profile, 'generic');

      expect(result.filled).toBe(true);
      expect(result.node.fillMethod).toBe('exact');
      expect(result.node.confidence.level).toBe('high');
      expect(el.value).toBe('Jane');
    });

    it('fills email with exact match', () => {
      const el = document.createElement('input');
      const field = makeField({ element: el, key: 'email', type: 'email' });
      const result = fillField(field, profile, 'generic');

      expect(result.filled).toBe(true);
      expect(el.value).toBe('jane@example.com');
    });

    it('fills phone with exact match', () => {
      const el = document.createElement('input');
      const field = makeField({ element: el, key: 'phone', type: 'phone' });
      const result = fillField(field, profile, 'generic');

      expect(result.filled).toBe(true);
      expect(el.value).toBe('+1-555-9900');
    });
  });

  describe('medium-confidence fields', () => {
    it('fills fuzzy-matched field and marks method as fuzzy', () => {
      const el = document.createElement('input');
      // 'emailInput' normalizes to 'emailinput' — not an exact key but includes 'email'
      // charOverlapScore returns 0.85, triggering medium/fuzzy path
      const field = makeField({ element: el, key: 'emailInput', type: 'email' });
      const result = fillField(field, profile, 'generic');

      expect(result.filled).toBe(true);
      expect(result.node.fillMethod).toBe('fuzzy');
    });
  });

  describe('open-ended textarea fields', () => {
    it('skips filling a low-confidence textarea', () => {
      const el = document.createElement('textarea');
      const field = makeField({ element: el as unknown as HTMLElement, key: 'cover_letter', type: 'textarea', charLimit: 5000 });
      const result = fillField(field, profile, 'generic');

      expect(result.filled).toBe(false);
      expect(result.isOpenEnded).toBe(true);
      expect(result.node.fillMethod).toBe('skipped');
      expect((el as HTMLTextAreaElement).value).toBe('');
    });
  });

  describe('file and select fields', () => {
    it('never fills a file input', () => {
      const el = document.createElement('input');
      (el as HTMLInputElement).type = 'file';
      const field = makeField({ element: el, key: 'resume', type: 'file' });
      const result = fillField(field, profile, 'generic');

      expect(result.filled).toBe(false);
    });

    it('never fills a select element', () => {
      const el = document.createElement('select');
      const field = makeField({ element: el as unknown as HTMLElement, key: 'country', type: 'select' });
      const result = fillField(field, profile, 'generic');

      expect(result.filled).toBe(false);
    });
  });

  describe('decision node', () => {
    it('returns a node with a UUID id', () => {
      const field = makeField({ key: 'email', type: 'email' });
      const result = fillField(field, profile, 'greenhouse');

      expect(result.node.id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
      );
      expect(result.node.atsType).toBe('greenhouse');
      expect(result.node.timestamp).toBeGreaterThan(0);
    });

    it('emits input and change events after fill', () => {
      const el = document.createElement('input');
      const inputSpy = vi.fn();
      const changeSpy = vi.fn();
      el.addEventListener('input', inputSpy);
      el.addEventListener('change', changeSpy);

      const field = makeField({ element: el, key: 'email', type: 'email' });
      fillField(field, profile, 'generic');

      expect(inputSpy).toHaveBeenCalledOnce();
      expect(changeSpy).toHaveBeenCalledOnce();
    });
  });
});
