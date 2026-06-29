import type { ATSFieldMap } from '../types';

export const ICIMS_FIELD_MAP: ATSFieldMap = {
  experienceOrder: 'newest-first',
  fieldSelectors: {
    'input_applicant_firstname':  'personal.firstName',
    'input_applicant_lastname':   'personal.lastName',
    'input_applicant_email':      'personal.email',
    'input_applicant_phone':      'personal.phone',
    'input_applicant_city':       'personal.location.city',
    'input_applicant_state':      'personal.location.state',
    'input_applicant_country':    'personal.location.country',
    'input_applicant_linkedin':   'personal.linkedIn',
    'input_applicant_website':    'personal.portfolio',
  },
  openEndedSelectors: ['.iCIMS_FieldWrapper textarea', 'textarea'],
};
