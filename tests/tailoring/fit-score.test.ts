import { describe, it, expect } from "vitest";
import { computeFitScore } from "../../packages/tailoring/src/fit-score.js";
import {
  PROFILE,
  RESUME_MASTER,
  REQUIREMENTS_FRONTEND,
  REQUIREMENTS_PLATFORM,
} from "./fixtures.js";

describe("computeFitScore — skills match", () => {
  it("returns high skillsMatch when profile has required skills", () => {
    const fit = computeFitScore(REQUIREMENTS_FRONTEND, RESUME_MASTER, PROFILE);
    // TypeScript and React are in profile — 2 of 3 must-have skills
    expect(fit.skillsMatch).toBeGreaterThan(60);
  });

  it("lists TypeScript and React as strengths", () => {
    const fit = computeFitScore(REQUIREMENTS_FRONTEND, RESUME_MASTER, PROFILE);
    expect(fit.strengths).toContain("TypeScript");
    expect(fit.strengths).toContain("React");
  });

  it("lists missing skills as gaps", () => {
    // Redux is in REQUIREMENTS_FRONTEND mustHaveSkills but profile has no "Redux"
    const fit = computeFitScore(REQUIREMENTS_FRONTEND, RESUME_MASTER, PROFILE);
    expect(fit.skillGaps).toContain("Redux");
  });

  it("returns lower skillsMatch for platform role (missing Kubernetes/Go)", () => {
    const fit = computeFitScore(REQUIREMENTS_PLATFORM, RESUME_MASTER, PROFILE);
    // Terraform and AWS are in profile, but not Kubernetes or Go
    expect(fit.skillGaps).toContain("Kubernetes");
    expect(fit.skillGaps).toContain("Go");
  });
});

describe("computeFitScore — location match", () => {
  it("returns 100 for remote role", () => {
    const fit = computeFitScore(REQUIREMENTS_PLATFORM, RESUME_MASTER, PROFILE);
    // REQUIREMENTS_PLATFORM workModel is "remote"
    expect(fit.locationMatch).toBe(100);
  });

  it("returns 100 when job location is in user's target locations", () => {
    const fit = computeFitScore(REQUIREMENTS_FRONTEND, RESUME_MASTER, PROFILE);
    // REQUIREMENTS_FRONTEND location is "Sydney, NSW" and profile targets Sydney
    expect(fit.locationMatch).toBe(100);
  });
});

describe("computeFitScore — salary match", () => {
  it("returns 100 when job salary range overlaps user expectation", () => {
    const fit = computeFitScore(REQUIREMENTS_FRONTEND, RESUME_MASTER, PROFILE);
    // Job: 150k–180k, user: 140k–180k → overlap
    expect(fit.salaryMatch).toBe(100);
  });

  it("returns 50 when salary unknown", () => {
    const reqNoSalary = { ...REQUIREMENTS_PLATFORM, salary: undefined };
    const fit = computeFitScore(reqNoSalary, RESUME_MASTER, PROFILE);
    expect(fit.salaryMatch).toBe(50);
  });
});

describe("computeFitScore — overall", () => {
  it("overall is within 0–100", () => {
    const fit1 = computeFitScore(REQUIREMENTS_FRONTEND, RESUME_MASTER, PROFILE);
    const fit2 = computeFitScore(REQUIREMENTS_PLATFORM, RESUME_MASTER, PROFILE);
    for (const fit of [fit1, fit2]) {
      expect(fit.overall).toBeGreaterThanOrEqual(0);
      expect(fit.overall).toBeLessThanOrEqual(100);
    }
  });

  it("contains reasoning string", () => {
    const fit = computeFitScore(REQUIREMENTS_FRONTEND, RESUME_MASTER, PROFILE);
    expect(fit.reasoning.length).toBeGreaterThan(20);
    expect(fit.reasoning).toContain("Skills");
  });

  it("records scoredByModel as deterministic-v1", () => {
    const fit = computeFitScore(REQUIREMENTS_FRONTEND, RESUME_MASTER, PROFILE);
    expect(fit.scoredByModel).toBe("deterministic-v1");
  });

  it("frontend role scores higher than platform role for this profile", () => {
    const fitFe = computeFitScore(REQUIREMENTS_FRONTEND, RESUME_MASTER, PROFILE);
    const fitPl = computeFitScore(REQUIREMENTS_PLATFORM, RESUME_MASTER, PROFILE);
    // Profile has TypeScript + React (FE match) but not Kubernetes + Go (Platform match)
    expect(fitFe.skillsMatch).toBeGreaterThan(fitPl.skillsMatch);
  });
});
