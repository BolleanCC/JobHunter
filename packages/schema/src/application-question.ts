import { z } from "zod";

// ── Question types ────────────────────────────────────────────────────────────

export const TextQuestionSchema = z.object({
  type: z.literal("text"),
  maxLength: z.number().int().positive().optional(),
});

export const TextareaQuestionSchema = z.object({
  type: z.literal("textarea"),
  maxLength: z.number().int().positive().optional(),
  maxWords: z.number().int().positive().optional(),
});

export const SelectQuestionSchema = z.object({
  type: z.literal("select"),
  options: z.array(z.string()).min(1),
});

export const MultiSelectQuestionSchema = z.object({
  type: z.literal("multiselect"),
  options: z.array(z.string()).min(1),
  maxSelections: z.number().int().positive().optional(),
});

export const YesNoQuestionSchema = z.object({
  type: z.literal("yes_no"),
});

export const NumericQuestionSchema = z.object({
  type: z.literal("numeric"),
  min: z.number().optional(),
  max: z.number().optional(),
  unit: z.string().optional(),
});

export const QuestionTypeSchema = z.discriminatedUnion("type", [
  TextQuestionSchema,
  TextareaQuestionSchema,
  SelectQuestionSchema,
  MultiSelectQuestionSchema,
  YesNoQuestionSchema,
  NumericQuestionSchema,
]);

// ── Answer ────────────────────────────────────────────────────────────────────
export const QuestionAnswerSchema = z.object({
  value: z.union([z.string(), z.array(z.string()), z.boolean(), z.number()]),
  generatedByModel: z.string().optional(),
  humanEdited: z.boolean().default(false),
  humanApproved: z.boolean().default(false),
  answeredAt: z.coerce.date().optional(),
  notes: z.string().optional(),
});

// ── Full question ─────────────────────────────────────────────────────────────
export const ApplicationQuestionSchema = z.object({
  id: z.string().uuid(),
  applicationDraftId: z.string().uuid(),
  ordinal: z.number().int().nonnegative(),
  prompt: z.string().min(1),
  isRequired: z.boolean().default(true),
  isSensitive: z.boolean().default(false),
  category: z
    .enum([
      "eligibility",
      "experience",
      "motivation",
      "salary",
      "availability",
      "demographic",
      "other",
    ])
    .default("other"),
  config: QuestionTypeSchema,
  answer: QuestionAnswerSchema.optional(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export type QuestionType = z.infer<typeof QuestionTypeSchema>;
export type QuestionAnswer = z.infer<typeof QuestionAnswerSchema>;
export type ApplicationQuestion = z.infer<typeof ApplicationQuestionSchema>;
