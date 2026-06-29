import { detectATS } from './ats-detector';
import { scanForm } from './form-scanner';
import { fillField } from './field-filler';
import { attachSubmitInterceptor } from './submit-interceptor';
import { parseJD } from './jd-parser';
import { clearAllRings } from './confidence-ring';
import { sendToBackground } from '../shared/messages';
import type { ATSType, ConfidenceScore } from '../shared/types';
import type { OverlayCallbacks } from '../overlay/GhostOverlay';

const FORM_WAIT_TIMEOUT_MS = 5000;

async function bootstrap() {
  const atsType: ATSType = detectATS();
  await waitForForm(atsType);

  const scoreMap = new Map<string, ConfidenceScore>();

  const callbacks: OverlayCallbacks = {
    getJD: () => parseJD(),

    getProfile: async () => {
      const res = await sendToBackground({ type: 'GET_PROFILE' });
      return res.type === 'PROFILE' ? res.data : null;
    },

    scanAndFill: async () => {
      clearAllRings();
      scoreMap.clear();

      const res = await sendToBackground({ type: 'GET_PROFILE' });
      const profile = res.type === 'PROFILE' ? res.data : null;
      if (!profile) return [];

      const fields = scanForm(atsType);
      const results = fields.map((f) => {
        const r = fillField(f, profile, atsType);
        scoreMap.set(f.key, r.node.confidence);
        return r;
      });

      // Attach submit interceptor once we have scores
      const form = document.querySelector('form');
      if (form) {
        attachSubmitInterceptor(form, () => scoreMap, (blocking) => {
          // The overlay handles the UI — dispatch a custom event
          form.dispatchEvent(new CustomEvent('ghost:blocked', { detail: blocking, bubbles: true }));
        });
      }

      return results;
    },

    fillOpenEnded: (element, text) => {
      const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')?.set;
      if (setter) setter.call(element, text);
      element.dispatchEvent(new Event('input', { bubbles: true }));
      element.dispatchEvent(new Event('change', { bubbles: true }));
    },

    focusField: (key) => {
      try {
        const escaped = CSS.escape(key);
        const el = document.querySelector<HTMLElement>(
          `[name="${escaped}"], [id="${escaped}"]`,
        );
        if (el) {
          el.focus();
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      } catch {
        // key not usable as CSS selector — skip
      }
    },
  };

  const { mountOverlay } = await import('../overlay/index');
  mountOverlay(atsType, callbacks);
}

function waitForForm(atsType: ATSType): Promise<void> {
  const SELECTORS: Record<ATSType, string> = {
    greenhouse: '#application_form',
    workday:    '[data-automation-id="formContainer"]',
    lever:      '.application-form',
    icims:      '#iCIMS_MainColumn',
    bamboohr:   '#applicationForm',
    ashby:      '[data-testid="application-form"]',
    loxo:       'form',
    generic:    'form',
  };

  const selector = SELECTORS[atsType];
  return new Promise((resolve) => {
    if (document.querySelector(selector)) { resolve(); return; }
    const observer = new MutationObserver(() => {
      if (document.querySelector(selector)) { observer.disconnect(); resolve(); }
    });
    observer.observe(document.body, { childList: true, subtree: true });
    setTimeout(() => { observer.disconnect(); resolve(); }, FORM_WAIT_TIMEOUT_MS);
  });
}

bootstrap();
