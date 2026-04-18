import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";
import {
  ApplicationRunLogSchema,
  LlmCallRecordSchema,
  PipelineStepSchema,
} from "../../packages/schema/src/application-run-log.js";

const sample = JSON.parse(
  readFileSync(resolve("data/samples/application-run-log.sample.json"), "utf-8")
);

describe("ApplicationRunLogSchema — sample JSON", () => {
  it("parses sample file successfully", () => {
    const r = ApplicationRunLogSchema.safeParse(sample);
    if (!r.success) console.error(r.error.format());
    expect(r.success).toBe(true);
  });

  it("computes correct step count from sample", () => {
    const r = ApplicationRunLogSchema.safeParse(sample);
    expect(r.success && r.data.steps.length).toBe(5);
  });

  it("tracks llmCalls in sample", () => {
    const r = ApplicationRunLogSchema.safeParse(sample);
    expect(r.success && r.data.llmCalls.length).toBe(2);
  });
});

describe("LlmCallRecordSchema", () => {
  const base = {
    id: "a1b00001-0000-0000-0000-000000000001",
    operation: "score_fit" as const,
    model: "claude-sonnet-4-6",
    promptTokens: 1000,
    completionTokens: 200,
    succeeded: true,
    startedAt: new Date(),
  };

  it("accepts a valid LLM call record", () => {
    expect(LlmCallRecordSchema.safeParse(base).success).toBe(true);
  });

  it("defaults cacheReadTokens and cacheWriteTokens to 0", () => {
    const r = LlmCallRecordSchema.safeParse(base);
    expect(r.success && r.data.cacheReadTokens).toBe(0);
    expect(r.success && r.data.cacheWriteTokens).toBe(0);
  });

  it("rejects negative promptTokens", () => {
    const r = LlmCallRecordSchema.safeParse({ ...base, promptTokens: -1 });
    expect(r.success).toBe(false);
  });

  it("rejects unknown operation", () => {
    const r = LlmCallRecordSchema.safeParse({ ...base, operation: "magic" });
    expect(r.success).toBe(false);
  });
});

describe("PipelineStepSchema", () => {
  it("accepts a pending step with no timestamps", () => {
    const r = PipelineStepSchema.safeParse({
      step: "human_review_docs",
      status: "pending",
    });
    expect(r.success).toBe(true);
  });

  it("accepts a completed step with timestamps", () => {
    const r = PipelineStepSchema.safeParse({
      step: "score_fit",
      status: "completed",
      startedAt: new Date(),
      completedAt: new Date(),
      durationMs: 11000,
    });
    expect(r.success).toBe(true);
  });

  it("rejects unknown pipeline step", () => {
    const r = PipelineStepSchema.safeParse({ step: "magic_step", status: "pending" });
    expect(r.success).toBe(false);
  });
});
