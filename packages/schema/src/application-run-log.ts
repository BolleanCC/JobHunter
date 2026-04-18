import { z } from "zod";
import { AuditEventSchema } from "./shared.js";

// ── LLM call record ───────────────────────────────────────────────────────────
export const LlmCallRecordSchema = z.object({
  id: z.string().uuid(),
  operation: z.enum([
    "extract_requirements",
    "score_fit",
    "tailor_summary",
    "tailor_bullet",
    "generate_cover_letter",
    "answer_question",
    "ats_check",
    "other",
  ]),
  model: z.string(),
  promptTokens: z.number().int().nonnegative(),
  completionTokens: z.number().int().nonnegative(),
  cacheReadTokens: z.number().int().nonnegative().default(0),
  cacheWriteTokens: z.number().int().nonnegative().default(0),
  estimatedCostUsd: z.number().nonnegative().optional(),
  durationMs: z.number().int().nonnegative().optional(),
  succeeded: z.boolean(),
  errorMessage: z.string().optional(),
  startedAt: z.coerce.date(),
});

// ── Pipeline step ─────────────────────────────────────────────────────────────
export const PipelineStepSchema = z.object({
  step: z.enum([
    "ingest",
    "extract_requirements",
    "score_fit",
    "human_review_score",
    "tailor_resume",
    "tailor_cover_letter",
    "answer_questions",
    "ats_check",
    "human_review_docs",
    "submit",
    "follow_up",
  ]),
  status: z.enum(["pending", "running", "completed", "failed", "skipped"]),
  startedAt: z.coerce.date().optional(),
  completedAt: z.coerce.date().optional(),
  durationMs: z.number().int().nonnegative().optional(),
  errorMessage: z.string().optional(),
  llmCallIds: z.array(z.string().uuid()).default([]),
});

// ── Full run log ──────────────────────────────────────────────────────────────
export const ApplicationRunLogSchema = z.object({
  id: z.string().uuid(),
  applicationDraftId: z.string().uuid(),
  jobPostingId: z.string().uuid(),
  userProfileId: z.string().uuid(),
  runStartedAt: z.coerce.date(),
  runCompletedAt: z.coerce.date().optional(),
  status: z.enum(["running", "completed", "failed", "paused_for_review"]),
  steps: z.array(PipelineStepSchema).default([]),
  llmCalls: z.array(LlmCallRecordSchema).default([]),
  auditLog: z.array(AuditEventSchema).default([]),
  totalTokensUsed: z.number().int().nonnegative().default(0),
  totalCostUsd: z.number().nonnegative().optional(),
  errorMessage: z.string().optional(),
  triggeredBy: z.enum(["user", "schedule", "system"]).default("user"),
  cliVersion: z.string().optional(),
});

export type LlmCallRecord = z.infer<typeof LlmCallRecordSchema>;
export type PipelineStep = z.infer<typeof PipelineStepSchema>;
export type ApplicationRunLog = z.infer<typeof ApplicationRunLogSchema>;
