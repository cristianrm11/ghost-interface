import { describe, it, expect, beforeEach } from 'vitest';
import { detectATS } from '../content/ats-detector';

beforeEach(() => {
  document.body.innerHTML = '';
});

describe('detectATS — URL detection', () => {
  it('detects greenhouse by URL', () => {
    expect(detectATS('https://boards.greenhouse.io/stripe/jobs/12345')).toBe('greenhouse');
  });

  it('detects workday by myworkdayjobs.com URL', () => {
    expect(detectATS('https://amazon.myworkdayjobs.com/en-US/Amazon_Jobs/job/123')).toBe('workday');
  });

  it('detects workday by wd1.myworkday.com URL', () => {
    expect(detectATS('https://stripe.wd1.myworkday.com/stripe/d/inst/1$2000/9925$123.htmld')).toBe('workday');
  });

  it('detects lever by URL', () => {
    expect(detectATS('https://jobs.lever.co/stripe/abc-123')).toBe('lever');
  });

  it('detects icims by URL', () => {
    expect(detectATS('https://careers-apple.icims.com/jobs/apply')).toBe('icims');
  });

  it('detects bamboohr by URL', () => {
    expect(detectATS('https://acme.bamboohr.com/careers/42')).toBe('bamboohr');
  });

  it('detects ashby by URL', () => {
    expect(detectATS('https://jobs.ashbyhq.com/stripe/abc123/application')).toBe('ashby');
  });

  it('falls back to generic for unknown URLs', () => {
    expect(detectATS('https://careers.example.com/apply')).toBe('generic');
  });
});

describe('detectATS — DOM fallback', () => {
  it('detects greenhouse by #application_form selector', () => {
    document.body.innerHTML = '<form id="application_form"></form>';
    expect(detectATS('https://unknown-company.com/apply')).toBe('greenhouse');
  });

  it('detects lever by .application-form selector', () => {
    document.body.innerHTML = '<div class="application-form"></div>';
    expect(detectATS('https://unknown-company.com/apply')).toBe('lever');
  });

  it('returns generic when no DOM selectors match', () => {
    document.body.innerHTML = '<form><input type="text" /></form>';
    expect(detectATS('https://totally-unknown.com')).toBe('generic');
  });

  it('prefers URL match over DOM match', () => {
    // URL says lever but DOM has greenhouse selector — URL wins
    document.body.innerHTML = '<form id="application_form"></form>';
    expect(detectATS('https://jobs.lever.co/acme/123')).toBe('lever');
  });
});
