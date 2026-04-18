import type { JobRequirements, ResumeMaster, UserProfile } from "@jobhunter/schema";

export const TAILOR_SUMMARY_TOOL = {
  name: "write_summary",
  description:
    "Write a concise professional summary (2–3 sentences, ≤100 words) for a resume targeting a specific role. Only use facts from the provided profile and experience.",
  input_schema: {
    type: "object" as const,
    required: ["summary"],
    properties: {
      summary: {
        type: "string",
        description: "2–3 sentence professional summary, max 100 words. Do not invent any facts.",
      },
    },
  },
} as const;

export function buildTailorSummaryPrompt(
  requirements: JobRequirements,
  resume: ResumeMaster,
  profile: UserProfile
): string {
  const yearsExp = resume.totalYearsOfExperience ?? resume.experience.length > 0
    ? "several years of"
    : "";

  const topSkills = resume.skills
    .slice(0, 6)
    .map((s) => s.name)
    .join(", ");

  const currentRole = resume.experience.find((e) => e.isCurrent);
  const currentRoleStr = currentRole
    ? `Currently ${currentRole.title} at ${currentRole.company}.`
    : "";

  const existingSummary = resume.summary
    ? `\nExisting summary to adapt:\n"${resume.summary}"\n`
    : "";

  return `Write a professional summary for ${profile.displayName}'s resume targeting a ${requirements.roleTitle} role (${requirements.seniority} level, ${requirements.domain ?? "software"} domain).

Facts you may use (do not add any others):
- Years of experience: ${yearsExp}
- Top skills: ${topSkills}
- ${currentRoleStr}
- Target role keywords: ${requirements.atsKeywords.slice(0, 8).join(", ")}
${existingSummary}
Write 2–3 sentences. Be specific and factual. Do not mention skills not listed above.`;
}
