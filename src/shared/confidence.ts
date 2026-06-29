import type { UserProfile, ConfidenceScore, ConfidenceLevel } from './types';

// Direct field-key → profile getter mappings (normalized keys, no separators)
const EXACT_MAPPINGS: Record<string, (p: UserProfile) => string | undefined> = {
  firstname: (p) => p.personal.firstName,
  first: (p) => p.personal.firstName,
  lastname: (p) => p.personal.lastName,
  last: (p) => p.personal.lastName,
  fullname: (p) => `${p.personal.firstName} ${p.personal.lastName}`,
  name: (p) => `${p.personal.firstName} ${p.personal.lastName}`,
  email: (p) => p.personal.email,
  emailaddress: (p) => p.personal.email,
  phone: (p) => p.personal.phone,
  phonenumber: (p) => p.personal.phone,
  mobile: (p) => p.personal.phone,
  city: (p) => p.personal.location.city,
  state: (p) => p.personal.location.state,
  country: (p) => p.personal.location.country,
  location: (p) => `${p.personal.location.city}, ${p.personal.location.state}`,
  linkedin: (p) => p.personal.linkedIn,
  linkedinprofile: (p) => p.personal.linkedIn,
  linkedinurl: (p) => p.personal.linkedIn,
  github: (p) => p.personal.github,
  githuburl: (p) => p.personal.github,
  website: (p) => p.personal.portfolio,
  portfolio: (p) => p.personal.portfolio,
  websiteurl: (p) => p.personal.portfolio,
};

const OPEN_ENDED_KEYWORDS = [
  'why', 'tell', 'describe', 'explain', 'coverletter', 'cover',
  'additional', 'comments', 'message', 'motivation', 'passion', 'interest',
  'strength', 'weakness', 'challenge', 'achieve', 'experience',
];

function normalize(s: string): string {
  return s.toLowerCase().replace(/[\s_\-[\]().]/g, '');
}

function charOverlapScore(a: string, b: string): number {
  const na = normalize(a);
  const nb = normalize(b);
  if (na === nb) return 1.0;
  if (na.includes(nb) || nb.includes(na)) return 0.85;
  const longer = na.length >= nb.length ? na : nb;
  const shorter = na.length < nb.length ? na : nb;
  let hits = 0;
  for (const ch of shorter) {
    if (longer.includes(ch)) hits++;
  }
  return hits / Math.max(longer.length, 1);
}

function isOpenEnded(fieldKey: string, charLimit?: number): boolean {
  if (charLimit !== undefined && charLimit > 200) return true;
  const n = normalize(fieldKey);
  return OPEN_ENDED_KEYWORDS.some((kw) => n.includes(kw));
}

export function scoreConfidence(
  fieldKey: string,
  profile: UserProfile,
  charLimit?: number,
): ConfidenceScore {
  const n = normalize(fieldKey);

  // 1. Exact match
  if (n in EXACT_MAPPINGS) {
    const value = EXACT_MAPPINGS[n]!(profile);
    if (value) return score(0.95, 'high', 'Direct profile match', value);
  }

  // 2. Fuzzy match
  let bestScore = 0;
  let bestValue: string | undefined;
  for (const [key, getter] of Object.entries(EXACT_MAPPINGS)) {
    const s = charOverlapScore(n, key);
    if (s > bestScore) {
      bestScore = s;
      bestValue = getter(profile) ?? undefined;
    }
  }
  if (bestScore >= 0.75 && bestValue) {
    return score(0.75, 'medium', `Fuzzy match (${Math.round(bestScore * 100)}%)`, bestValue);
  }

  // 3. Open-ended
  if (isOpenEnded(fieldKey, charLimit)) {
    return score(0.40, 'low', 'Open-ended — review required', undefined);
  }

  // 4. Unknown
  return score(0.10, 'unknown', 'No mapping found', undefined);
}

function score(
  s: number,
  level: ConfidenceLevel,
  reason: string,
  value: string | undefined,
): ConfidenceScore {
  return { score: s, level, reason, value };
}

export function isBlocking(s: ConfidenceScore): boolean {
  return s.score < 0.6;
}
