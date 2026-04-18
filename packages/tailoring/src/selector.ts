import type {
  ResumeMaster,
  UserProfile,
  JobRequirements,
  WorkExperienceEntry,
  ProjectEntry,
} from "@jobhunter/schema";
import { scoreBullet, scoreProject } from "./scorer.js";

export type SelectedExperience = {
  entry: WorkExperienceEntry;
  selectedBullets: string[];
  avgScore: number;
};

export type SelectionResult = {
  experience: SelectedExperience[];
  skills: string[];
  projectIds: string[];
};

// ── Configuration ─────────────────────────────────────────────────────────────

const MAX_BULLETS_PER_ENTRY = 4;
const MIN_BULLETS_PER_ENTRY = 2;
const MAX_PROJECTS = 2;
const MAX_SKILLS = 20;

// ── Skill selection ───────────────────────────────────────────────────────────

export function selectSkills(
  resume: ResumeMaster,
  requirements: JobRequirements
): string[] {
  const profileSkillNames = resume.skills.map((s) => s.name);
  const profileLower = new Set(profileSkillNames.map((n) => n.toLowerCase()));

  const mustHaveNames = requirements.mustHaveSkills.map((s) => s.name);
  const niceToHaveNames = requirements.niceToHaveSkills.map((s) => s.name);
  const allJdKeywords = [
    ...mustHaveNames,
    ...niceToHaveNames,
    ...requirements.atsKeywords,
  ];

  // Priority 1: must-have skills from JD that are in profile
  const p1 = mustHaveNames.filter((n) => profileLower.has(n.toLowerCase()));

  // Priority 2: nice-to-have skills from JD that are in profile
  const p2 = niceToHaveNames.filter(
    (n) => profileLower.has(n.toLowerCase()) && !p1.some((x) => x.toLowerCase() === n.toLowerCase())
  );

  // Priority 3: remaining profile skills that appear in JD keywords
  const jdLower = new Set(allJdKeywords.map((k) => k.toLowerCase()));
  const p3 = profileSkillNames.filter(
    (n) =>
      jdLower.has(n.toLowerCase()) &&
      !p1.some((x) => x.toLowerCase() === n.toLowerCase()) &&
      !p2.some((x) => x.toLowerCase() === n.toLowerCase())
  );

  // Priority 4: remaining profile skills not in JD (filler)
  const p4 = profileSkillNames.filter(
    (n) =>
      !p1.some((x) => x.toLowerCase() === n.toLowerCase()) &&
      !p2.some((x) => x.toLowerCase() === n.toLowerCase()) &&
      !p3.some((x) => x.toLowerCase() === n.toLowerCase())
  );

  return [...p1, ...p2, ...p3, ...p4].slice(0, MAX_SKILLS);
}

// ── Bullet selection ──────────────────────────────────────────────────────────

export function selectBulletsForEntry(
  entry: WorkExperienceEntry,
  requirements: JobRequirements
): string[] {
  const scored = entry.bullets
    .map((b) => ({ bullet: b, score: scoreBullet(b, requirements).score }))
    .sort((a, b) => b.score - a.score);

  // Always include at least MIN_BULLETS_PER_ENTRY
  const topN = Math.max(
    MIN_BULLETS_PER_ENTRY,
    Math.min(MAX_BULLETS_PER_ENTRY, scored.length)
  );

  return scored.slice(0, topN).map((s) => s.bullet);
}

// ── Experience selection ──────────────────────────────────────────────────────

export function selectExperience(
  resume: ResumeMaster,
  requirements: JobRequirements
): SelectedExperience[] {
  return resume.experience
    .map((entry) => {
      const selectedBullets = selectBulletsForEntry(entry, requirements);
      const scores = selectedBullets.map(
        (b) => scoreBullet(b, requirements).score
      );
      const avgScore =
        scores.length > 0
          ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
          : 0;
      return { entry, selectedBullets, avgScore };
    })
    .sort((a, b) => b.avgScore - a.avgScore);
}

// ── Project selection ─────────────────────────────────────────────────────────

export function selectProjects(
  resume: ResumeMaster,
  requirements: JobRequirements,
  maxProjects = MAX_PROJECTS
): string[] {
  return resume.projects
    .map((p: ProjectEntry) => ({
      id: p.id,
      score: scoreProject(p.description, p.technologies, requirements),
    }))
    .filter((p) => p.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, maxProjects)
    .map((p) => p.id);
}

// ── Full selection ────────────────────────────────────────────────────────────

export function selectContent(
  resume: ResumeMaster,
  _profile: UserProfile,
  requirements: JobRequirements
): SelectionResult {
  return {
    experience: selectExperience(resume, requirements),
    skills: selectSkills(resume, requirements),
    projectIds: selectProjects(resume, requirements),
  };
}
