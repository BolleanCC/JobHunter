import { describe, it, expect } from "vitest";
import { ApplicationQuestionSchema } from "../../packages/schema/src/application-question.js";

const baseQuestion = {
  id: "a1000001-0000-0000-0000-000000000001",
  applicationDraftId: "f6a7b8c9-d0e1-2345-f0a1-456789012345",
  ordinal: 0,
  prompt: "Why do you want to work at Canva?",
  isRequired: true,
  isSensitive: false,
  category: "motivation" as const,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe("ApplicationQuestionSchema", () => {
  it("accepts a text question without answer", () => {
    const r = ApplicationQuestionSchema.safeParse({
      ...baseQuestion,
      config: { type: "text", maxLength: 500 },
    });
    expect(r.success).toBe(true);
  });

  it("accepts a select question with options", () => {
    const r = ApplicationQuestionSchema.safeParse({
      ...baseQuestion,
      config: { type: "select", options: ["Yes", "No", "Maybe"] },
    });
    expect(r.success).toBe(true);
  });

  it("rejects select question with empty options", () => {
    const r = ApplicationQuestionSchema.safeParse({
      ...baseQuestion,
      config: { type: "select", options: [] },
    });
    expect(r.success).toBe(false);
  });

  it("accepts yes_no question", () => {
    const r = ApplicationQuestionSchema.safeParse({
      ...baseQuestion,
      config: { type: "yes_no" },
    });
    expect(r.success).toBe(true);
  });

  it("accepts question with a string answer", () => {
    const r = ApplicationQuestionSchema.safeParse({
      ...baseQuestion,
      config: { type: "textarea" },
      answer: {
        value: "I love design tools and the creative space.",
        humanEdited: true,
        humanApproved: true,
        answeredAt: new Date(),
      },
    });
    expect(r.success).toBe(true);
  });

  it("accepts question with a boolean answer (yes_no)", () => {
    const r = ApplicationQuestionSchema.safeParse({
      ...baseQuestion,
      config: { type: "yes_no" },
      answer: { value: true, humanApproved: true },
    });
    expect(r.success).toBe(true);
  });

  it("rejects unknown question type via discriminated union", () => {
    const r = ApplicationQuestionSchema.safeParse({
      ...baseQuestion,
      config: { type: "slider" },
    });
    expect(r.success).toBe(false);
  });
});
