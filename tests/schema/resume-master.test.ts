import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";
import {
  ResumeMasterSchema,
  WorkExperienceEntrySchema,
  EducationEntrySchema,
  ProjectEntrySchema,
} from "../../packages/schema/src/resume-master.js";

const sample = JSON.parse(
  readFileSync(resolve("data/samples/resume-master.sample.json"), "utf-8")
);

describe("ResumeMasterSchema — sample JSON", () => {
  it("parses sample file successfully", () => {
    const r = ResumeMasterSchema.safeParse(sample);
    if (!r.success) console.error(r.error.format());
    expect(r.success).toBe(true);
  });
});

describe("WorkExperienceEntrySchema", () => {
  const base = {
    id: "e1000001-0000-0000-0000-000000000001",
    company: "Acme",
    title: "Engineer",
    startDate: "2020-01",
    isCurrent: true,
    bullets: ["Did a thing"],
  };

  it("accepts current role without endDate", () => {
    expect(WorkExperienceEntrySchema.safeParse(base).success).toBe(true);
  });

  it("rejects non-current role without endDate", () => {
    const r = WorkExperienceEntrySchema.safeParse({ ...base, isCurrent: false });
    expect(r.success).toBe(false);
  });

  it("accepts non-current role with endDate", () => {
    const r = WorkExperienceEntrySchema.safeParse({
      ...base,
      isCurrent: false,
      endDate: "2022-06",
    });
    expect(r.success).toBe(true);
  });

  it("rejects empty bullets array", () => {
    const r = WorkExperienceEntrySchema.safeParse({ ...base, bullets: [] });
    expect(r.success).toBe(false);
  });

  it("rejects invalid startDate format", () => {
    const r = WorkExperienceEntrySchema.safeParse({ ...base, startDate: "January 2020" });
    expect(r.success).toBe(false);
  });
});

describe("EducationEntrySchema", () => {
  it("accepts minimal education entry", () => {
    const r = EducationEntrySchema.safeParse({
      id: "ed000001-0000-0000-0000-000000000001",
      institution: "UNSW",
      degree: "Bachelor of Engineering",
    });
    expect(r.success).toBe(true);
  });

  it("rejects GPA over 10", () => {
    const r = EducationEntrySchema.safeParse({
      id: "ed000001-0000-0000-0000-000000000001",
      institution: "UNSW",
      degree: "Bachelor of Engineering",
      gpa: 11,
    });
    expect(r.success).toBe(false);
  });
});

describe("ProjectEntrySchema", () => {
  it("rejects invalid repo URL", () => {
    const r = ProjectEntrySchema.safeParse({
      id: "pr000001-0000-0000-0000-000000000001",
      name: "MyProject",
      description: "A cool project",
      repoUrl: "not-a-url",
    });
    expect(r.success).toBe(false);
  });
});
