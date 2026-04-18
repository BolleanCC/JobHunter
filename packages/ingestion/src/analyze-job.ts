import { randomUUID } from "crypto";
import { z } from "zod";
import {
  JobRequirementsSchema,
  JobRequirementsPresentationSchema,
} from "@jobhunter/schema";
import type { JobRequirements } from "@jobhunter/schema";
import { preprocessJobDescription } from "./preprocess.js";
import type { LlmAnalysisAdapter } from "./llm-adapter.js";
import type { AnalysisResult } from "./types.js";

export type AnalyzeJobOptions = {
  adapter: LlmAnalysisAdapter;
  /**
   * If provided, links the resulting JobRequirements to this job posting.
   * If omitted, a placeholder UUID is used.
   */
  jobPostingId?: string;
  /**
   * Override the model name recorded in the identity fields.
   * Defaults to what the adapter reports.
   */
  modelOverride?: string;
};

export class ExtractionValidationError extends Error {
  constructor(
    public readonly issues: z.ZodIssue[],
    public readonly rawToolInput: unknown
  ) {
    super(
      `LLM extraction failed Zod validation (${issues.length} issue(s)):\n` +
        issues.map((i) => `  ${i.path.join(".")}: ${i.message}`).join("\n")
    );
    this.name = "ExtractionValidationError";
  }
}

export async function analyzeJobDescription(
  rawText: string,
  opts: AnalyzeJobOptions
): Promise<AnalysisResult> {
  // ── 1. Deterministic preprocessing ────────────────────────────────────────
  const preprocessed = preprocessJobDescription(rawText);

  // ── 2. LLM extraction ─────────────────────────────────────────────────────
  const rawExtraction = await opts.adapter.analyzeJobDescription({
    cleanedText: preprocessed.cleanedText,
    hints: preprocessed.hints,
  });

  // ── 3. Validate presentation layer with Zod ────────────────────────────────
  const presentationResult = JobRequirementsPresentationSchema.safeParse(
    rawExtraction.toolInput
  );

  if (!presentationResult.success) {
    throw new ExtractionValidationError(
      presentationResult.error.issues,
      rawExtraction.toolInput
    );
  }

  // ── 4. Merge with identity to produce full JobRequirements ─────────────────
  const now = new Date();
  const jobPostingId = opts.jobPostingId ?? randomUUID();

  const fullRecord = JobRequirementsSchema.parse({
    id: randomUUID(),
    jobPostingId,
    extractedAt: now,
    extractedByModel: opts.modelOverride ?? rawExtraction.modelUsed,
    ...presentationResult.data,
  } satisfies JobRequirements);

  return {
    requirements: fullRecord,
    rawExtraction,
    preprocessed,
  };
}
