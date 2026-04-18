import { z } from "zod";

// ── ATS analysis ──────────────────────────────────────────────────────────────
export const AtsAnalysisSchema = z.object({
  score: z.number().min(0).max(100),
  keywordsMatched: z.array(z.string()).default([]),
  keywordsMissed: z.array(z.string()).default([]),
  suggestions: z.array(z.string()).default([]),
  analyzedAt: z.coerce.date(),
});

// ── Tailored content sections ─────────────────────────────────────────────────
export const TailoredSummarySchema = z.object({
  text: z.string().min(1),
  generatedByModel: z.string().optional(),
  humanEdited: z.boolean().default(false),
});

export const TailoredBulletSchema = z.object({
  originalEntryId: z.string().uuid(),
  originalBullet: z.string(),
  tailoredBullet: z.string(),
  generatedByModel: z.string().optional(),
  humanEdited: z.boolean().default(false),
  keywordsInjected: z.array(z.string()).default([]),
});

export const TailoredExperienceEntrySchema = z.object({
  sourceEntryId: z.string().uuid(),
  included: z.boolean().default(true),
  tailoredBullets: z.array(TailoredBulletSchema).default([]),
});

export const CoverLetterSchema = z.object({
  body: z.string().min(1),
  generatedByModel: z.string().optional(),
  humanEdited: z.boolean().default(false),
  generatedAt: z.coerce.date(),
});

// ── Fit score ─────────────────────────────────────────────────────────────────
export const FitScoreSchema = z.object({
  overall: z.number().min(0).max(100),
  skillsMatch: z.number().min(0).max(100),
  experienceMatch: z.number().min(0).max(100),
  locationMatch: z.number().min(0).max(100),
  salaryMatch: z.number().min(0).max(100),
  seniorityMatch: z.number().min(0).max(100),
  reasoning: z.string(),
  skillGaps: z.array(z.string()).default([]),
  strengths: z.array(z.string()).default([]),
  scoredByModel: z.string(),
  scoredAt: z.coerce.date(),
});

// ── Output artifacts ──────────────────────────────────────────────────────────
export const DocumentArtifactSchema = z.object({
  path: z.string(),
  format: z.enum(["docx", "pdf", "md", "txt"]),
  generatedAt: z.coerce.date(),
  sizeBytes: z.number().int().nonnegative().optional(),
});

// ── Immutable identity ────────────────────────────────────────────────────────
export const TailoredResumeIdentitySchema = z.object({
  id: z.string().uuid(),
  jobPostingId: z.string().uuid(),
  jobRequirementsId: z.string().uuid(),
  resumeMasterId: z.string().uuid(),
  userProfileId: z.string().uuid(),
  createdAt: z.coerce.date(),
});

// ── Editable tailored content ─────────────────────────────────────────────────
export const TailoredResumePresentationSchema = z.object({
  fitScore: FitScoreSchema.optional(),
  tailoredSummary: TailoredSummarySchema.optional(),
  tailoredExperience: z.array(TailoredExperienceEntrySchema).default([]),
  selectedSkills: z.array(z.string()).default([]),
  selectedProjects: z.array(z.string().uuid()).default([]),
  coverLetter: CoverLetterSchema.optional(),
  atsAnalysis: AtsAnalysisSchema.optional(),
  outputArtifacts: z.array(DocumentArtifactSchema).default([]),
  humanApproved: z.boolean().default(false),
  approvedAt: z.coerce.date().optional(),
  notes: z.string().optional(),
  updatedAt: z.coerce.date(),
});

// ── Full schema ───────────────────────────────────────────────────────────────
export const TailoredResumeSchema = TailoredResumeIdentitySchema.merge(
  TailoredResumePresentationSchema
);

export type AtsAnalysis = z.infer<typeof AtsAnalysisSchema>;
export type FitScore = z.infer<typeof FitScoreSchema>;
export type CoverLetter = z.infer<typeof CoverLetterSchema>;
export type TailoredBullet = z.infer<typeof TailoredBulletSchema>;
export type TailoredResumeIdentity = z.infer<typeof TailoredResumeIdentitySchema>;
export type TailoredResumePresentation = z.infer<typeof TailoredResumePresentationSchema>;
export type TailoredResume = z.infer<typeof TailoredResumeSchema>;
