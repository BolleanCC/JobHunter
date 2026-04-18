import type { DetectedHints } from "../types.js";

// ── Tool schema ───────────────────────────────────────────────────────────────
// Mirrors JobRequirementsPresentationSchema as a JSON Schema for Claude tool_use.

export const EXTRACT_REQUIREMENTS_TOOL = {
  name: "extract_job_requirements",
  description:
    "Extract structured requirements from a job posting. Be conservative: only include facts explicitly stated. Mark ambiguous items with isAmbiguous:true.",
  input_schema: {
    type: "object" as const,
    required: [
      "roleTitle",
      "seniority",
      "responsibilities",
      "mustHaveSkills",
      "niceToHaveSkills",
      "atsKeywords",
      "educationRequirements",
      "workAuthorizationSignals",
      "workModel",
      "redFlags",
    ],
    properties: {
      roleTitle: {
        type: "string",
        description: "Job title exactly as written in the posting",
      },
      seniority: {
        type: "string",
        enum: [
          "intern","junior","mid","senior","staff","principal",
          "lead","manager","director","vp","c_level","not_specified",
        ],
        description: "Infer from title, years required, and responsibilities",
      },
      domain: {
        type: "string",
        description:
          "Primary technical domain, e.g. 'Frontend Engineering', 'Platform Engineering', 'Data Engineering', 'IT Support'",
      },
      responsibilities: {
        type: "array",
        items: { type: "string" },
        description: "Key responsibilities as bullet points, normalized to active voice",
      },
      mustHaveSkills: {
        type: "array",
        description: "Skills explicitly required, not preferred",
        items: {
          type: "object",
          required: ["name", "isRequired", "isAmbiguous"],
          properties: {
            name: { type: "string", description: "Normalized skill name, e.g. 'TypeScript' not 'typescript'" },
            category: {
              type: "string",
              enum: ["language","framework","tool","platform","methodology","soft_skill","other"],
            },
            yearsRequired: { type: "number", minimum: 0 },
            isRequired: { type: "boolean" },
            isAmbiguous: {
              type: "boolean",
              description: "True if the posting is unclear about whether this is required or preferred",
            },
            rawText: {
              type: "string",
              description: "Verbatim phrase from the job posting that evidences this skill",
            },
          },
        },
      },
      niceToHaveSkills: {
        type: "array",
        description: "Skills marked as preferred, advantageous, or nice-to-have",
        items: {
          type: "object",
          required: ["name", "isRequired", "isAmbiguous"],
          properties: {
            name: { type: "string" },
            category: {
              type: "string",
              enum: ["language","framework","tool","platform","methodology","soft_skill","other"],
            },
            yearsRequired: { type: "number", minimum: 0 },
            isRequired: { type: "boolean" },
            isAmbiguous: { type: "boolean" },
            rawText: { type: "string" },
          },
        },
      },
      atsKeywords: {
        type: "array",
        items: { type: "string" },
        description:
          "All important keywords for ATS matching: technologies, methodologies, certifications, domain terms. Include both full names and abbreviations (e.g. 'Kubernetes' and 'k8s').",
      },
      educationRequirements: {
        type: "array",
        items: { type: "string" },
        description: "Only include if explicitly stated",
      },
      workAuthorizationSignals: {
        type: "array",
        items: { type: "string" },
        description: "Any mention of working rights, visa sponsorship, citizenship requirements",
      },
      location: {
        type: "string",
        description: "Primary work location as stated",
      },
      workModel: {
        type: "string",
        enum: ["onsite", "hybrid", "remote", "not_specified"],
      },
      salary: {
        type: "object",
        properties: {
          min: { type: "number" },
          max: { type: "number" },
          currency: { type: "string", minLength: 3, maxLength: 3 },
          period: { type: "string", enum: ["annual", "monthly", "daily", "hourly"] },
          isNegotiable: { type: "boolean" },
        },
        required: ["min", "currency", "period", "isNegotiable"],
        description: "Only include if salary is explicitly stated. Do not infer.",
      },
      redFlags: {
        type: "array",
        items: {
          type: "object",
          required: ["type", "description", "severity"],
          properties: {
            type: {
              type: "string",
              enum: [
                "unrealistic_requirements",
                "vague_compensation",
                "unpaid_trial",
                "excessive_hours",
                "culture_fit_only",
                "no_remote_despite_claim",
                "other",
              ],
            },
            description: { type: "string" },
            severity: { type: "string", enum: ["low", "medium", "high"] },
          },
        },
      },
      summary: {
        type: "string",
        maxLength: 400,
        description: "2–3 sentence neutral summary of the role and fit signals",
      },
    },
  },
} as const;

// ── System prompt (long — cached on Claude's side) ────────────────────────────

export const SYSTEM_PROMPT = `You are an expert technical recruiter and job description analyst.

Your task is to extract structured requirements from a job posting using the extract_job_requirements tool.

Rules:
- TRUTHFUL: Only extract facts explicitly stated in the posting. Do not infer, assume, or embellish.
- NORMALIZED: Use canonical skill names (e.g. "TypeScript" not "typescript" or "TS", "Node.js" not "NodeJS", "PostgreSQL" not "postgres").
- DEDUPLICATED: Do not list the same skill in both mustHaveSkills and niceToHaveSkills. If ambiguous, mark isAmbiguous:true.
- CONSERVATIVE on seniority: If no explicit seniority signal exists, use "not_specified".
- ATS KEYWORDS: Include both full names and common abbreviations. Include domain terms, certifications, and methodologies.
- RED FLAGS: Flag unrealistic requirements (e.g. "10x engineer", "startup hours"), missing compensation, unpaid trials.
- SALARY: Only populate the salary field if a specific number or range is stated. Leave it out otherwise.
- WORK MODEL: Use the preprocessor hints as a starting signal, but verify against the full text.`;

// ── User prompt builder ───────────────────────────────────────────────────────

export function buildUserPrompt(
  cleanedText: string,
  hints: DetectedHints
): string {
  const hintLines: string[] = [];

  if (hints.salary) {
    hintLines.push(
      `- Salary detected: ${hints.salary.raw}` +
        (hints.salary.min
          ? ` (min: ${hints.salary.min}, max: ${hints.salary.max ?? "?"}, currency: ${hints.salary.currency ?? "?"})`
          : "")
    );
  }
  if (hints.location) hintLines.push(`- Location detected: ${hints.location}`);
  if (hints.workMode) hintLines.push(`- Work mode detected: ${hints.workMode}`);
  if (hints.employmentType)
    hintLines.push(`- Employment type detected: ${hints.employmentType}`);
  if (hints.yearsOfExperience) {
    const { min, max } = hints.yearsOfExperience;
    hintLines.push(
      `- Years of experience detected: ${min}${max ? `–${max}` : "+"}  years`
    );
  }
  if (hints.sponsorshipMentioned)
    hintLines.push("- Work authorization / sponsorship language detected");

  const hintsSection =
    hintLines.length > 0
      ? `\n\nPreprocessor hints (verify against full text):\n${hintLines.join("\n")}\n`
      : "";

  return `Please extract structured requirements from the following job posting.${hintsSection}

---
${cleanedText}
---`;
}
