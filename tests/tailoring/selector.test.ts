import { describe, it, expect } from "vitest";
import {
  selectSkills,
  selectExperience,
  selectProjects,
  selectBulletsForEntry,
} from "../../packages/tailoring/src/selector.js";
import {
  PROFILE,
  RESUME_MASTER,
  REQUIREMENTS_FRONTEND,
  REQUIREMENTS_PLATFORM,
} from "./fixtures.js";

describe("selectSkills", () => {
  it("lists TypeScript and React first for frontend role", () => {
    const skills = selectSkills(RESUME_MASTER, REQUIREMENTS_FRONTEND);
    const idx = (name: string) => skills.findIndex((s) => s.toLowerCase() === name.toLowerCase());
    expect(idx("TypeScript")).toBeLessThan(idx("Python"));
    expect(idx("React")).toBeLessThan(idx("Redis"));
  });

  it("does not include skills not in profile", () => {
    const skills = selectSkills(RESUME_MASTER, REQUIREMENTS_PLATFORM);
    expect(skills).not.toContain("Kubernetes");
    expect(skills).not.toContain("Go");
  });

  it("includes Terraform and AWS (in both profile and platform JD)", () => {
    const skills = selectSkills(RESUME_MASTER, REQUIREMENTS_PLATFORM);
    expect(skills).toContain("Terraform");
    expect(skills).toContain("AWS");
  });

  it("returns at most MAX_SKILLS (20) entries", () => {
    const skills = selectSkills(RESUME_MASTER, REQUIREMENTS_FRONTEND);
    expect(skills.length).toBeLessThanOrEqual(20);
  });

  it("returns no duplicates", () => {
    const skills = selectSkills(RESUME_MASTER, REQUIREMENTS_FRONTEND);
    const unique = new Set(skills.map((s) => s.toLowerCase()));
    expect(unique.size).toBe(skills.length);
  });
});

describe("selectBulletsForEntry", () => {
  it("selects at most 4 bullets per entry", () => {
    const entry = RESUME_MASTER.experience[0]!;
    const bullets = selectBulletsForEntry(entry, REQUIREMENTS_FRONTEND);
    expect(bullets.length).toBeLessThanOrEqual(4);
  });

  it("selects at least 2 bullets per entry", () => {
    const entry = RESUME_MASTER.experience[1]!;
    const bullets = selectBulletsForEntry(entry, REQUIREMENTS_FRONTEND);
    expect(bullets.length).toBeGreaterThanOrEqual(2);
  });

  it("prefers bullets containing TypeScript/React for frontend role", () => {
    const entry = RESUME_MASTER.experience[0]!;
    const bullets = selectBulletsForEntry(entry, REQUIREMENTS_FRONTEND);
    const joined = bullets.join(" ").toLowerCase();
    expect(joined).toMatch(/typescript|react/);
  });
});

describe("selectExperience", () => {
  it("returns all experience entries", () => {
    const selected = selectExperience(RESUME_MASTER, REQUIREMENTS_FRONTEND);
    expect(selected.length).toBe(RESUME_MASTER.experience.length);
  });

  it("sorts entries by average bullet score descending", () => {
    const selected = selectExperience(RESUME_MASTER, REQUIREMENTS_FRONTEND);
    for (let i = 0; i < selected.length - 1; i++) {
      expect(selected[i]!.avgScore).toBeGreaterThanOrEqual(selected[i + 1]!.avgScore);
    }
  });

  it("each entry has selectedBullets", () => {
    const selected = selectExperience(RESUME_MASTER, REQUIREMENTS_FRONTEND);
    for (const se of selected) {
      expect(se.selectedBullets.length).toBeGreaterThan(0);
    }
  });
});

describe("selectProjects", () => {
  it("selects the TypeScript project for frontend role", () => {
    const ids = selectProjects(RESUME_MASTER, REQUIREMENTS_FRONTEND);
    expect(ids).toContain("ab000001-0000-0000-0000-000000000001");
  });

  it("returns at most maxProjects entries", () => {
    const ids = selectProjects(RESUME_MASTER, REQUIREMENTS_FRONTEND, 1);
    expect(ids.length).toBeLessThanOrEqual(1);
  });

  it("returns empty array when no projects match", () => {
    const reqBio = {
      ...REQUIREMENTS_FRONTEND,
      atsKeywords: ["CRISPR", "gene sequencing", "bioinformatics"],
      mustHaveSkills: [],
    };
    const ids = selectProjects(RESUME_MASTER, reqBio);
    expect(ids).toHaveLength(0);
  });
});
