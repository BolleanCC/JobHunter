import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";
import {
  JobRequirementsSchema,
  ExtractedSkillSchema,
  RedFlagSchema,
} from "../../packages/schema/src/job-requirements.js";

const sample = JSON.parse(
  readFileSync(resolve("data/samples/job-requirements.sample.json"), "utf-8")
);

describe("JobRequirementsSchema — sample JSON", () => {
  it("parses sample file successfully", () => {
    const r = JobRequirementsSchema.safeParse(sample);
    if (!r.success) console.error(r.error.format());
    expect(r.success).toBe(true);
  });

  it("humanReviewed defaults to false", () => {
    const r = JobRequirementsSchema.safeParse(sample);
    expect(r.success && r.data.humanReviewed).toBe(false);
  });
});

describe("ExtractedSkillSchema", () => {
  it("accepts required skill with yearsRequired", () => {
    const r = ExtractedSkillSchema.safeParse({
      name: "TypeScript",
      category: "language",
      yearsRequired: 5,
      isRequired: true,
    });
    expect(r.success).toBe(true);
  });

  it("defaults isAmbiguous to false", () => {
    const r = ExtractedSkillSchema.safeParse({ name: "Go", isRequired: false });
    expect(r.success && r.data.isAmbiguous).toBe(false);
  });

  it("rejects negative yearsRequired", () => {
    const r = ExtractedSkillSchema.safeParse({ name: "Go", isRequired: true, yearsRequired: -1 });
    expect(r.success).toBe(false);
  });
});

describe("RedFlagSchema", () => {
  it("accepts valid red flag", () => {
    const r = RedFlagSchema.safeParse({
      type: "unpaid_trial",
      description: "Job asks for 1-week unpaid trial project",
      severity: "high",
    });
    expect(r.success).toBe(true);
  });

  it("rejects unknown red flag type", () => {
    const r = RedFlagSchema.safeParse({
      type: "bad_vibes",
      description: "Something feels off",
      severity: "low",
    });
    expect(r.success).toBe(false);
  });
});
