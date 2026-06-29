import type { UserProfile, JobDescription, FitScore } from './types';

export function computeFitScore(profile: UserProfile, jd: JobDescription): FitScore {
  const yearsMatch = profile.yearsOfExperience >= jd.yearsRequired;

  const profileText = (profile.resumeText + ' ' + profile.skills.join(' ')).toLowerCase();
  const keywordHits = jd.requiredSkills.filter((s) => profileText.includes(s.toLowerCase()));
  const keywordMisses = jd.requiredSkills.filter((s) => !profileText.includes(s.toLowerCase()));

  const profileTitles = profile.experience.map((e) => e.title.toLowerCase());
  const jdTitleWords = jd.title.toLowerCase().split(/\s+/);
  const titleMatch: FitScore['titleMatch'] = profileTitles.some((t) =>
    jdTitleWords.some((w) => w.length > 3 && t.includes(w)),
  )
    ? 'related'
    : 'unrelated';

  const skillScore =
    jd.requiredSkills.length === 0
      ? 50
      : (keywordHits.length / jd.requiredSkills.length) * 50;

  const overall = Math.min(
    100,
    Math.round(
      (yearsMatch ? 30 : 0) +
      skillScore +
      (titleMatch !== 'unrelated' ? 20 : 0),
    ),
  );

  return { overall, yearsMatch, keywordHits, keywordMisses, titleMatch };
}
