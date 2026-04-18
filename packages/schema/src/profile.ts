import { z } from "zod";

export const ContactSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  location: z.string().optional(),
  linkedin: z.string().url().optional(),
  github: z.string().url().optional(),
  website: z.string().url().optional(),
});

export const SkillSchema = z.object({
  name: z.string(),
  yearsOfExperience: z.number().positive().optional(),
  proficiency: z.enum(["beginner", "intermediate", "advanced", "expert"]).optional(),
});

export const WorkExperienceSchema = z.object({
  company: z.string(),
  title: z.string(),
  startDate: z.string().regex(/^\d{4}-\d{2}$/, "Format: YYYY-MM"),
  endDate: z.string().regex(/^\d{4}-\d{2}$/, "Format: YYYY-MM").optional(),
  isCurrent: z.boolean().default(false),
  location: z.string().optional(),
  bullets: z.array(z.string()),
  technologies: z.array(z.string()).default([]),
});

export const EducationSchema = z.object({
  institution: z.string(),
  degree: z.string(),
  field: z.string().optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}$/).optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}$/).optional(),
  gpa: z.number().min(0).max(10).optional(),
  honors: z.string().optional(),
});

export const CertificationSchema = z.object({
  name: z.string(),
  issuer: z.string(),
  issuedAt: z.string().regex(/^\d{4}-\d{2}$/).optional(),
  expiresAt: z.string().regex(/^\d{4}-\d{2}$/).optional(),
  credentialUrl: z.string().url().optional(),
});

export const ProfileSchema = z.object({
  contact: ContactSchema,
  summary: z.string().optional(),
  targetRoles: z.array(z.string()).default([]),
  targetLocations: z.array(z.string()).default([]),
  targetSalaryMin: z.number().int().positive().optional(),
  skills: z.array(SkillSchema).default([]),
  experience: z.array(WorkExperienceSchema).default([]),
  education: z.array(EducationSchema).default([]),
  certifications: z.array(CertificationSchema).default([]),
  languages: z.array(z.string()).default([]),
  visaStatus: z.string().optional(),
});

export type Profile = z.infer<typeof ProfileSchema>;
export type Contact = z.infer<typeof ContactSchema>;
export type WorkExperience = z.infer<typeof WorkExperienceSchema>;
export type Education = z.infer<typeof EducationSchema>;
export type Skill = z.infer<typeof SkillSchema>;
