import { z } from "zod";

export const JobSourceSchema = z.enum([
  "linkedin",
  "seek",
  "indeed",
  "glassdoor",
  "company_site",
  "referral",
  "manual",
]);

export const EmploymentTypeSchema = z.enum([
  "full_time",
  "part_time",
  "contract",
  "casual",
  "internship",
]);

export const WorkModeSchema = z.enum(["onsite", "hybrid", "remote"]);

export const JobSchema = z.object({
  id: z.string().uuid(),
  sourceId: z.string(),
  source: JobSourceSchema,
  url: z.string().url(),
  title: z.string().min(1),
  company: z.string().min(1),
  location: z.string().optional(),
  workMode: WorkModeSchema.optional(),
  employmentType: EmploymentTypeSchema.optional(),
  salaryMin: z.number().int().positive().optional(),
  salaryMax: z.number().int().positive().optional(),
  salaryCurrency: z.string().length(3).optional(),
  description: z.string(),
  requirements: z.array(z.string()).default([]),
  niceToHave: z.array(z.string()).default([]),
  postedAt: z.coerce.date().optional(),
  scrapedAt: z.coerce.date(),
  expiresAt: z.coerce.date().optional(),
  isActive: z.boolean().default(true),
});

export type Job = z.infer<typeof JobSchema>;
export type JobSource = z.infer<typeof JobSourceSchema>;
export type EmploymentType = z.infer<typeof EmploymentTypeSchema>;
export type WorkMode = z.infer<typeof WorkModeSchema>;
