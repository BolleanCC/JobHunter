import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";
import { JobPostingSchema } from "../../packages/schema/src/job-posting.js";

const sample = JSON.parse(
  readFileSync(resolve("data/samples/job-posting.sample.json"), "utf-8")
);

describe("JobPostingSchema — sample JSON", () => {
  it("parses sample file successfully", () => {
    const r = JobPostingSchema.safeParse(sample);
    if (!r.success) console.error(r.error.format());
    expect(r.success).toBe(true);
  });
});

describe("JobPostingSchema — validation", () => {
  const base = {
    id: "c3d4e5f6-a7b8-9012-cdef-123456789012",
    source: {
      platform: "seek",
      sourceId: "seek-001",
      url: "https://seek.com.au/job/1",
      scrapedAt: new Date(),
    },
    createdAt: new Date(),
    title: "Engineer",
    company: "Acme",
    description: "Build things.",
    updatedAt: new Date(),
  };

  it("accepts minimal posting", () => {
    expect(JobPostingSchema.safeParse(base).success).toBe(true);
  });

  it("rejects invalid source URL", () => {
    const r = JobPostingSchema.safeParse({
      ...base,
      source: { ...base.source, url: "seek/job/1" },
    });
    expect(r.success).toBe(false);
  });

  it("rejects invalid applicationUrl", () => {
    const r = JobPostingSchema.safeParse({ ...base, applicationUrl: "apply-here" });
    expect(r.success).toBe(false);
  });

  it("rejects invalid contactEmail", () => {
    const r = JobPostingSchema.safeParse({ ...base, contactEmail: "not-email" });
    expect(r.success).toBe(false);
  });

  it("rejects unknown platform", () => {
    const r = JobPostingSchema.safeParse({
      ...base,
      source: { ...base.source, platform: "monster" },
    });
    expect(r.success).toBe(false);
  });
});
