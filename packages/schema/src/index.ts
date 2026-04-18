// ── Shared primitives ─────────────────────────────────────────────────────────
export * from "./shared.js";

// ── Core domain schemas ───────────────────────────────────────────────────────
export * from "./user-profile.js";
export * from "./resume-master.js";
export * from "./job-posting.js";
export * from "./job-requirements.js";
export * from "./tailored-resume.js";
export * from "./application-question.js";
export * from "./application-draft.js";
export * from "./application-run-log.js";

// ── Legacy schemas (preserved for DB compatibility) ───────────────────────────
export * from "./job.js";
export * from "./profile.js";
export * from "./application.js";
