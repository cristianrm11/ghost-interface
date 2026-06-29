import type { ATSFieldMap } from '../types';

// Fallback map — relies entirely on confidence fuzzy matching.
export const GENERIC_FIELD_MAP: ATSFieldMap = {
  experienceOrder: 'newest-first',
  fieldSelectors: {},
  openEndedSelectors: ['textarea', '[type="text"][maxlength]'],
};
