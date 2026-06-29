import type { ATSFieldMap } from '../types';

export const BAMBOOHR_FIELD_MAP: ATSFieldMap = {
  experienceOrder: 'newest-first',
  fieldSelectors: {
    'firstName':   'personal.firstName',
    'lastName':    'personal.lastName',
    'email':       'personal.email',
    'phone':       'personal.phone',
    'address':     'personal.location.city',
    'linkedinUrl': 'personal.linkedIn',
    'websiteUrl':  'personal.portfolio',
  },
  openEndedSelectors: ['.BhrAntForm-section textarea', 'textarea'],
};
