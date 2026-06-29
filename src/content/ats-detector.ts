import type { ATSType } from '../shared/types';

interface ATSSignature {
  type: ATSType;
  urlPatterns: RegExp[];
  domSelectors: string[];
}

const SIGNATURES: ATSSignature[] = [
  {
    type: 'greenhouse',
    urlPatterns: [/boards\.greenhouse\.io/, /job-boards\.greenhouse\.io/, /greenhouse\.io\/applications/],
    domSelectors: ['#application_form', '[data-source="greenhouse"]'],
  },
  {
    type: 'workday',
    urlPatterns: [/myworkdayjobs\.com/, /wd\d+\.myworkday\.com/],
    domSelectors: ['[data-automation-id="formContainer"]', '[data-uxi-widget-type]'],
  },
  {
    type: 'lever',
    urlPatterns: [/jobs\.lever\.co/],
    domSelectors: ['.application-form', '[data-qa="apply-form"]', '#application-form'],
  },
  {
    type: 'icims',
    urlPatterns: [/\.icims\.com/],
    domSelectors: ['#iCIMS_MainColumn'],
  },
  {
    type: 'bamboohr',
    urlPatterns: [/bamboohr\.com\/careers/],
    domSelectors: ['.applicationQuestion', '#applicationForm'],
  },
  {
    type: 'ashby',
    urlPatterns: [/jobs\.ashbyhq\.com/],
    domSelectors: ['[data-testid="application-form"]'],
  },
];

export function detectATS(
  url: string = window.location.href,
  doc: Document = document,
): ATSType {
  for (const sig of SIGNATURES) {
    if (sig.urlPatterns.some((p) => p.test(url))) return sig.type;
  }
  for (const sig of SIGNATURES) {
    if (sig.domSelectors.some((sel) => doc.querySelector(sel) !== null)) return sig.type;
  }
  return 'generic';
}
