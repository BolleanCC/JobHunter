import type {
  JobRequirements,
  ResumeMaster,
  UserProfile,
  FitScore,
} from "@jobhunter/schema";

const SENIORITY_RANK: Record<string, number> = {
  intern: 0, junior: 1, mid: 2, senior: 3,
  staff: 4, principal: 5, lead: 4, manager: 4,
  director: 6, vp: 7, c_level: 8, not_specified: 2,
};

// ── Sub-score helpers ─────────────────────────────────────────────────────────

function computeSkillsMatch(
  requirements: JobRequirements,
  resume: ResumeMaster
): { score: number; strengths: string[]; gaps: string[] } {
  if (requirements.mustHaveSkills.length === 0) {
    return { score: 50, strengths: [], gaps: [] };
  }

  const profileSkillNames = new Set(
    resume.skills.map((s) => s.name.toLowerCase())
  );

  const strengths: string[] = [];
  const gaps: string[] = [];

  for (const skill of requirements.mustHaveSkills) {
    if (profileSkillNames.has(skill.name.toLowerCase())) {
      strengths.push(skill.name);
    } else {
      gaps.push(skill.name);
    }
  }

  const score = Math.round(
    (strengths.length / requirements.mustHaveSkills.length) * 100
  );
  return { score, strengths, gaps };
}

function computeExperienceMatch(
  requirements: JobRequirements,
  resume: ResumeMaster
): number {
  // Try to infer years required from mustHaveSkills
  const yearsRequired = Math.max(
    0,
    ...requirements.mustHaveSkills
      .map((s) => s.yearsRequired ?? 0)
      .filter((y) => y > 0)
  );

  const actualYears = resume.totalYearsOfExperience ?? deriveYearsFromExp(resume);

  if (yearsRequired === 0) return 75; // not specified
  if (actualYears >= yearsRequired) return 100;
  if (actualYears >= yearsRequired * 0.75) return 80;
  if (actualYears >= yearsRequired * 0.5) return 55;
  return 30;
}

function deriveYearsFromExp(resume: ResumeMaster): number {
  const now = new Date();
  let totalMonths = 0;
  for (const entry of resume.experience) {
    const start = parseYearMonth(entry.startDate);
    const end = entry.isCurrent
      ? now
      : entry.endDate
      ? parseYearMonth(entry.endDate)
      : now;
    const months =
      (end.getFullYear() - start.getFullYear()) * 12 +
      (end.getMonth() - start.getMonth());
    totalMonths += Math.max(0, months);
  }
  return Math.round(totalMonths / 12);
}

function parseYearMonth(ym: string): Date {
  const [year, month] = ym.split("-").map(Number);
  return new Date(year as number, (month as number) - 1, 1);
}

function computeLocationMatch(
  requirements: JobRequirements,
  profile: UserProfile
): number {
  if (requirements.workModel === "remote") return 100;

  const jobLocation = (requirements.location ?? "").toLowerCase();
  const targetLocs = profile.targetLocations.map((l) => l.toLowerCase());

  if (targetLocs.some((l) => jobLocation.includes(l) || l.includes(jobLocation))) {
    return 100;
  }

  const relocation = profile.relocationPreference;
  if (relocation === "yes_with_package" || relocation === "yes_self_funded") {
    return 70;
  }
  if (relocation === "open_to_discuss") return 55;
  return 20;
}

function computeSalaryMatch(
  requirements: JobRequirements,
  profile: UserProfile
): number {
  const jobSalary = requirements.salary;
  const userSalary = profile.salaryExpectation;

  if (!jobSalary || !userSalary) return 50; // unknown

  // Normalise to same period (annual)
  const jobMax = jobSalary.max ?? jobSalary.min;
  const jobMin = jobSalary.min;
  const userMin = userSalary.min;
  const userMax = userSalary.max;

  // Range overlap
  if (jobMax >= userMin && jobMin <= userMax) return 100;
  // Job is below user expectation
  if (jobMax < userMin) return 20;
  // Job is above user expectation (good problem to have)
  return 85;
}

function computeSeniorityMatch(
  requirements: JobRequirements,
  resume: ResumeMaster
): number {
  const jobLevel = SENIORITY_RANK[requirements.seniority] ?? 2;
  // Estimate candidate's level from years of experience
  const years = resume.totalYearsOfExperience ?? deriveYearsFromExp(resume);
  const candidateLevel =
    years <= 1 ? 0
    : years <= 3 ? 1
    : years <= 5 ? 2
    : years <= 8 ? 3
    : years <= 12 ? 4
    : 5;

  const diff = Math.abs(jobLevel - candidateLevel);
  if (diff === 0) return 100;
  if (diff === 1) return 80;
  if (diff === 2) return 50;
  return 25;
}

// ── Main export ───────────────────────────────────────────────────────────────

/**
 * Compute a FitScore deterministically from profile + resume + job requirements.
 * No LLM calls — all math-based.
 */
export function computeFitScore(
  requirements: JobRequirements,
  resume: ResumeMaster,
  profile: UserProfile
): FitScore {
  const { score: skillsMatch, strengths, gaps } = computeSkillsMatch(
    requirements,
    resume
  );
  const experienceMatch = computeExperienceMatch(requirements, resume);
  const locationMatch = computeLocationMatch(requirements, profile);
  const salaryMatch = computeSalaryMatch(requirements, profile);
  const seniorityMatch = computeSeniorityMatch(requirements, resume);

  // Weighted average: skills 35%, experience 25%, seniority 20%, location 10%, salary 10%
  const overall = Math.round(
    skillsMatch * 0.35 +
      experienceMatch * 0.25 +
      seniorityMatch * 0.2 +
      locationMatch * 0.1 +
      salaryMatch * 0.1
  );

  const reasoning = [
    `Skills: ${skillsMatch}/100 (${strengths.length} of ${requirements.mustHaveSkills.length} required skills matched).`,
    `Experience: ${experienceMatch}/100.`,
    `Seniority: ${seniorityMatch}/100.`,
    `Location: ${locationMatch}/100 (${requirements.workModel}).`,
    `Salary: ${salaryMatch}/100.`,
    gaps.length > 0
      ? `Missing required skills: ${gaps.slice(0, 4).join(", ")}${gaps.length > 4 ? ` +${gaps.length - 4} more` : ""}.`
      : "All required skills matched.",
  ].join(" ");

  return {
    overall,
    skillsMatch,
    experienceMatch,
    locationMatch,
    salaryMatch,
    seniorityMatch,
    reasoning,
    skillGaps: gaps,
    strengths,
    scoredByModel: "deterministic-v1",
    scoredAt: new Date(),
  };
}
