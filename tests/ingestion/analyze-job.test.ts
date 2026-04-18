import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";
import { analyzeJobDescription, ExtractionValidationError } from "../../packages/ingestion/src/analyze-job.js";
import type { LlmAnalysisAdapter } from "../../packages/ingestion/src/llm-adapter.js";
import type { AnalysisInput, RawExtraction } from "../../packages/ingestion/src/types.js";

// ── Mock adapter ──────────────────────────────────────────────────────────────

class MockLlmAdapter implements LlmAnalysisAdapter {
  constructor(private readonly fixedResponse: object) {}

  async analyzeJobDescription(_input: AnalysisInput): Promise<RawExtraction> {
    return {
      toolInput: this.fixedResponse,
      modelUsed: "mock-model",
      usage: {
        inputTokens: 1000,
        outputTokens: 300,
        cacheReadTokens: 0,
        cacheWriteTokens: 0,
      },
    };
  }
}

class FailingLlmAdapter implements LlmAnalysisAdapter {
  async analyzeJobDescription(_input: AnalysisInput): Promise<RawExtraction> {
    return {
      toolInput: { roleTitle: 123, seniority: "wizard" }, // invalid data
      modelUsed: "mock-model",
      usage: { inputTokens: 0, outputTokens: 0, cacheReadTokens: 0, cacheWriteTokens: 0 },
    };
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function loadJd(name: string): string {
  return readFileSync(resolve(`tests/ingestion/fixtures/${name}`), "utf-8");
}

function loadResponse(name: string): object {
  return JSON.parse(
    readFileSync(resolve(`tests/ingestion/fixtures/responses/${name}`), "utf-8")
  );
}

// ── Error handling tests ──────────────────────────────────────────────────────

describe("analyzeJobDescription — error handling", () => {
  it("throws on empty job description", async () => {
    const adapter = new MockLlmAdapter(loadResponse("jd-1-response.json"));
    await expect(analyzeJobDescription("", { adapter })).rejects.toThrow("empty");
  });

  it("throws ExtractionValidationError when LLM returns invalid data", async () => {
    const adapter = new FailingLlmAdapter();
    const jd = loadJd("jd-1-senior-frontend.txt");
    await expect(analyzeJobDescription(jd, { adapter })).rejects.toBeInstanceOf(
      ExtractionValidationError
    );
  });

  it("ExtractionValidationError carries raw tool input", async () => {
    const adapter = new FailingLlmAdapter();
    try {
      await analyzeJobDescription("Some job description text for testing.", { adapter });
    } catch (err) {
      expect(err).toBeInstanceOf(ExtractionValidationError);
      const e = err as ExtractionValidationError;
      expect(e.rawToolInput).toBeDefined();
      expect(e.issues.length).toBeGreaterThan(0);
    }
  });
});

// ── JD 1: Senior Frontend Engineer ───────────────────────────────────────────

describe("analyzeJobDescription — JD 1: Senior Frontend Engineer", () => {
  const setup = async () => {
    const jd = loadJd("jd-1-senior-frontend.txt");
    const adapter = new MockLlmAdapter(loadResponse("jd-1-response.json"));
    return analyzeJobDescription(jd, { adapter, jobPostingId: "c3d4e5f6-a7b8-9012-cdef-123456789012" });
  };

  it("produces a valid JobRequirements object", async () => {
    const result = await setup();
    expect(result.requirements).toBeDefined();
    expect(result.requirements.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    );
  });

  it("extracts correct role title and seniority", async () => {
    const { requirements } = await setup();
    expect(requirements.roleTitle).toBe("Senior Frontend Engineer – Consumer Products");
    expect(requirements.seniority).toBe("senior");
  });

  it("extracts salary range", async () => {
    const { requirements } = await setup();
    expect(requirements.salary?.min).toBe(150000);
    expect(requirements.salary?.max).toBe(180000);
    expect(requirements.salary?.currency).toBe("AUD");
  });

  it("extracts must-have skills including TypeScript and React", async () => {
    const { requirements } = await setup();
    const names = requirements.mustHaveSkills.map((s) => s.name);
    expect(names).toContain("TypeScript");
    expect(names).toContain("React");
  });

  it("extracts hybrid work model", async () => {
    const { requirements } = await setup();
    expect(requirements.workModel).toBe("hybrid");
  });

  it("extracts work authorization signal", async () => {
    const { requirements } = await setup();
    expect(requirements.workAuthorizationSignals.length).toBeGreaterThan(0);
  });

  it("exposes preprocessed hints with correct salary", async () => {
    const result = await setup();
    expect(result.preprocessed.hints.salary?.min).toBe(150000);
    expect(result.preprocessed.hints.workMode).toBe("hybrid");
  });

  it("records the model in extractedByModel", async () => {
    const { requirements } = await setup();
    expect(requirements.extractedByModel).toBe("mock-model");
  });

  it("stores raw extraction verbatim", async () => {
    const { rawExtraction } = await setup();
    expect(rawExtraction.modelUsed).toBe("mock-model");
    expect(rawExtraction.toolInput).toMatchObject({ roleTitle: "Senior Frontend Engineer – Consumer Products" });
  });
});

// ── JD 2: Platform Engineer ───────────────────────────────────────────────────

describe("analyzeJobDescription — JD 2: Platform Engineer", () => {
  const setup = async () => {
    const adapter = new MockLlmAdapter(loadResponse("jd-2-response.json"));
    return analyzeJobDescription(loadJd("jd-2-platform-engineer.txt"), { adapter });
  };

  it("extracts senior seniority", async () => {
    const { requirements } = await setup();
    expect(requirements.seniority).toBe("senior");
  });

  it("extracts remote work model", async () => {
    const { requirements } = await setup();
    expect(requirements.workModel).toBe("remote");
  });

  it("has no salary (not stated)", async () => {
    const { requirements } = await setup();
    expect(requirements.salary).toBeUndefined();
  });

  it("includes Kubernetes and Terraform as must-have skills", async () => {
    const { requirements } = await setup();
    const names = requirements.mustHaveSkills.map((s) => s.name);
    expect(names).toContain("Kubernetes");
    expect(names).toContain("Terraform");
  });

  it("flags vague compensation as a red flag", async () => {
    const { requirements } = await setup();
    expect(requirements.redFlags.some((f) => f.type === "vague_compensation")).toBe(true);
  });

  it("includes ATS keywords with abbreviations (k8s)", async () => {
    const { requirements } = await setup();
    expect(requirements.atsKeywords).toContain("k8s");
  });
});

// ── JD 3: Junior .NET Developer ──────────────────────────────────────────────

describe("analyzeJobDescription — JD 3: Junior .NET Developer", () => {
  const setup = async () => {
    const adapter = new MockLlmAdapter(loadResponse("jd-3-response.json"));
    return analyzeJobDescription(loadJd("jd-3-junior-dotnet.txt"), { adapter });
  };

  it("extracts junior seniority", async () => {
    const { requirements } = await setup();
    expect(requirements.seniority).toBe("junior");
  });

  it("extracts onsite work model", async () => {
    const { requirements } = await setup();
    expect(requirements.workModel).toBe("onsite");
  });

  it("includes education requirement", async () => {
    const { requirements } = await setup();
    expect(requirements.educationRequirements.length).toBeGreaterThan(0);
  });

  it("extracts C# as must-have skill", async () => {
    const { requirements } = await setup();
    expect(requirements.mustHaveSkills.map((s) => s.name)).toContain("C#");
  });

  it("has no red flags", async () => {
    const { requirements } = await setup();
    expect(requirements.redFlags).toHaveLength(0);
  });
});

// ── JD 4: IT Support Analyst ──────────────────────────────────────────────────

describe("analyzeJobDescription — JD 4: IT Support Analyst", () => {
  const setup = async () => {
    const adapter = new MockLlmAdapter(loadResponse("jd-4-response.json"));
    return analyzeJobDescription(loadJd("jd-4-it-support.txt"), { adapter });
  };

  it("extracts IT Support domain", async () => {
    const { requirements } = await setup();
    expect(requirements.domain).toContain("IT Support");
  });

  it("includes Active Directory and Microsoft 365 as must-have", async () => {
    const { requirements } = await setup();
    const names = requirements.mustHaveSkills.map((s) => s.name);
    expect(names).toContain("Active Directory");
    expect(names).toContain("Microsoft 365");
  });

  it("extracts onsite work model", async () => {
    const { requirements } = await setup();
    expect(requirements.workModel).toBe("onsite");
  });

  it("includes ITIL in ATS keywords", async () => {
    const { requirements } = await setup();
    expect(requirements.atsKeywords).toContain("ITIL");
  });
});

// ── JD 5: Data Engineer ───────────────────────────────────────────────────────

describe("analyzeJobDescription — JD 5: Data Engineer", () => {
  const setup = async () => {
    const adapter = new MockLlmAdapter(loadResponse("jd-5-response.json"));
    return analyzeJobDescription(loadJd("jd-5-data-engineer.txt"), { adapter });
  };

  it("extracts mid seniority", async () => {
    const { requirements } = await setup();
    expect(requirements.seniority).toBe("mid");
  });

  it("extracts remote work model", async () => {
    const { requirements } = await setup();
    expect(requirements.workModel).toBe("remote");
  });

  it("includes Python, Apache Spark, dbt as must-have skills", async () => {
    const { requirements } = await setup();
    const names = requirements.mustHaveSkills.map((s) => s.name);
    expect(names).toContain("Python");
    expect(names).toContain("Apache Spark");
    expect(names).toContain("dbt");
  });

  it("extracts salary AUD 130,000–160,000", async () => {
    const { requirements } = await setup();
    expect(requirements.salary?.min).toBe(130000);
    expect(requirements.salary?.max).toBe(160000);
    expect(requirements.salary?.currency).toBe("AUD");
  });

  it("includes both full name and abbreviation in ATS keywords", async () => {
    const { requirements } = await setup();
    expect(requirements.atsKeywords).toContain("Apache Spark");
    expect(requirements.atsKeywords).toContain("Spark");
  });

  it("preprocessed correctly detects 3–6 years experience", async () => {
    const { preprocessed } = await setup();
    expect(preprocessed.hints.yearsOfExperience?.min).toBe(3);
    expect(preprocessed.hints.yearsOfExperience?.max).toBe(6);
  });
});
