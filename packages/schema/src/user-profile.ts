import { z } from "zod";
import {
  SalaryRangeSchema,
  WorkAuthorizationSchema,
  RelocationPreferenceSchema,
  SocialLinksSchema,
} from "./shared.js";

// ── Immutable identity ────────────────────────────────────────────────────────
// Set once at account creation; never edited by the user.
export const UserProfileIdentitySchema = z.object({
  id: z.string().uuid(),
  createdAt: z.coerce.date(),
  legalName: z.string().min(1),
  email: z.string().email(),
  workAuthorizations: z
    .array(WorkAuthorizationSchema)
    .min(1, "At least one work authorisation entry required"),
});

// ── Editable presentation ─────────────────────────────────────────────────────
// User can update these freely between applications.
export const UserProfilePresentationSchema = z.object({
  displayName: z.string().min(1),
  headline: z.string().max(200).optional(),
  phone: z.string().optional(),
  location: z.string().optional(),
  socialLinks: SocialLinksSchema.optional(),
  targetRoles: z.array(z.string()).default([]),
  targetLocations: z.array(z.string()).default([]),
  targetWorkModes: z
    .array(z.enum(["onsite", "hybrid", "remote"]))
    .default([]),
  salaryExpectation: SalaryRangeSchema.optional(),
  relocationPreference: RelocationPreferenceSchema.default("no"),
  noticePeriodDays: z.number().int().nonnegative().optional(),
  availableFrom: z.coerce.date().optional(),
  openToContract: z.boolean().default(false),
  openToPartTime: z.boolean().default(false),
  languages: z
    .array(
      z.object({
        language: z.string(),
        proficiency: z.enum(["basic", "conversational", "professional", "native"]),
      })
    )
    .default([]),
  updatedAt: z.coerce.date(),
});

// ── Full schema ───────────────────────────────────────────────────────────────
export const UserProfileSchema = UserProfileIdentitySchema.merge(
  UserProfilePresentationSchema
);

export type UserProfileIdentity = z.infer<typeof UserProfileIdentitySchema>;
export type UserProfilePresentation = z.infer<typeof UserProfilePresentationSchema>;
export type UserProfile = z.infer<typeof UserProfileSchema>;
