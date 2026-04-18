import type { JobRequirements } from "@jobhunter/schema";

export type BulletScore = {
  bullet: string;
  score: number; // 0–100
  matchedKeywords: string[];
  hasMetric: boolean;
  hasActionVerb: boolean;
};

// ── Action verb list ──────────────────────────────────────────────────────────
const ACTION_VERB_RE =
  /^(Architected|Built|Led|Designed|Implemented|Reduced|Increased|Delivered|Migrated|Launched|Owned|Drove|Scaled|Optimis[e]?d|Automated|Developed|Created|Established|Introduced|Improved|Deployed|Maintained|Managed|Collaborated|Mentored|Shipped|Integrated|Refactored|Consolidated|Spearheaded|Pioneered|Streamlined|Accelerated|Achieved|Enabled)/i;

// ── Metric patterns ───────────────────────────────────────────────────────────
const METRIC_RE =
  /\d+\s*[%×x]|\$\s*[\d,.]+|\d+[kmbt]\b|\d+\s*(users?|clients?|engineers?|teams?|systems?|requests?|tps|ms|hrs?|days?|weeks?|months?)/i;

/**
 * Score a single resume bullet against the job requirements.
 * Fully deterministic — no LLM calls.
 */
export function scoreBullet(
  bullet: string,
  requirements: JobRequirements
): BulletScore {
  const lower = bullet.toLowerCase();
  const matchedKeywords: string[] = [];

  // 1. ATS keyword matches (up to 40 pts) ─────────────────────────────────────
  const allKeywords = [
    ...requirements.atsKeywords,
    ...requirements.mustHaveSkills.map((s) => s.name),
  ];
  const uniqueKeywords = [...new Set(allKeywords.map((k) => k.toLowerCase()))];
  let kwScore = 0;
  const kwWeight = uniqueKeywords.length > 0 ? 40 / uniqueKeywords.length : 0;

  for (const kw of uniqueKeywords) {
    if (lower.includes(kw)) {
      matchedKeywords.push(kw);
      kwScore += kwWeight;
    }
  }
  kwScore = Math.min(40, kwScore);

  // 2. Must-have skill bonus (up to 25 pts) ────────────────────────────────────
  const mustHaveNames = requirements.mustHaveSkills.map((s) =>
    s.name.toLowerCase()
  );
  const mustMatches = mustHaveNames.filter((n) => lower.includes(n)).length;
  const mustScore =
    mustHaveNames.length > 0
      ? Math.min(25, (mustMatches / mustHaveNames.length) * 25)
      : 0;

  // 3. Quantified metric (20 pts) ───────────────────────────────────────────────
  const hasMetric = METRIC_RE.test(bullet);
  const metricScore = hasMetric ? 20 : 0;

  // 4. Strong action verb (15 pts) ──────────────────────────────────────────────
  const hasActionVerb = ACTION_VERB_RE.test(bullet.trim());
  const verbScore = hasActionVerb ? 15 : 0;

  const score = Math.min(
    100,
    Math.round(kwScore + mustScore + metricScore + verbScore)
  );

  return { bullet, score, matchedKeywords, hasMetric, hasActionVerb };
}

/**
 * Score all bullets in a flat list and return them sorted descending.
 */
export function rankBullets(
  bullets: string[],
  requirements: JobRequirements
): BulletScore[] {
  return bullets
    .map((b) => scoreBullet(b, requirements))
    .sort((a, b) => b.score - a.score);
}

/**
 * Score a project entry (description + technologies) against requirements.
 * Returns a 0–100 score for project relevance.
 */
export function scoreProject(
  description: string,
  technologies: string[],
  requirements: JobRequirements
): number {
  const combinedText = [description, ...technologies].join(" ").toLowerCase();
  const allKeywords = [
    ...requirements.atsKeywords,
    ...requirements.mustHaveSkills.map((s) => s.name),
  ];
  const unique = [...new Set(allKeywords.map((k) => k.toLowerCase()))];
  if (unique.length === 0) return 50;

  const matches = unique.filter((k) => combinedText.includes(k)).length;
  return Math.min(100, Math.round((matches / unique.length) * 100));
}
