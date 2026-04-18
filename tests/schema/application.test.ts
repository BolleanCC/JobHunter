import { describe, it, expect } from "vitest";
import { ApplicationSchema, ApplicationStatusSchema } from "../../packages/schema/src/application.js";

const baseApp = {
  id: "123e4567-e89b-12d3-a456-426614174001",
  jobId: "123e4567-e89b-12d3-a456-426614174000",
  status: "discovered" as const,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe("ApplicationSchema", () => {
  it("accepts a valid minimal application", () => {
    const result = ApplicationSchema.safeParse(baseApp);
    expect(result.success).toBe(true);
  });

  it("defaults auditLog to empty array", () => {
    const result = ApplicationSchema.safeParse(baseApp);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.auditLog).toEqual([]);
  });

  it("accepts a full fitScore", () => {
    const result = ApplicationSchema.safeParse({
      ...baseApp,
      fitScore: {
        overall: 82,
        skills: 90,
        experience: 75,
        location: 100,
        salary: 80,
        reasoning: "Strong match on TypeScript and Node.js",
        skillGaps: ["Kubernetes"],
        strengths: ["TypeScript", "AWS"],
      },
    });
    expect(result.success).toBe(true);
  });

  it("rejects a fit score over 100", () => {
    const result = ApplicationSchema.safeParse({
      ...baseApp,
      fitScore: {
        overall: 101,
        skills: 90,
        experience: 75,
        location: 100,
        salary: 80,
        reasoning: "too good to be true",
        skillGaps: [],
        strengths: [],
      },
    });
    expect(result.success).toBe(false);
  });
});

describe("ApplicationStatusSchema", () => {
  const validStatuses = [
    "discovered", "evaluated", "approved", "tailored",
    "ready", "submitted", "acknowledged", "interviewing",
    "offer", "rejected", "withdrawn", "archived",
  ];

  it.each(validStatuses)("accepts status: %s", (status) => {
    expect(ApplicationStatusSchema.safeParse(status).success).toBe(true);
  });

  it("rejects unknown status", () => {
    expect(ApplicationStatusSchema.safeParse("ghosted").success).toBe(false);
  });
});
