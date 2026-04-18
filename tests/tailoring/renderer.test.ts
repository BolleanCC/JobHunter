import { describe, it, expect } from "vitest";
import { renderMarkdown } from "../../packages/tailoring/src/renderers/markdown.js";
import { renderHtml } from "../../packages/tailoring/src/renderers/html.js";
import { TailoredResumeSchema } from "../../packages/schema/src/tailored-resume.js";
import {
  PROFILE,
  RESUME_MASTER,
  REQUIREMENTS_FRONTEND,
} from "./fixtures.js";
import { computeFitScore } from "../../packages/tailoring/src/fit-score.js";
import { selectContent } from "../../packages/tailoring/src/selector.js";

// ── Build a deterministic TailoredResume for snapshot testing ─────────────────

function buildFixtureTailoredResume() {
  const { experience: selectedExp, skills, projectIds } = selectContent(
    RESUME_MASTER,
    PROFILE,
    REQUIREMENTS_FRONTEND
  );

  const tailoredExperience = selectedExp.map((se) => ({
    sourceEntryId: se.entry.id,
    included: true,
    tailoredBullets: se.selectedBullets.map((b) => ({
      originalEntryId: se.entry.id,
      originalBullet: b,
      tailoredBullet: b, // unchanged — no LLM in renderer tests
      humanEdited: false,
      keywordsInjected: [] as string[],
    })),
  }));

  return TailoredResumeSchema.parse({
    id: "f0000001-0000-0000-0000-000000000001",
    jobPostingId: "c3d4e5f6-a7b8-9012-cdef-123456789012",
    jobRequirementsId: REQUIREMENTS_FRONTEND.id,
    resumeMasterId: RESUME_MASTER.id,
    userProfileId: PROFILE.id,
    createdAt: new Date("2024-11-05T09:00:00.000Z"),
    fitScore: computeFitScore(REQUIREMENTS_FRONTEND, RESUME_MASTER, PROFILE),
    tailoredSummary: {
      text: "Senior full-stack engineer with 8+ years expertise in TypeScript, React, and AWS. Built payment systems at scale and led platform migrations for fintech clients.",
      generatedByModel: "test",
      humanEdited: false,
    },
    tailoredExperience,
    selectedSkills: skills,
    selectedProjects: projectIds,
    humanApproved: false,
    updatedAt: new Date("2024-11-05T09:00:00.000Z"),
  });
}

// ── Markdown tests ────────────────────────────────────────────────────────────

describe("renderMarkdown", () => {
  it("includes the user's display name as h1", () => {
    const tr = buildFixtureTailoredResume();
    const md = renderMarkdown(tr, RESUME_MASTER, PROFILE);
    expect(md).toMatch(/^# Alex Smith/m);
  });

  it("includes experience section", () => {
    const tr = buildFixtureTailoredResume();
    const md = renderMarkdown(tr, RESUME_MASTER, PROFILE);
    expect(md).toContain("## Experience");
    expect(md).toContain("Acme Fintech Pty Ltd");
  });

  it("includes skills section", () => {
    const tr = buildFixtureTailoredResume();
    const md = renderMarkdown(tr, RESUME_MASTER, PROFILE);
    expect(md).toContain("## Skills");
    expect(md).toContain("TypeScript");
  });

  it("includes education section", () => {
    const tr = buildFixtureTailoredResume();
    const md = renderMarkdown(tr, RESUME_MASTER, PROFILE);
    expect(md).toContain("## Education");
    expect(md).toContain("University of New South Wales");
  });

  it("includes certification", () => {
    const tr = buildFixtureTailoredResume();
    const md = renderMarkdown(tr, RESUME_MASTER, PROFILE);
    expect(md).toContain("AWS Certified Solutions Architect");
  });

  it("includes tailored summary", () => {
    const tr = buildFixtureTailoredResume();
    const md = renderMarkdown(tr, RESUME_MASTER, PROFILE);
    expect(md).toContain("## Summary");
    expect(md).toContain("TypeScript");
  });

  it("includes selected project", () => {
    const tr = buildFixtureTailoredResume();
    const md = renderMarkdown(tr, RESUME_MASTER, PROFILE);
    expect(md).toContain("OpenTraceQL");
  });

  it("matches markdown snapshot", () => {
    const tr = buildFixtureTailoredResume();
    const md = renderMarkdown(tr, RESUME_MASTER, PROFILE);
    expect(md).toMatchSnapshot();
  });
});

// ── HTML tests ────────────────────────────────────────────────────────────────

describe("renderHtml", () => {
  it("produces a complete HTML document", () => {
    const tr = buildFixtureTailoredResume();
    const html = renderHtml(tr, RESUME_MASTER, PROFILE);
    expect(html).toMatch(/^<!DOCTYPE html>/);
    expect(html).toContain("</html>");
  });

  it("contains the user's name", () => {
    const tr = buildFixtureTailoredResume();
    const html = renderHtml(tr, RESUME_MASTER, PROFILE);
    expect(html).toContain("Alex Smith");
  });

  it("contains all experience companies", () => {
    const tr = buildFixtureTailoredResume();
    const html = renderHtml(tr, RESUME_MASTER, PROFILE);
    expect(html).toContain("Acme Fintech Pty Ltd");
    expect(html).toContain("StartupXYZ");
  });

  it("contains inline CSS (no external stylesheets)", () => {
    const tr = buildFixtureTailoredResume();
    const html = renderHtml(tr, RESUME_MASTER, PROFILE);
    expect(html).toContain("<style>");
    expect(html).not.toContain('<link rel="stylesheet"');
  });

  it("HTML-escapes special characters in company names", () => {
    const tr = buildFixtureTailoredResume();
    const specialResume = {
      ...RESUME_MASTER,
      experience: [
        {
          ...RESUME_MASTER.experience[0]!,
          company: "Acme & Co <Partners>",
        },
        ...RESUME_MASTER.experience.slice(1),
      ],
    };
    const html = renderHtml(tr, specialResume, PROFILE);
    expect(html).toContain("Acme &amp; Co &lt;Partners&gt;");
    expect(html).not.toContain("Acme & Co <Partners>");
  });

  it("contains skills from selectedSkills", () => {
    const tr = buildFixtureTailoredResume();
    const html = renderHtml(tr, RESUME_MASTER, PROFILE);
    expect(html).toContain("TypeScript");
    expect(html).toContain("React");
  });

  it("includes aria-labels for accessibility", () => {
    const tr = buildFixtureTailoredResume();
    const html = renderHtml(tr, RESUME_MASTER, PROFILE);
    expect(html).toContain('aria-label="Experience"');
    expect(html).toContain('aria-label="Skills"');
    expect(html).toContain('aria-label="Education"');
  });

  it("matches HTML snapshot", () => {
    const tr = buildFixtureTailoredResume();
    const html = renderHtml(tr, RESUME_MASTER, PROFILE);
    expect(html).toMatchSnapshot();
  });
});
