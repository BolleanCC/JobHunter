import { z } from "zod";
import { YearMonthSchema, SkillEntrySchema } from "./shared.js";

// ── Sub-schemas ───────────────────────────────────────────────────────────────

export const WorkExperienceEntrySchema = z
  .object({
    id: z.string().uuid(),
    company: z.string().min(1),
    title: z.string().min(1),
    employmentType: z
      .enum(["full_time", "part_time", "contract", "casual", "internship", "freelance"])
      .default("full_time"),
    location: z.string().optional(),
    workMode: z.enum(["onsite", "hybrid", "remote"]).optional(),
    startDate: YearMonthSchema,
    endDate: YearMonthSchema.optional(),
    isCurrent: z.boolean().default(false),
    bullets: z.array(z.string().min(1)).min(1, "At least one bullet required"),
    technologies: z.array(z.string()).default([]),
    yearsOfExperience: z.number().nonnegative().optional(),
  })
  .refine((e) => e.isCurrent || e.endDate !== undefined, {
    message: "endDate required when isCurrent is false",
    path: ["endDate"],
  });

export const EducationEntrySchema = z.object({
  id: z.string().uuid(),
  institution: z.string().min(1),
  degree: z.string().min(1),
  field: z.string().optional(),
  startDate: YearMonthSchema.optional(),
  endDate: YearMonthSchema.optional(),
  gpa: z.number().min(0).max(10).optional(),
  honors: z.string().optional(),
  relevantCourses: z.array(z.string()).default([]),
});

export const ProjectEntrySchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  description: z.string().min(1),
  url: z.string().url().optional(),
  repoUrl: z.string().url().optional(),
  technologies: z.array(z.string()).default([]),
  highlights: z.array(z.string()).default([]),
  startDate: YearMonthSchema.optional(),
  endDate: YearMonthSchema.optional(),
  isCurrent: z.boolean().default(false),
});

export const CertificationEntrySchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  issuer: z.string().min(1),
  issuedAt: YearMonthSchema.optional(),
  expiresAt: YearMonthSchema.optional(),
  credentialId: z.string().optional(),
  credentialUrl: z.string().url().optional(),
});

export const AwardEntrySchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1),
  issuer: z.string().min(1),
  date: YearMonthSchema.optional(),
  description: z.string().optional(),
});

export const PublicationEntrySchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1),
  publisher: z.string().min(1),
  publishedAt: YearMonthSchema.optional(),
  url: z.string().url().optional(),
  coAuthors: z.array(z.string()).default([]),
});

// ── Immutable identity ────────────────────────────────────────────────────────
export const ResumeMasterIdentitySchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  createdAt: z.coerce.date(),
});

// ── Editable presentation ─────────────────────────────────────────────────────
export const ResumeMasterPresentationSchema = z.object({
  label: z.string().default("Master Resume"),
  summary: z.string().max(1000).optional(),
  experience: z.array(WorkExperienceEntrySchema).default([]),
  education: z.array(EducationEntrySchema).default([]),
  projects: z.array(ProjectEntrySchema).default([]),
  skills: z.array(SkillEntrySchema).default([]),
  certifications: z.array(CertificationEntrySchema).default([]),
  awards: z.array(AwardEntrySchema).default([]),
  publications: z.array(PublicationEntrySchema).default([]),
  volunteerWork: z
    .array(
      z.object({
        organization: z.string(),
        role: z.string(),
        startDate: YearMonthSchema.optional(),
        endDate: YearMonthSchema.optional(),
        description: z.string().optional(),
      })
    )
    .default([]),
  totalYearsOfExperience: z.number().nonnegative().optional(),
  updatedAt: z.coerce.date(),
});

// ── Full schema ───────────────────────────────────────────────────────────────
export const ResumeMasterSchema = ResumeMasterIdentitySchema.merge(
  ResumeMasterPresentationSchema
);

export type WorkExperienceEntry = z.infer<typeof WorkExperienceEntrySchema>;
export type EducationEntry = z.infer<typeof EducationEntrySchema>;
export type ProjectEntry = z.infer<typeof ProjectEntrySchema>;
export type CertificationEntry = z.infer<typeof CertificationEntrySchema>;
export type ResumeMasterIdentity = z.infer<typeof ResumeMasterIdentitySchema>;
export type ResumeMasterPresentation = z.infer<typeof ResumeMasterPresentationSchema>;
export type ResumeMaster = z.infer<typeof ResumeMasterSchema>;
