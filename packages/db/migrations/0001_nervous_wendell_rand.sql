CREATE TABLE `job_requirements` (
	`id` text PRIMARY KEY NOT NULL,
	`job_posting_id` text,
	`raw_extraction_json` text NOT NULL,
	`normalized_json` text NOT NULL,
	`extracted_by_model` text NOT NULL,
	`extracted_at` integer NOT NULL,
	`human_reviewed` integer DEFAULT false NOT NULL,
	`created_at` integer NOT NULL
);
