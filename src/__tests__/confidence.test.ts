import { describe, it, expect } from 'vitest';
import { scoreConfidence, isBlocking } from '../shared/confidence';
import type { UserProfile } from '../shared/types';

const profile: UserProfile = {
  personal: {
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    phone: '+1-555-0100',
    location: { city: 'San Francisco', state: 'CA', country: 'US' },
    linkedIn: 'https://linkedin.com/in/johndoe',
    github: 'https://github.com/johndoe',
    portfolio: 'https://johndoe.dev',
  },
  experience: [],
  education: [],
  skills: ['TypeScript', 'React'],
  resumeText: '',
  yearsOfExperience: 3,
};

describe('scoreConfidence', () => {
  describe('exact matches', () => {
    it('scores first_name as high', () => {
      const r = scoreConfidence('first_name', profile);
      expect(r.level).toBe('high');
      expect(r.score).toBeGreaterThanOrEqual(0.9);
      expect(r.value).toBe('John');
    });

    it('scores email as high', () => {
      const r = scoreConfidence('email', profile);
      expect(r.level).toBe('high');
      expect(r.value).toBe('john@example.com');
    });

    it('scores linkedin as high', () => {
      const r = scoreConfidence('linkedin', profile);
      expect(r.level).toBe('high');
      expect(r.value).toContain('linkedin.com');
    });

    it('scores phone as high', () => {
      const r = scoreConfidence('phone', profile);
      expect(r.level).toBe('high');
      expect(r.value).toBe('+1-555-0100');
    });
  });

  describe('fuzzy matches', () => {
    it('scores firstName (camelCase) as at least medium', () => {
      const r = scoreConfidence('firstName', profile);
      expect(r.score).toBeGreaterThanOrEqual(0.6);
    });

    it('scores emailAddress as at least medium', () => {
      const r = scoreConfidence('emailAddress', profile);
      expect(r.score).toBeGreaterThanOrEqual(0.6);
    });
  });

  describe('open-ended fields', () => {
    it('scores "why_this_company" as low', () => {
      const r = scoreConfidence('why_this_company', profile);
      expect(r.level).toBe('low');
      expect(r.score).toBeLessThan(0.6);
      expect(r.value).toBeUndefined();
    });

    it('scores field with charLimit > 200 as low', () => {
      const r = scoreConfidence('additional_info', profile, 500);
      expect(r.level).toBe('low');
    });

    it('scores "cover_letter" as low', () => {
      const r = scoreConfidence('cover_letter', profile);
      expect(r.level).toBe('low');
    });
  });

  describe('unknown fields', () => {
    it('scores completely unknown field as unknown', () => {
      const r = scoreConfidence('xzqref_contact_99', profile);
      expect(r.level).toBe('unknown');
      expect(r.score).toBeLessThan(0.3);
    });

    it('never returns negative score', () => {
      const r = scoreConfidence('zzz_unrecognized', profile);
      expect(r.score).toBeGreaterThanOrEqual(0);
    });
  });
});

describe('isBlocking', () => {
  it('returns true for unknown confidence', () => {
    expect(isBlocking({ score: 0.1, level: 'unknown', reason: '', value: undefined })).toBe(true);
  });

  it('returns true for low confidence', () => {
    expect(isBlocking({ score: 0.4, level: 'low', reason: '', value: undefined })).toBe(true);
  });

  it('returns false for medium confidence', () => {
    expect(isBlocking({ score: 0.75, level: 'medium', reason: '', value: 'x' })).toBe(false);
  });

  it('returns false for high confidence', () => {
    expect(isBlocking({ score: 0.95, level: 'high', reason: '', value: 'x' })).toBe(false);
  });
});
