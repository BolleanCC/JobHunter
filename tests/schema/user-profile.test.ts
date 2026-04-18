import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";
import {
  UserProfileSchema,
  UserProfileIdentitySchema,
  UserProfilePresentationSchema,
} from "../../packages/schema/src/user-profile.js";

const sample = JSON.parse(
  readFileSync(resolve("data/samples/user-profile.sample.json"), "utf-8")
);

describe("UserProfileSchema — sample JSON", () => {
  it("parses sample file successfully", () => {
    const r = UserProfileSchema.safeParse(sample);
    if (!r.success) console.error(r.error.format());
    expect(r.success).toBe(true);
  });
});

describe("UserProfileIdentitySchema", () => {
  it("accepts valid identity", () => {
    const r = UserProfileIdentitySchema.safeParse({
      id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      createdAt: new Date(),
      legalName: "Jane Doe",
      email: "jane@example.com",
      workAuthorizations: [{ country: "AU", status: "citizen" }],
    });
    expect(r.success).toBe(true);
  });

  it("rejects empty workAuthorizations array", () => {
    const r = UserProfileIdentitySchema.safeParse({
      id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      createdAt: new Date(),
      legalName: "Jane Doe",
      email: "jane@example.com",
      workAuthorizations: [],
    });
    expect(r.success).toBe(false);
  });

  it("rejects invalid email", () => {
    const r = UserProfileIdentitySchema.safeParse({
      id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      createdAt: new Date(),
      legalName: "Jane Doe",
      email: "not-an-email",
      workAuthorizations: [{ country: "AU", status: "citizen" }],
    });
    expect(r.success).toBe(false);
  });
});

describe("UserProfilePresentationSchema", () => {
  it("defaults relocationPreference to 'no'", () => {
    const r = UserProfilePresentationSchema.safeParse({
      displayName: "Jane",
      updatedAt: new Date(),
    });
    expect(r.success && r.data.relocationPreference).toBe("no");
  });

  it("validates salary range refinement (max >= min)", () => {
    const r = UserProfilePresentationSchema.safeParse({
      displayName: "Jane",
      updatedAt: new Date(),
      salaryExpectation: {
        min: 200000,
        max: 100000,
        currency: "AUD",
        period: "annual",
      },
    });
    expect(r.success).toBe(false);
  });

  it("rejects invalid social link URL", () => {
    const r = UserProfilePresentationSchema.safeParse({
      displayName: "Jane",
      updatedAt: new Date(),
      socialLinks: { linkedin: "not-a-url", other: [] },
    });
    expect(r.success).toBe(false);
  });
});
