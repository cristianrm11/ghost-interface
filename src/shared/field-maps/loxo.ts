import type { ATSFieldMap } from '../types';

export const LOXO_FIELD_MAP: ATSFieldMap = {
  experienceOrder: 'newest-first',
  fieldSelectors: {
    'first_name':   'personal.firstName',
    'last_name':    'personal.lastName',
    'email':        'personal.email',
    'phone':        'personal.phone',
    'city':         'personal.location.city',
    'state':        'personal.location.state',
    'linkedin_url': 'personal.linkedIn',
    'github_url':   'personal.github',
    'website_url':  'personal.portfolio',
  },
  openEndedSelectors: ['.loxo-application-form textarea', 'textarea'],
};
