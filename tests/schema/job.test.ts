import { describe, it, expect } from "vitest";
import { JobSchema } from "../../packages/schema/src/job.js";

const baseJob = {
  id: "123e4567-e89b-12d3-a456-426614174000",
  sourceId: "ext-001",
  source: "linkedin" as const,
  url: "https://linkedin.com/jobs/view/123",
  title: "Senior Software Engineer",
  company: "Acme Corp",
  description: "Build great things.",
  scrapedAt: new Date(),
};

describe("JobSchema", () => {
  it("accepts a valid minimal job", () => {
    const result = JobSchema.safeParse(baseJob);
    expect(result.success).toBe(true);
  });

  it("rejects an invalid URL", () => {
    const result = JobSchema.safeParse({ ...baseJob, url: "not-a-url" });
    expect(result.success).toBe(false);
  });

  it("rejects an unknown source", () => {
    const result = JobSchema.safeParse({ ...baseJob, source: "monster" });
    expect(result.success).toBe(false);
  });

  it("defaults requirements and niceToHave to empty arrays", () => {
    const result = JobSchema.safeParse(baseJob);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.requirements).toEqual([]);
      expect(result.data.niceToHave).toEqual([]);
    }
  });

  it("accepts optional salary fields", () => {
    const result = JobSchema.safeParse({
      ...baseJob,
      salaryMin: 80000,
      salaryMax: 120000,
      salaryCurrency: "AUD",
    });
    expect(result.success).toBe(true);
  });

  it("rejects salary currency longer than 3 chars", () => {
    const result = JobSchema.safeParse({ ...baseJob, salaryCurrency: "AUDD" });
    expect(result.success).toBe(false);
  });
});
