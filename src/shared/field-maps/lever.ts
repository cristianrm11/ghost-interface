import type { ATSFieldMap } from '../types';

// Lever uses free-text experience area — no structured per-entry fields.
export const LEVER_FIELD_MAP: ATSFieldMap = {
  experienceOrder: 'newest-first',
  fieldSelectors: {
    'name': 'personal.fullName', // Lever combines first+last into one field
    'email': 'personal.email',
    'phone': 'personal.phone',
    'org': 'personal.location.city',
    'urls[LinkedIn]': 'personal.linkedIn',
    'urls[GitHub]': 'personal.github',
    'urls[Portfolio]': 'personal.portfolio',
  },
  openEndedSelectors: ['.application-additional textarea', 'textarea'],
};
