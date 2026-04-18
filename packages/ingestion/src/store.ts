import type { Db } from "@jobhunter/db";
import { schema } from "@jobhunter/db";
import type { AnalysisResult } from "./types.js";

/**
 * Persists both the raw LLM extraction and the validated requirements to the DB.
 * Returns the stored row's id.
 */
export async function storeAnalysisResult(
  result: AnalysisResult,
  db: Db
): Promise<string> {
  const now = new Date();
  const { requirements, rawExtraction } = result;

  await db.insert(schema.jobRequirements).values({
    id: requirements.id,
    jobPostingId: requirements.jobPostingId,
    rawExtractionJson: JSON.stringify(rawExtraction.toolInput),
    normalizedJson: JSON.stringify(requirements),
    extractedByModel: rawExtraction.modelUsed,
    extractedAt: requirements.extractedAt,
    humanReviewed: false,
    createdAt: now,
  });

  // Track LLM token usage separately for observability
  await db.insert(schema.llmUsage).values({
    operation: "extract_requirements",
    model: rawExtraction.modelUsed,
    inputTokens: rawExtraction.usage.inputTokens,
    outputTokens: rawExtraction.usage.outputTokens,
    cacheReadTokens: rawExtraction.usage.cacheReadTokens,
    cacheWriteTokens: rawExtraction.usage.cacheWriteTokens,
    createdAt: now,
  });

  return requirements.id;
}
