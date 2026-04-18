import { randomUUID } from "crypto";
import type {
  ResumeMaster,
  UserProfile,
  JobRequirements,
  TailoredResume,
  TailoredBullet,
  TailoredExperienceEntry,
} from "@jobhunter/schema";
import { TailoredResumeSchema } from "@jobhunter/schema";
import { computeFitScore } from "./fit-score.js";
import { selectContent } from "./selector.js";
import { scoreBullet } from "./scorer.js";
import type { LlmTailoringAdapter } from "./llm-tailor-adapter.js";

// ── Options ───────────────────────────────────────────────────────────────────

export type TailoringOptions = {
  /** Only rewrite bullets scoring below this threshold (0–100). Default: 60 */
  rewriteThreshold?: number;
  /** Maximum bullets to rewrite per experience entry. Default: 3 */
  maxBulletsRewritten?: number;
  /** Whether to generate a cover letter. Default: false */
  generateCoverLetter?: boolean;
  /** IDs to link this tailored resume to existing records */
  ids?: {
    jobPostingId?: string;
    jobRequirementsId?: string;
  };
};

export type TailoringResult = {
  tailoredResume: TailoredResume;
  artifacts: {
    json: string;
  };
};

// ── ATS analysis (deterministic) ──────────────────────────────────────────────

function computeAtsAnalysis(
  experience: TailoredExperienceEntry[],
  selectedSkills: string[],
  summary: string | undefined,
  requirements: JobRequirements
) {
  const allText = [
    summary ?? "",
    ...experience.flatMap((e) =>
      e.tailoredBullets.map((b) => b.tailoredBullet)
    ),
    ...selectedSkills,
  ]
    .join(" ")
    .toLowerCase();

  const matched: string[] = [];
  const missed: string[] = [];

  for (const kw of requirements.atsKeywords) {
    if (allText.includes(kw.toLowerCase())) {
      matched.push(kw);
    } else {
      missed.push(kw);
    }
  }

  const score =
    requirements.atsKeywords.length > 0
      ? Math.round((matched.length / requirements.atsKeywords.length) * 100)
      : 0;

  return {
    score,
    keywordsMatched: matched,
    keywordsMissed: missed,
    suggestions: missed.slice(0, 5).map(
      (kw) =>
        `Consider mentioning "${kw}" if it genuinely applies to your experience.`
    ),
    analyzedAt: new Date(),
  };
}

// ── Main engine ───────────────────────────────────────────────────────────────

export async function tailorResume(
  resumeMaster: ResumeMaster,
  userProfile: UserProfile,
  requirements: JobRequirements,
  adapter: LlmTailoringAdapter,
  opts: TailoringOptions = {}
): Promise<TailoringResult> {
  const {
    rewriteThreshold = 60,
    maxBulletsRewritten = 3,
    generateCoverLetter = false,
    ids = {},
  } = opts;

  // ── 1. Deterministic fit score ────────────────────────────────────────────
  const fitScore = computeFitScore(requirements, resumeMaster, userProfile);

  // ── 2. Content selection ──────────────────────────────────────────────────
  const { experience: selectedExp, skills, projectIds } = selectContent(
    resumeMaster,
    userProfile,
    requirements
  );

  // ── 3. LLM tailoring: summary ─────────────────────────────────────────────
  const summaryText = await adapter.tailorSummary(
    requirements,
    resumeMaster,
    userProfile
  );

  // ── 4. LLM tailoring: bullets (only low-scoring ones) ────────────────────
  const tailoredExperience: TailoredExperienceEntry[] = [];

  for (const { entry, selectedBullets } of selectedExp) {
    const tailoredBullets: TailoredBullet[] = [];
    let rewriteCount = 0;

    for (const bullet of selectedBullets) {
      const { score } = scoreBullet(bullet, requirements);
      const shouldRewrite =
        score < rewriteThreshold && rewriteCount < maxBulletsRewritten;

      if (shouldRewrite) {
        const result = await adapter.tailorBullet(bullet, requirements, {
          company: entry.company,
          title: entry.title,
        });
        if (!result.unchanged) rewriteCount++;
        tailoredBullets.push({
          originalEntryId: entry.id,
          originalBullet: bullet,
          tailoredBullet: result.tailoredBullet,
          generatedByModel: result.unchanged ? undefined : "claude-sonnet-4-6",
          humanEdited: false,
          keywordsInjected: result.keywordsInjected,
        });
      } else {
        // Keep as-is — already relevant or rewrite budget spent
        tailoredBullets.push({
          originalEntryId: entry.id,
          originalBullet: bullet,
          tailoredBullet: bullet,
          humanEdited: false,
          keywordsInjected: [],
        });
      }
    }

    tailoredExperience.push({
      sourceEntryId: entry.id,
      included: true,
      tailoredBullets,
    });
  }

  // ── 5. Optional cover letter ──────────────────────────────────────────────
  const coverLetter = generateCoverLetter
    ? {
        body: await adapter.generateCoverLetter(
          requirements,
          resumeMaster,
          userProfile
        ),
        generatedByModel: "claude-sonnet-4-6",
        humanEdited: false,
        generatedAt: new Date(),
      }
    : undefined;

  // ── 6. ATS analysis (deterministic) ──────────────────────────────────────
  const atsAnalysis = computeAtsAnalysis(
    tailoredExperience,
    skills,
    summaryText,
    requirements
  );

  // ── 7. Assemble and validate TailoredResume ───────────────────────────────
  const now = new Date();
  const tailoredResume = TailoredResumeSchema.parse({
    id: randomUUID(),
    jobPostingId: ids.jobPostingId ?? requirements.jobPostingId,
    jobRequirementsId: ids.jobRequirementsId ?? requirements.id,
    resumeMasterId: resumeMaster.id,
    userProfileId: userProfile.id,
    createdAt: now,
    fitScore,
    tailoredSummary: {
      text: summaryText,
      generatedByModel: "claude-sonnet-4-6",
      humanEdited: false,
    },
    tailoredExperience,
    selectedSkills: skills,
    selectedProjects: projectIds,
    coverLetter,
    atsAnalysis,
    humanApproved: false,
    updatedAt: now,
  } satisfies TailoredResume);

  return {
    tailoredResume,
    artifacts: {
      json: JSON.stringify(tailoredResume, null, 2),
    },
  };
}
