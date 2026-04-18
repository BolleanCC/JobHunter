import { z } from "zod";
import { SenioritySchema, SalaryRangeSchema } from "./shared.js";

// ── Structured requirements extracted from a JobPosting ───────────────────────
// Produced by the LLM analysis step; linked to a jobPostingId.

export const ExtractedSkillSchema = z.object({
  name: z.string().min(1),
  category: z
    .enum(["language", "framework", "tool", "platform", "methodology", "soft_skill", "other"])
    .default("other"),
  yearsRequired: z.number().nonnegative().optional(),
  isRequired: z.boolean(),
  isAmbiguous: z.boolean().default(false),
  rawText: z.string().optional(),
});

export const RedFlagSchema = z.object({
  type: z.enum([
    "unrealistic_requirements",
    "vague_compensation",
    "unpaid_trial",
    "excessive_hours",
    "culture_fit_only",
    "no_remote_despite_claim",
    "other",
  ]),
  description: z.string(),
  severity: z.enum(["low", "medium", "high"]),
});

// ── Immutable identity ────────────────────────────────────────────────────────
export const JobRequirementsIdentitySchema = z.object({
  id: z.string().uuid(),
  jobPostingId: z.string().uuid(),
  extractedAt: z.coerce.date(),
  extractedByModel: z.string(),
});

// ── Extracted content ─────────────────────────────────────────────────────────
// Human-reviewable/editable after extraction.
export const JobRequirementsPresentationSchema = z.object({
  roleTitle: z.string().min(1),
  seniority: SenioritySchema,
  domain: z.string().optional(),
  responsibilities: z.array(z.string()).default([]),
  mustHaveSkills: z.array(ExtractedSkillSchema).default([]),
  niceToHaveSkills: z.array(ExtractedSkillSchema).default([]),
  atsKeywords: z.array(z.string()).default([]),
  educationRequirements: z.array(z.string()).default([]),
  workAuthorizationSignals: z.array(z.string()).default([]),
  location: z.string().optional(),
  workModel: z.enum(["onsite", "hybrid", "remote", "not_specified"]).default("not_specified"),
  salary: SalaryRangeSchema.optional(),
  redFlags: z.array(RedFlagSchema).default([]),
  summary: z.string().max(500).optional(),
  humanReviewed: z.boolean().default(false),
  reviewedAt: z.coerce.date().optional(),
  notes: z.string().optional(),
});

// ── Full schema ───────────────────────────────────────────────────────────────
export const JobRequirementsSchema = JobRequirementsIdentitySchema.merge(
  JobRequirementsPresentationSchema
);

export type ExtractedSkill = z.infer<typeof ExtractedSkillSchema>;
export type RedFlag = z.infer<typeof RedFlagSchema>;
export type JobRequirementsIdentity = z.infer<typeof JobRequirementsIdentitySchema>;
export type JobRequirementsPresentation = z.infer<typeof JobRequirementsPresentationSchema>;
export type JobRequirements = z.infer<typeof JobRequirementsSchema>;
