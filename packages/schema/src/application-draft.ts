import { z } from "zod";

export const ApplicationDraftStatusSchema = z.enum([
  "pending_evaluation",   // job found, awaiting fit score
  "evaluated",            // scored; awaiting human go/no-go
  "rejected_by_user",     // user decided not to apply
  "tailoring",            // LLM generating tailored docs
  "pending_review",       // tailored docs ready; human must review
  "approved",             // human approved all docs
  "submitting",           // user is actively submitting
  "submitted",            // submission confirmed
  "acknowledged",         // employer confirmed receipt
  "interviewing",         // active interview process
  "offer_received",       // offer in hand
  "offer_accepted",       // accepted
  "offer_declined",       // declined
  "rejected_by_employer", // employer rejected
  "ghosted",              // no response after follow-ups
  "withdrawn",            // user withdrew
  "archived",             // no longer tracked
]);

export const SubmissionMethodSchema = z.enum([
  "platform_apply",   // apply button on job board
  "company_portal",   // employer's own ATS portal
  "email",            // direct email submission
  "referral",         // via a contact
  "recruiter",        // via external recruiter
  "other",
]);

export const FollowUpSchema = z.object({
  scheduledFor: z.coerce.date(),
  channel: z.enum(["email", "linkedin", "phone", "other"]),
  completed: z.boolean().default(false),
  completedAt: z.coerce.date().optional(),
  notes: z.string().optional(),
});

// ── Immutable identity ────────────────────────────────────────────────────────
export const ApplicationDraftIdentitySchema = z.object({
  id: z.string().uuid(),
  userProfileId: z.string().uuid(),
  jobPostingId: z.string().uuid(),
  createdAt: z.coerce.date(),
});

// ── Editable state ────────────────────────────────────────────────────────────
export const ApplicationDraftPresentationSchema = z.object({
  status: ApplicationDraftStatusSchema.default("pending_evaluation"),
  tailoredResumeId: z.string().uuid().optional(),
  submissionMethod: SubmissionMethodSchema.optional(),
  submittedAt: z.coerce.date().optional(),
  submissionConfirmationRef: z.string().optional(),
  followUps: z.array(FollowUpSchema).default([]),
  salaryDiscussed: z.number().int().positive().optional(),
  offerAmount: z.number().int().positive().optional(),
  offerCurrency: z.string().length(3).optional(),
  offerDeadline: z.coerce.date().optional(),
  recruiterName: z.string().optional(),
  recruiterEmail: z.string().email().optional(),
  notes: z.string().optional(),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
  updatedAt: z.coerce.date(),
});

// ── Full schema ───────────────────────────────────────────────────────────────
export const ApplicationDraftSchema = ApplicationDraftIdentitySchema.merge(
  ApplicationDraftPresentationSchema
);

export type ApplicationDraftStatus = z.infer<typeof ApplicationDraftStatusSchema>;
export type FollowUp = z.infer<typeof FollowUpSchema>;
export type ApplicationDraftIdentity = z.infer<typeof ApplicationDraftIdentitySchema>;
export type ApplicationDraftPresentation = z.infer<typeof ApplicationDraftPresentationSchema>;
export type ApplicationDraft = z.infer<typeof ApplicationDraftSchema>;
