import type { AnalysisInput, RawExtraction } from "./types.js";
import {
  SYSTEM_PROMPT,
  EXTRACT_REQUIREMENTS_TOOL,
  buildUserPrompt,
} from "./prompts/extract-requirements.js";

// ── Interface ─────────────────────────────────────────────────────────────────

export interface LlmAnalysisAdapter {
  analyzeJobDescription(input: AnalysisInput): Promise<RawExtraction>;
}

// ── Claude implementation ─────────────────────────────────────────────────────

export type ClaudeAdapterOptions = {
  model?: string;
  maxTokens?: number;
  apiKey?: string;
};

export class ClaudeAdapter implements LlmAnalysisAdapter {
  private readonly model: string;
  private readonly maxTokens: number;
  private readonly apiKey: string;

  constructor(opts: ClaudeAdapterOptions = {}) {
    this.model = opts.model ?? "claude-sonnet-4-6";
    this.maxTokens = opts.maxTokens ?? 2048;
    const key = opts.apiKey ?? process.env["ANTHROPIC_API_KEY"];
    if (!key) throw new Error("ANTHROPIC_API_KEY is not set");
    this.apiKey = key;
  }

  async analyzeJobDescription(input: AnalysisInput): Promise<RawExtraction> {
    const { default: Anthropic } = await import("@anthropic-ai/sdk");
    const client = new Anthropic({ apiKey: this.apiKey });

    const userPrompt = buildUserPrompt(input.cleanedText, input.hints);

    const response = await client.messages.create({
      model: this.model,
      max_tokens: this.maxTokens,
      system: [
        {
          type: "text",
          text: SYSTEM_PROMPT,
          // @ts-expect-error — cache_control is in the API but may not be in older SDK types
          cache_control: { type: "ephemeral" },
        },
      ],
      tools: [EXTRACT_REQUIREMENTS_TOOL],
      tool_choice: { type: "tool", name: "extract_job_requirements" },
      messages: [{ role: "user", content: userPrompt }],
    });

    const toolUseBlock = response.content.find((b) => b.type === "tool_use");
    if (!toolUseBlock || toolUseBlock.type !== "tool_use") {
      throw new Error(
        `LLM did not call the extract_job_requirements tool. Stop reason: ${response.stop_reason}`
      );
    }

    const usage = response.usage;

    return {
      toolInput: toolUseBlock.input,
      modelUsed: this.model,
      usage: {
        inputTokens: usage.input_tokens,
        outputTokens: usage.output_tokens,
        // @ts-expect-error — cache fields exist at runtime but typing depends on SDK version
        cacheReadTokens: usage.cache_read_input_tokens ?? 0,
        // @ts-expect-error
        cacheWriteTokens: usage.cache_creation_input_tokens ?? 0,
      },
    };
  }
}
