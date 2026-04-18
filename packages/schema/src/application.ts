import { z } from "zod";

export const ApplicationStatusSchema = z.enum([
  "discovered",      // job found, not yet evaluated
  "evaluated",       // scored, awaiting human review
  "approved",        // human approved for tailoring
  "tailored",        // resume/CL generated, awaiting review
  "ready",           // human reviewed tailored docs
  "submitted",       // application sent
  "acknowledged",    // confirmation received
  "interviewing",    // active interview process
  "offer",           // offer received
  "rejected",        // rejected at any stage
  "withdrawn",       // user withdrew
  "archived",        // no longer relevant
]);

export const FitScoreSchema = z.object({
  overall: z.number().min(0).max(100),
  skills: z.number().min(0).max(100),
  experience: z.number().min(0).max(100),
  location: z.number().min(0).max(100),
  salary: z.number().min(0).max(100),
  reasoning: z.string(),
  skillGaps: z.array(z.string()).default([]),
  strengths: z.array(z.string()).default([]),
});

export const TailoredDocumentsSchema = z.object({
  resumePath: z.string().optional(),
  coverLetterPath: z.string().optional(),
  atsScore: z.number().min(0).max(100).optional(),
  keywordsMatched: z.array(z.string()).default([]),
  keywordsMissed: z.array(z.string()).default([]),
  generatedAt: z.coerce.date(),
});

export const AuditEventSchema = z.object({
  at: z.coerce.date(),
  event: z.string(),
  actor: z.enum(["system", "user", "llm"]),
  detail: z.string().optional(),
});

export const ApplicationSchema = z.object({
  id: z.string().uuid(),
  jobId: z.string().uuid(),
  status: ApplicationStatusSchema,
  fitScore: FitScoreSchema.optional(),
  tailoredDocuments: TailoredDocumentsSchema.optional(),
  notes: z.string().optional(),
  auditLog: z.array(AuditEventSchema).default([]),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  submittedAt: z.coerce.date().optional(),
  followUpAt: z.coerce.date().optional(),
});

export type Application = z.infer<typeof ApplicationSchema>;
export type ApplicationStatus = z.infer<typeof ApplicationStatusSchema>;
export type FitScore = z.infer<typeof FitScoreSchema>;
export type TailoredDocuments = z.infer<typeof TailoredDocumentsSchema>;
export type AuditEvent = z.infer<typeof AuditEventSchema>;
