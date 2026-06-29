import type { ATSFieldMap } from '../types';

// Workday renders experience oldest-first and requires month+year on date fields.
export const WORKDAY_FIELD_MAP: ATSFieldMap = {
  experienceOrder: 'oldest-first',
  fieldSelectors: {
    'legalNameSection_firstName': 'personal.firstName',
    'legalNameSection_lastName': 'personal.lastName',
    'email-0': 'personal.email',
    'phone-0': 'personal.phone',
    'addressSection_city': 'personal.location.city',
    'addressSection_countryRegion': 'personal.location.state',
  },
  openEndedSelectors: ['[data-automation-id="additionalInfo"] textarea', 'textarea'],
};
