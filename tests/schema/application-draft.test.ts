import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";
import {
  ApplicationDraftSchema,
  ApplicationDraftStatusSchema,
} from "../../packages/schema/src/application-draft.js";

const sample = JSON.parse(
  readFileSync(resolve("data/samples/application-draft.sample.json"), "utf-8")
);

describe("ApplicationDraftSchema — sample JSON", () => {
  it("parses sample file successfully", () => {
    const r = ApplicationDraftSchema.safeParse(sample);
    if (!r.success) console.error(r.error.format());
    expect(r.success).toBe(true);
  });
});

describe("ApplicationDraftSchema — validation", () => {
  const base = {
    id: "f6a7b8c9-d0e1-2345-f0a1-456789012345",
    userProfileId: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    jobPostingId: "c3d4e5f6-a7b8-9012-cdef-123456789012",
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  it("defaults status to pending_evaluation", () => {
    const r = ApplicationDraftSchema.safeParse(base);
    expect(r.success && r.data.status).toBe("pending_evaluation");
  });

  it("defaults priority to medium", () => {
    const r = ApplicationDraftSchema.safeParse(base);
    expect(r.success && r.data.priority).toBe("medium");
  });

  it("rejects invalid recruiterEmail", () => {
    const r = ApplicationDraftSchema.safeParse({ ...base, recruiterEmail: "not-email" });
    expect(r.success).toBe(false);
  });

  it("rejects offerCurrency longer than 3 chars", () => {
    const r = ApplicationDraftSchema.safeParse({
      ...base,
      offerAmount: 160000,
      offerCurrency: "AUDD",
    });
    expect(r.success).toBe(false);
  });
});

describe("ApplicationDraftStatusSchema", () => {
  const validStatuses = [
    "pending_evaluation", "evaluated", "rejected_by_user", "tailoring",
    "pending_review", "approved", "submitting", "submitted",
    "acknowledged", "interviewing", "offer_received", "offer_accepted",
    "offer_declined", "rejected_by_employer", "ghosted", "withdrawn", "archived",
  ];

  it.each(validStatuses)("accepts status: %s", (s) => {
    expect(ApplicationDraftStatusSchema.safeParse(s).success).toBe(true);
  });

  it("rejects unknown status", () => {
    expect(ApplicationDraftStatusSchema.safeParse("pending").success).toBe(false);
  });
});
