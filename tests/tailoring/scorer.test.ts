import { describe, it, expect } from "vitest";
import { scoreBullet, rankBullets, scoreProject } from "../../packages/tailoring/src/scorer.js";
import { REQUIREMENTS_FRONTEND, REQUIREMENTS_PLATFORM } from "./fixtures.js";

describe("scoreBullet — keyword matching", () => {
  it("scores a bullet containing a must-have skill higher than an unrelated bullet", () => {
    const relevant = scoreBullet(
      "Built a React component library used by 50+ engineers",
      REQUIREMENTS_FRONTEND
    );
    const unrelated = scoreBullet("Organised team travel arrangements", REQUIREMENTS_FRONTEND);
    expect(relevant.score).toBeGreaterThan(unrelated.score);
    expect(relevant.matchedKeywords.map((k) => k.toLowerCase())).toContain("react");
  });

  it("scores a bullet with no relevant keywords low", () => {
    const result = scoreBullet(
      "Organised team lunches and managed office supplies",
      REQUIREMENTS_FRONTEND
    );
    expect(result.score).toBeLessThan(30);
    expect(result.matchedKeywords.length).toBe(0);
  });

  it("awards metric bonus for percentage", () => {
    const result = scoreBullet(
      "Reduced bundle size by 40% through code splitting",
      REQUIREMENTS_FRONTEND
    );
    expect(result.hasMetric).toBe(true);
  });

  it("awards metric bonus for dollar amount", () => {
    const result = scoreBullet(
      "Saved $200k annually by migrating to spot instances",
      REQUIREMENTS_PLATFORM
    );
    expect(result.hasMetric).toBe(true);
  });

  it("awards metric bonus for user count (direct digit+noun)", () => {
    // Regex matches \d+\s*(clients?) — no intervening words
    const result = scoreBullet(
      "Built real-time dashboard serving 500 clients across 12 countries",
      REQUIREMENTS_FRONTEND
    );
    expect(result.hasMetric).toBe(true);
  });

  it("awards action verb bonus", () => {
    const r1 = scoreBullet("Architected the payment pipeline using Node.js", REQUIREMENTS_FRONTEND);
    const r2 = scoreBullet("Was responsible for the payment pipeline", REQUIREMENTS_FRONTEND);
    expect(r1.hasActionVerb).toBe(true);
    expect(r2.hasActionVerb).toBe(false);
    expect(r1.score).toBeGreaterThan(r2.score);
  });

  it("does not exceed 100", () => {
    const result = scoreBullet(
      "Architected TypeScript React Redux state management system handling 50k requests reducing latency by 40%",
      REQUIREMENTS_FRONTEND
    );
    expect(result.score).toBeLessThanOrEqual(100);
  });

  it("scores a bullet with only an action verb (no keywords or metrics) at 15", () => {
    // "Managed" is a strong action verb → 15 pts, no keywords or metrics
    const result = scoreBullet("Managed office calendar and room bookings", REQUIREMENTS_PLATFORM);
    expect(result.score).toBe(15);
    expect(result.hasActionVerb).toBe(true);
    expect(result.hasMetric).toBe(false);
    expect(result.matchedKeywords.length).toBe(0);
  });
});

describe("rankBullets", () => {
  it("returns bullets sorted by score descending", () => {
    const bullets = [
      "Managed office supplies",
      "Architected Kubernetes platform handling 50k TPS using AWS EKS and Terraform",
      "Wrote unit tests for the API",
    ];
    const ranked = rankBullets(bullets, REQUIREMENTS_PLATFORM);
    expect(ranked[0]!.score).toBeGreaterThanOrEqual(ranked[1]!.score);
    expect(ranked[1]!.score).toBeGreaterThanOrEqual(ranked[2]!.score);
    expect(ranked[0]!.bullet).toContain("Kubernetes");
  });

  it("handles empty bullet array", () => {
    expect(rankBullets([], REQUIREMENTS_FRONTEND)).toEqual([]);
  });
});

describe("scoreProject", () => {
  it("scores a TypeScript+React project higher than an unrelated project", () => {
    const relevant = scoreProject(
      "Open-source TypeScript React component library for distributed tracing",
      ["TypeScript", "React", "Node.js"],
      REQUIREMENTS_FRONTEND
    );
    const irrelevant = scoreProject(
      "PHP WordPress blog theme",
      ["PHP", "WordPress"],
      REQUIREMENTS_FRONTEND
    );
    expect(relevant).toBeGreaterThan(irrelevant);
    expect(relevant).toBeGreaterThan(0);
  });

  it("returns 50 when no keywords in requirements", () => {
    const emptyReqs = {
      ...REQUIREMENTS_FRONTEND,
      atsKeywords: [],
      mustHaveSkills: [],
    };
    const score = scoreProject("Some project", ["Go"], emptyReqs);
    expect(score).toBe(50);
  });

  it("returns 0 for completely unrelated project", () => {
    const score = scoreProject(
      "Pet sitting booking app",
      ["PHP", "WordPress"],
      REQUIREMENTS_PLATFORM
    );
    expect(score).toBe(0);
  });
});
