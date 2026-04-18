import type { JobRequirements, ResumeMaster, UserProfile } from "@jobhunter/schema";
import { TAILORING_SYSTEM_PROMPT } from "./prompts/system.js";
import {
  TAILOR_BULLET_TOOL,
  buildTailorBulletPrompt,
} from "./prompts/tailor-bullet.js";
import {
  TAILOR_SUMMARY_TOOL,
  buildTailorSummaryPrompt,
} from "./prompts/tailor-summary.js";
import {
  COVER_LETTER_TOOL,
  buildCoverLetterPrompt,
} from "./prompts/cover-letter.js";

// ── Types ─────────────────────────────────────────────────────────────────────

export type BulletTailoringResult = {
  tailoredBullet: string;
  unchanged: boolean;
  keywordsInjected: string[];
};

// ── Interface ─────────────────────────────────────────────────────────────────

export interface LlmTailoringAdapter {
  tailorBullet(
    originalBullet: string,
    requirements: JobRequirements,
    context: { company: string; title: string }
  ): Promise<BulletTailoringResult>;

  tailorSummary(
    requirements: JobRequirements,
    resume: ResumeMaster,
    profile: UserProfile
  ): Promise<string>;

  generateCoverLetter(
    requirements: JobRequirements,
    resume: ResumeMaster,
    profile: UserProfile
  ): Promise<string>;
}

// ── Claude implementation ─────────────────────────────────────────────────────

export type ClaudeTailoringAdapterOptions = {
  model?: string;
  maxTokens?: number;
  apiKey?: string;
};

export class ClaudeTailoringAdapter implements LlmTailoringAdapter {
  private readonly model: string;
  private readonly maxTokens: number;
  private readonly apiKey: string;

  constructor(opts: ClaudeTailoringAdapterOptions = {}) {
    this.model = opts.model ?? "claude-sonnet-4-6";
    this.maxTokens = opts.maxTokens ?? 1024;
    const key = opts.apiKey ?? process.env["ANTHROPIC_API_KEY"];
    if (!key) throw new Error("ANTHROPIC_API_KEY is not set");
    this.apiKey = key;
  }

  private async callWithTool<T>(
    userPrompt: string,
    tool: typeof TAILOR_BULLET_TOOL | typeof TAILOR_SUMMARY_TOOL | typeof COVER_LETTER_TOOL,
    maxTokens = this.maxTokens
  ): Promise<T> {
    const { default: Anthropic } = await import("@anthropic-ai/sdk");
    const client = new Anthropic({ apiKey: this.apiKey });

    const response = await client.messages.create({
      model: this.model,
      max_tokens: maxTokens,
      system: [
        {
          type: "text",
          text: TAILORING_SYSTEM_PROMPT,
          // @ts-expect-error — cache_control may not be in older SDK types
          cache_control: { type: "ephemeral" },
        },
      ],
      tools: [tool],
      tool_choice: { type: "tool", name: tool.name },
      messages: [{ role: "user", content: userPrompt }],
    });

    const toolBlock = response.content.find((b) => b.type === "tool_use");
    if (!toolBlock || toolBlock.type !== "tool_use") {
      throw new Error(`LLM did not call tool ${tool.name}`);
    }
    return toolBlock.input as T;
  }

  async tailorBullet(
    originalBullet: string,
    requirements: JobRequirements,
    context: { company: string; title: string }
  ): Promise<BulletTailoringResult> {
    const prompt = buildTailorBulletPrompt(originalBullet, requirements, context);
    const result = await this.callWithTool<BulletTailoringResult>(
      prompt,
      TAILOR_BULLET_TOOL
    );
    // Safety: if the model changed unchanged bullets, restore the original
    if (result.unchanged) {
      return { ...result, tailoredBullet: originalBullet };
    }
    return result;
  }

  async tailorSummary(
    requirements: JobRequirements,
    resume: ResumeMaster,
    profile: UserProfile
  ): Promise<string> {
    const prompt = buildTailorSummaryPrompt(requirements, resume, profile);
    const result = await this.callWithTool<{ summary: string }>(
      prompt,
      TAILOR_SUMMARY_TOOL,
      512
    );
    return result.summary;
  }

  async generateCoverLetter(
    requirements: JobRequirements,
    resume: ResumeMaster,
    profile: UserProfile
  ): Promise<string> {
    const prompt = buildCoverLetterPrompt(requirements, resume, profile);
    const result = await this.callWithTool<{ body: string }>(
      prompt,
      COVER_LETTER_TOOL,
      1024
    );
    return result.body;
  }
}
