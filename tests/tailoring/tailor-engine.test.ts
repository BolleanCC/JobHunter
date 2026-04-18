import { describe, it, expect, vi } from "vitest";
import { tailorResume } from "../../packages/tailoring/src/tailor-engine.js";
import type { LlmTailoringAdapter } from "../../packages/tailoring/src/llm-tailor-adapter.js";
import {
  PROFILE,
  RESUME_MASTER,
  REQUIREMENTS_FRONTEND,
} from "./fixtures.js";

// ── Mock adapter ──────────────────────────────────────────────────────────────

function makeMockAdapter(overrides?: Partial<LlmTailoringAdapter>): LlmTailoringAdapter {
  return {
    tailorBullet: vi.fn(async (original) => ({
      tailoredBullet: `Rewritten: ${original}`,
      unchanged: false,
      keywordsInjected: ["TypeScript"],
    })),
    tailorSummary: vi.fn(async () =>
      "Senior full-stack engineer with 8+ years expertise in TypeScript and React, building scalable systems at Canva-scale."
    ),
    generateCoverLetter: vi.fn(async () =>
      "I am writing to express my interest in the Senior Frontend Engineer role..."
    ),
    ...overrides,
  };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("tailorResume — output structure", () => {
  it("produces a valid TailoredResume with all required fields", async () => {
    const adapter = makeMockAdapter();
    const { tailoredResume } = await tailorResume(
      RESUME_MASTER,
      PROFILE,
      REQUIREMENTS_FRONTEND,
      adapter
    );

    expect(tailoredResume.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    );
    expect(tailoredResume.resumeMasterId).toBe(RESUME_MASTER.id);
    expect(tailoredResume.userProfileId).toBe(PROFILE.id);
    expect(tailoredResume.humanApproved).toBe(false);
  });

  it("includes a fit score", async () => {
    const { tailoredResume } = await tailorResume(
      RESUME_MASTER, PROFILE, REQUIREMENTS_FRONTEND, makeMockAdapter()
    );
    expect(tailoredResume.fitScore).toBeDefined();
    expect(tailoredResume.fitScore!.overall).toBeGreaterThanOrEqual(0);
    expect(tailoredResume.fitScore!.overall).toBeLessThanOrEqual(100);
  });

  it("includes a tailored summary from the adapter", async () => {
    const { tailoredResume } = await tailorResume(
      RESUME_MASTER, PROFILE, REQUIREMENTS_FRONTEND, makeMockAdapter()
    );
    expect(tailoredResume.tailoredSummary?.text).toContain("TypeScript");
  });

  it("includes tailored experience entries", async () => {
    const { tailoredResume } = await tailorResume(
      RESUME_MASTER, PROFILE, REQUIREMENTS_FRONTEND, makeMockAdapter()
    );
    expect(tailoredResume.tailoredExperience.length).toBe(
      RESUME_MASTER.experience.length
    );
  });

  it("includes selected skills", async () => {
    const { tailoredResume } = await tailorResume(
      RESUME_MASTER, PROFILE, REQUIREMENTS_FRONTEND, makeMockAdapter()
    );
    expect(tailoredResume.selectedSkills).toContain("TypeScript");
    expect(tailoredResume.selectedSkills).toContain("React");
  });

  it("includes ATS analysis", async () => {
    const { tailoredResume } = await tailorResume(
      RESUME_MASTER, PROFILE, REQUIREMENTS_FRONTEND, makeMockAdapter()
    );
    expect(tailoredResume.atsAnalysis).toBeDefined();
    expect(tailoredResume.atsAnalysis!.score).toBeGreaterThanOrEqual(0);
    expect(tailoredResume.atsAnalysis!.keywordsMatched.length).toBeGreaterThan(0);
  });

  it("produces valid JSON artifact", async () => {
    const { artifacts } = await tailorResume(
      RESUME_MASTER, PROFILE, REQUIREMENTS_FRONTEND, makeMockAdapter()
    );
    expect(() => JSON.parse(artifacts.json)).not.toThrow();
    const parsed = JSON.parse(artifacts.json);
    expect(parsed.resumeMasterId).toBe(RESUME_MASTER.id);
  });
});

describe("tailorResume — rewrite threshold", () => {
  it("calls tailorBullet for low-scoring bullets", async () => {
    const adapter = makeMockAdapter();
    await tailorResume(RESUME_MASTER, PROFILE, REQUIREMENTS_FRONTEND, adapter, {
      rewriteThreshold: 100, // rewrite everything
    });
    expect(adapter.tailorBullet).toHaveBeenCalled();
  });

  it("skips tailorBullet when threshold is 0", async () => {
    const adapter = makeMockAdapter();
    await tailorResume(RESUME_MASTER, PROFILE, REQUIREMENTS_FRONTEND, adapter, {
      rewriteThreshold: 0, // never rewrite
    });
    expect(adapter.tailorBullet).not.toHaveBeenCalled();
  });

  it("respects maxBulletsRewritten per entry", async () => {
    const adapter = makeMockAdapter();
    await tailorResume(RESUME_MASTER, PROFILE, REQUIREMENTS_FRONTEND, adapter, {
      rewriteThreshold: 100,
      maxBulletsRewritten: 1,
    });
    // With maxBulletsRewritten=1 and 2 experience entries, at most 2 rewrites total
    const callCount = (adapter.tailorBullet as ReturnType<typeof vi.fn>).mock.calls.length;
    expect(callCount).toBeLessThanOrEqual(RESUME_MASTER.experience.length);
  });
});

describe("tailorResume — cover letter", () => {
  it("does not generate cover letter by default", async () => {
    const adapter = makeMockAdapter();
    const { tailoredResume } = await tailorResume(
      RESUME_MASTER, PROFILE, REQUIREMENTS_FRONTEND, adapter
    );
    expect(tailoredResume.coverLetter).toBeUndefined();
    expect(adapter.generateCoverLetter).not.toHaveBeenCalled();
  });

  it("generates cover letter when requested", async () => {
    const adapter = makeMockAdapter();
    const { tailoredResume } = await tailorResume(
      RESUME_MASTER, PROFILE, REQUIREMENTS_FRONTEND, adapter,
      { generateCoverLetter: true }
    );
    expect(tailoredResume.coverLetter).toBeDefined();
    expect(tailoredResume.coverLetter!.body.length).toBeGreaterThan(10);
    expect(adapter.generateCoverLetter).toHaveBeenCalledOnce();
  });
});

describe("tailorResume — unchanged bullets", () => {
  it("preserves original bullet when adapter returns unchanged=true", async () => {
    const original = RESUME_MASTER.experience[0]!.bullets[0]!;
    const adapter = makeMockAdapter({
      tailorBullet: vi.fn(async (b) => ({
        tailoredBullet: b,
        unchanged: true,
        keywordsInjected: [],
      })),
    });

    const { tailoredResume } = await tailorResume(
      RESUME_MASTER, PROFILE, REQUIREMENTS_FRONTEND, adapter,
      { rewriteThreshold: 100 }
    );

    const allBullets = tailoredResume.tailoredExperience.flatMap((e) =>
      e.tailoredBullets
    );
    expect(allBullets.some((b) => b.tailoredBullet === original)).toBe(true);
  });
});
