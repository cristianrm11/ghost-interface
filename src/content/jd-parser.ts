import type { JobDescription } from '../shared/types';

const YOE_PATTERN = /(\d+)\+?\s*(?:years?|yrs?)\s*(?:of\s+)?(?:experience|exp)/i;
const TITLE_SELECTORS = ['h1', '[data-qa="job-title"]', '.job-title', '.posting-headline h2'];

export function parseJD(): JobDescription {
  const rawText = document.body.innerText;
  const title = extractTitle();
  const company = extractCompany();
  const yearsRequired = extractYOE(rawText);
  const { required, niceToHave } = extractSkills(rawText);

  return { title, company, yearsRequired, requiredSkills: required, niceToHaveSkills: niceToHave, rawText };
}

function extractTitle(): string {
  for (const sel of TITLE_SELECTORS) {
    const el = document.querySelector(sel);
    if (el?.textContent) return el.textContent.trim();
  }
  return document.title.split('|')[0]?.trim() ?? '';
}

function extractCompany(): string {
  const meta = document.querySelector<HTMLMetaElement>('meta[property="og:site_name"]');
  return meta?.content ?? '';
}

function extractYOE(text: string): number {
  const match = YOE_PATTERN.exec(text);
  return match ? parseInt(match[1]!, 10) : 0;
}

function extractSkills(text: string): { required: string[]; niceToHave: string[] } {
  const COMMON_SKILLS = [
    'TypeScript', 'JavaScript', 'Python', 'React', 'Node.js', 'Go', 'Rust',
    'AWS', 'GCP', 'Azure', 'Docker', 'Kubernetes', 'PostgreSQL', 'Redis',
    'GraphQL', 'REST', 'CI/CD', 'Git',
  ];
  const lower = text.toLowerCase();
  const required = COMMON_SKILLS.filter((s) => lower.includes(s.toLowerCase()));
  return { required, niceToHave: [] };
}
