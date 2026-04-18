import type { JobRequirements } from "@jobhunter/schema";

export const TAILOR_BULLET_TOOL = {
  name: "rewrite_bullet",
  description:
    "Rewrite a resume bullet to be clearer, more impactful, and ATS-friendly. Return unchanged if no improvement is possible without inventing facts.",
  input_schema: {
    type: "object" as const,
    required: ["tailoredBullet", "unchanged", "keywordsInjected"],
    properties: {
      tailoredBullet: {
        type: "string",
        description: "The rewritten bullet. If unchanged=true, this must be identical to the original.",
      },
      unchanged: {
        type: "boolean",
        description: "Set to true if the bullet cannot be improved without inventing facts.",
      },
      keywordsInjected: {
        type: "array",
        items: { type: "string" },
        description: "Job-requirement keywords that were surfaced (NOT invented) in the rewrite.",
      },
    },
  },
} as const;

export function buildTailorBulletPrompt(
  originalBullet: string,
  requirements: JobRequirements,
  context: { company: string; title: string }
): string {
  const relevantKeywords = [
    ...requirements.mustHaveSkills.map((s) => s.name),
    ...requirements.atsKeywords.slice(0, 15),
  ].join(", ");

  return `Rewrite the following resume bullet for a ${requirements.roleTitle} application at a ${requirements.domain ?? "software"} company.

Context: This bullet is from a role as "${context.title}" at ${context.company}.

Original bullet:
"${originalBullet}"

Relevant job keywords to surface (only if already implied by the original bullet):
${relevantKeywords}

Remember: Do NOT add any facts, metrics, or technologies not present in the original.`;
}
