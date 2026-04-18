import { z } from "zod";

// ── Date helpers ──────────────────────────────────────────────────────────────
/** YYYY-MM string, e.g. "2023-06" */
export const YearMonthSchema = z
  .string()
  .regex(/^\d{4}-\d{2}$/, "Expected YYYY-MM format");

// ── Money ─────────────────────────────────────────────────────────────────────
export const SalaryRangeSchema = z
  .object({
    min: z.number().int().positive(),
    max: z.number().int().positive(),
    currency: z.string().length(3, "ISO 4217 code, e.g. AUD"),
    period: z.enum(["annual", "monthly", "daily", "hourly"]),
    isNegotiable: z.boolean().default(true),
  })
  .refine((s) => s.max >= s.min, {
    message: "max must be >= min",
    path: ["max"],
  });

export type SalaryRange = z.infer<typeof SalaryRangeSchema>;

// ── Work authorisation ────────────────────────────────────────────────────────
export const WorkAuthStatusSchema = z.enum([
  "citizen",
  "permanent_resident",
  "visa_holder",
  "requires_sponsorship",
  "not_specified",
]);

export const WorkAuthorizationSchema = z.object({
  country: z.string().min(2, "ISO 3166-1 alpha-2 country code"),
  status: WorkAuthStatusSchema,
  visaType: z.string().optional(),
  expiresAt: YearMonthSchema.optional(),
  sponsorshipRequired: z.boolean().default(false),
});

export type WorkAuthorization = z.infer<typeof WorkAuthorizationSchema>;

// ── Relocation ────────────────────────────────────────────────────────────────
export const RelocationPreferenceSchema = z.enum([
  "no",
  "yes_with_package",
  "yes_self_funded",
  "open_to_discuss",
]);

export type RelocationPreference = z.infer<typeof RelocationPreferenceSchema>;

// ── Seniority ─────────────────────────────────────────────────────────────────
export const SenioritySchema = z.enum([
  "intern",
  "junior",
  "mid",
  "senior",
  "staff",
  "principal",
  "lead",
  "manager",
  "director",
  "vp",
  "c_level",
  "not_specified",
]);

export type Seniority = z.infer<typeof SenioritySchema>;

// ── Skills ────────────────────────────────────────────────────────────────────
export const SkillProficiencySchema = z.enum([
  "beginner",
  "intermediate",
  "advanced",
  "expert",
]);

export const SkillEntrySchema = z.object({
  name: z.string().min(1),
  proficiency: SkillProficiencySchema.optional(),
  yearsOfExperience: z.number().nonnegative().optional(),
  lastUsed: YearMonthSchema.optional(),
});

export type SkillEntry = z.infer<typeof SkillEntrySchema>;

// ── Links ─────────────────────────────────────────────────────────────────────
export const SocialLinksSchema = z.object({
  linkedin: z.string().url().optional(),
  github: z.string().url().optional(),
  portfolio: z.string().url().optional(),
  twitter: z.string().url().optional(),
  other: z.array(z.object({ label: z.string(), url: z.string().url() })).default([]),
});

export type SocialLinks = z.infer<typeof SocialLinksSchema>;

// ── Audit event (reused across logs) ─────────────────────────────────────────
export const AuditActorSchema = z.enum(["system", "user", "llm"]);

export const AuditEventSchema = z.object({
  at: z.coerce.date(),
  actor: AuditActorSchema,
  event: z.string().min(1),
  detail: z.string().optional(),
});

export type AuditEvent = z.infer<typeof AuditEventSchema>;
