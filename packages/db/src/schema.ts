import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";

// Jobs discovered from all sources
export const jobs = sqliteTable("jobs", {
  id: text("id").primaryKey(),
  sourceId: text("source_id").notNull(),
  source: text("source").notNull(),
  url: text("url").notNull().unique(),
  title: text("title").notNull(),
  company: text("company").notNull(),
  location: text("location"),
  workMode: text("work_mode"),
  employmentType: text("employment_type"),
  salaryMin: integer("salary_min"),
  salaryMax: integer("salary_max"),
  salaryCurrency: text("salary_currency"),
  description: text("description").notNull(),
  // JSON arrays stored as text
  requirements: text("requirements").notNull().default("[]"),
  niceToHave: text("nice_to_have").notNull().default("[]"),
  postedAt: integer("posted_at", { mode: "timestamp" }),
  scrapedAt: integer("scraped_at", { mode: "timestamp" }).notNull(),
  expiresAt: integer("expires_at", { mode: "timestamp" }),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
});

// One application per job
export const applications = sqliteTable("applications", {
  id: text("id").primaryKey(),
  jobId: text("job_id")
    .notNull()
    .references(() => jobs.id),
  status: text("status").notNull().default("discovered"),
  // JSON blob for fit score
  fitScore: text("fit_score"),
  // JSON blob for tailored docs metadata
  tailoredDocuments: text("tailored_documents"),
  notes: text("notes"),
  // JSON array of audit events
  auditLog: text("audit_log").notNull().default("[]"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
  submittedAt: integer("submitted_at", { mode: "timestamp" }),
  followUpAt: integer("follow_up_at", { mode: "timestamp" }),
});

// Cached LLM token usage for observability
export const llmUsage = sqliteTable("llm_usage", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  operation: text("operation").notNull(),
  applicationId: text("application_id").references(() => applications.id),
  model: text("model").notNull(),
  inputTokens: integer("input_tokens").notNull(),
  outputTokens: integer("output_tokens").notNull(),
  cacheReadTokens: integer("cache_read_tokens").notNull().default(0),
  cacheWriteTokens: integer("cache_write_tokens").notNull().default(0),
  costUsd: real("cost_usd"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});
