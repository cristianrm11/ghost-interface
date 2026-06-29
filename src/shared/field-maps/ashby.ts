import type { ATSFieldMap } from '../types';

export const ASHBY_FIELD_MAP: ATSFieldMap = {
  experienceOrder: 'newest-first',
  fieldSelectors: {
    '_systemfield_name':         'personal.firstName',   // Ashby combines into one name field via first token
    '_systemfield_email':        'personal.email',
    '_systemfield_phone':        'personal.phone',
    '_systemfield_location':     'personal.location.city',
    '_systemfield_linkedin':     'personal.linkedIn',
    '_systemfield_github':       'personal.github',
    '_systemfield_website':      'personal.portfolio',
  },
  openEndedSelectors: ['[data-testid="application-form"] textarea', 'textarea'],
};
