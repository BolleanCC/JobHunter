// ── Preprocessor output ───────────────────────────────────────────────────────

export type DetectedSalary = {
  raw: string;
  min?: number;
  max?: number;
  currency?: string;
  period?: "annual" | "monthly" | "daily" | "hourly";
};

export type DetectedHints = {
  salary: DetectedSalary | null;
  location: string | null;
  workMode: "remote" | "hybrid" | "onsite" | null;
  employmentType: "full_time" | "part_time" | "contract" | "casual" | null;
  yearsOfExperience: { min: number; max?: number } | null;
  sponsorshipMentioned: boolean;
};

export type PreprocessedJob = {
  cleanedText: string;
  wordCount: number;
  hints: DetectedHints;
};

// ── LLM adapter I/O ───────────────────────────────────────────────────────────

export type AnalysisInput = {
  cleanedText: string;
  hints: DetectedHints;
};

export type TokenUsage = {
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens: number;
  cacheWriteTokens: number;
};

export type RawExtraction = {
  /** Verbatim object returned by the LLM tool call — not yet Zod-validated */
  toolInput: unknown;
  modelUsed: string;
  usage: TokenUsage;
};

// ── Pipeline result ───────────────────────────────────────────────────────────

import type { JobRequirements } from "@jobhunter/schema";

export type AnalysisResult = {
  requirements: JobRequirements;
  rawExtraction: RawExtraction;
  preprocessed: PreprocessedJob;
};
