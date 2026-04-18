import { describe, it, expect } from "vitest";
import {
  SalaryRangeSchema,
  WorkAuthorizationSchema,
  SkillEntrySchema,
  AuditEventSchema,
} from "../../packages/schema/src/shared.js";

describe("SalaryRangeSchema", () => {
  const valid = { min: 100000, max: 150000, currency: "AUD", period: "annual" as const };

  it("accepts valid salary range", () => {
    expect(SalaryRangeSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects max < min", () => {
    const r = SalaryRangeSchema.safeParse({ ...valid, min: 200000, max: 100000 });
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error.issues[0]?.path).toContain("max");
  });

  it("rejects currency longer than 3 chars", () => {
    expect(SalaryRangeSchema.safeParse({ ...valid, currency: "AUDD" }).success).toBe(false);
  });

  it("defaults isNegotiable to true", () => {
    const r = SalaryRangeSchema.safeParse(valid);
    expect(r.success && r.data.isNegotiable).toBe(true);
  });
});

describe("WorkAuthorizationSchema", () => {
  it("accepts citizen status without visa fields", () => {
    const r = WorkAuthorizationSchema.safeParse({ country: "AU", status: "citizen" });
    expect(r.success).toBe(true);
  });

  it("accepts visa_holder with optional fields", () => {
    const r = WorkAuthorizationSchema.safeParse({
      country: "AU",
      status: "visa_holder",
      visaType: "485",
      expiresAt: "2026-03",
    });
    expect(r.success).toBe(true);
  });

  it("rejects invalid status", () => {
    expect(WorkAuthorizationSchema.safeParse({ country: "AU", status: "illegal" }).success).toBe(false);
  });

  it("rejects invalid expiresAt format", () => {
    expect(
      WorkAuthorizationSchema.safeParse({ country: "AU", status: "visa_holder", expiresAt: "March 2026" }).success
    ).toBe(false);
  });
});

describe("SkillEntrySchema", () => {
  it("accepts minimal skill", () => {
    expect(SkillEntrySchema.safeParse({ name: "TypeScript" }).success).toBe(true);
  });

  it("accepts full skill", () => {
    const r = SkillEntrySchema.safeParse({
      name: "TypeScript",
      proficiency: "expert",
      yearsOfExperience: 6,
      lastUsed: "2024-10",
    });
    expect(r.success).toBe(true);
  });

  it("rejects empty name", () => {
    expect(SkillEntrySchema.safeParse({ name: "" }).success).toBe(false);
  });

  it("rejects negative yearsOfExperience", () => {
    expect(SkillEntrySchema.safeParse({ name: "Go", yearsOfExperience: -1 }).success).toBe(false);
  });
});

describe("AuditEventSchema", () => {
  it("accepts valid event", () => {
    const r = AuditEventSchema.safeParse({
      at: new Date(),
      actor: "user",
      event: "approved",
    });
    expect(r.success).toBe(true);
  });

  it("rejects unknown actor", () => {
    expect(
      AuditEventSchema.safeParse({ at: new Date(), actor: "bot", event: "x" }).success
    ).toBe(false);
  });
});
