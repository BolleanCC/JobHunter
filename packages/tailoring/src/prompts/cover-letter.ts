import type { JobRequirements, ResumeMaster, UserProfile } from "@jobhunter/schema";

export const COVER_LETTER_TOOL = {
  name: "write_cover_letter",
  description:
    "Write a professional cover letter body (3 short paragraphs, ≤250 words). Only use facts from the provided profile.",
  input_schema: {
    type: "object" as const,
    required: ["body"],
    properties: {
      body: {
        type: "string",
        description:
          "Cover letter body only (no salutation or sign-off). 3 paragraphs, ≤250 words. Do not invent any facts.",
      },
    },
  },
} as const;

export function buildCoverLetterPrompt(
  requirements: JobRequirements,
  resume: ResumeMaster,
  profile: UserProfile
): string {
  const currentRole = resume.experience.find((e) => e.isCurrent);
  const mostRelevantBullets = (currentRole?.bullets ?? resume.experience[0]?.bullets ?? [])
    .slice(0, 3)
    .join("\n- ");

  const strengths = resume.skills
    .slice(0, 5)
    .map((s) => s.name)
    .join(", ");

  return `Write a cover letter body for ${profile.displayName} applying for the ${requirements.roleTitle} role.

Facts you may use (do not add any others):
- Current/most recent role: ${currentRole ? `${currentRole.title} at ${currentRole.company}` : "Software Engineer"}
- Key skills: ${strengths}
- A few recent accomplishments:
  - ${mostRelevantBullets}
- Target company context: ${requirements.domain ?? "software"} domain, ${requirements.workModel} work model
- Why this role: ${requirements.roleTitle} aligns with ${profile.targetRoles.join(", ") || "career goals"}

Structure (3 paragraphs):
1. Opening: who they are and why they're interested (specific to this role)
2. Middle: 2 relevant accomplishments that demonstrate fit (from the facts above only)
3. Closing: call to action, cultural fit signal

Max 250 words. Do not invent metrics, titles, or technologies not listed above.`;
}
