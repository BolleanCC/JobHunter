import { z } from "zod";
import { SalaryRangeSchema, SenioritySchema } from "./shared.js";

// ── Source metadata (immutable once scraped) ──────────────────────────────────
export const JobPostingSourceSchema = z.object({
  platform: z.enum([
    "linkedin",
    "seek",
    "indeed",
    "glassdoor",
    "company_site",
    "referral",
    "manual",
  ]),
  sourceId: z.string(),
  url: z.string().url(),
  scrapedAt: z.coerce.date(),
  rawHtml: z.string().optional(),
  rawText: z.string().optional(),
});

// ── Immutable identity ────────────────────────────────────────────────────────
export const JobPostingIdentitySchema = z.object({
  id: z.string().uuid(),
  source: JobPostingSourceSchema,
  createdAt: z.coerce.date(),
});

// ── Editable / enriched presentation ─────────────────────────────────────────
// Fields may be auto-extracted then manually corrected by the user.
export const JobPostingPresentationSchema = z.object({
  title: z.string().min(1),
  company: z.string().min(1),
  companySize: z
    .enum(["1-10", "11-50", "51-200", "201-500", "501-1000", "1001-5000", "5000+"])
    .optional(),
  companyIndustry: z.string().optional(),
  location: z.string().optional(),
  workMode: z.enum(["onsite", "hybrid", "remote"]).optional(),
  employmentType: z
    .enum(["full_time", "part_time", "contract", "casual", "internship"])
    .optional(),
  seniority: SenioritySchema.optional(),
  salary: SalaryRangeSchema.optional(),
  description: z.string().min(1),
  postedAt: z.coerce.date().optional(),
  expiresAt: z.coerce.date().optional(),
  isActive: z.boolean().default(true),
  applicationUrl: z.string().url().optional(),
  contactEmail: z.string().email().optional(),
  tags: z.array(z.string()).default([]),
  updatedAt: z.coerce.date(),
});

// ── Full schema ───────────────────────────────────────────────────────────────
export const JobPostingSchema = JobPostingIdentitySchema.merge(
  JobPostingPresentationSchema
);

export type JobPostingSource = z.infer<typeof JobPostingSourceSchema>;
export type JobPostingIdentity = z.infer<typeof JobPostingIdentitySchema>;
export type JobPostingPresentation = z.infer<typeof JobPostingPresentationSchema>;
export type JobPosting = z.infer<typeof JobPostingSchema>;
