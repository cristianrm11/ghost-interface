import type { ATSFieldMap } from '../types';

export const GREENHOUSE_FIELD_MAP: ATSFieldMap = {
  experienceOrder: 'newest-first',
  fieldSelectors: {
    'job_application_first_name': 'personal.firstName',
    'job_application_last_name': 'personal.lastName',
    'job_application_email': 'personal.email',
    'job_application_phone': 'personal.phone',
    'job_application_location': 'personal.location.city',
    'linkedin_profile': 'personal.linkedIn',
    'website': 'personal.portfolio',
  },
  openEndedSelectors: ['[id*="custom_fields"]', 'textarea'],
};
