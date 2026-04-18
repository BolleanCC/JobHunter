import type {
  TailoredResume,
  ResumeMaster,
  UserProfile,
  WorkExperienceEntry,
  ProjectEntry,
} from "@jobhunter/schema";
import { wrapHtmlPage, escHtml } from "./template.js";

// ── Date helpers ──────────────────────────────────────────────────────────────

function fmtDate(ym: string): string {
  const [year, month] = ym.split("-");
  return new Date(Number(year), Number(month) - 1).toLocaleString("en-AU", {
    month: "short",
    year: "numeric",
  });
}

function fmtRange(start: string, end?: string, isCurrent = false): string {
  return `${fmtDate(start)} – ${isCurrent ? "Present" : end ? fmtDate(end) : "Present"}`;
}

// ── Skill grouping ────────────────────────────────────────────────────────────

const LANGUAGE_SET = new Set([
  "TypeScript","JavaScript","Python","Go","Rust","Java","C#","C++",
  "Ruby","Swift","Kotlin","PHP","Scala","SQL","Bash","R","HTML","CSS",
]);

const FRAMEWORK_SET = new Set([
  "React","Next.js","Vue","Angular","Node.js","Express","FastAPI",
  "Django","Spring","ASP.NET Core",".NET","Rails","Svelte","Redux",
  "Redux Toolkit","GraphQL","REST","gRPC",
]);

function groupSkillsHtml(skills: string[]): Array<[string, string[]]> {
  const languages: string[] = [];
  const frameworks: string[] = [];
  const other: string[] = [];

  for (const s of skills) {
    if (LANGUAGE_SET.has(s)) languages.push(s);
    else if (FRAMEWORK_SET.has(s)) frameworks.push(s);
    else other.push(s);
  }

  const groups: Array<[string, string[]]> = [];
  if (languages.length) groups.push(["Languages", languages]);
  if (frameworks.length) groups.push(["Frameworks & Libraries", frameworks]);
  if (other.length) groups.push(["Tools & Platforms", other]);
  return groups;
}

// ── Section renderers ─────────────────────────────────────────────────────────

function renderHeader(profile: UserProfile): string {
  const links: string[] = [];
  if (profile.socialLinks?.linkedin)
    links.push(`<a href="${escHtml(profile.socialLinks.linkedin)}">LinkedIn</a>`);
  if (profile.socialLinks?.github)
    links.push(`<a href="${escHtml(profile.socialLinks.github)}">GitHub</a>`);
  if (profile.socialLinks?.portfolio)
    links.push(`<a href="${escHtml(profile.socialLinks.portfolio)}">Portfolio</a>`);

  const contactItems = [
    profile.location ? escHtml(profile.location) : null,
    `<a href="mailto:${escHtml(profile.email)}">${escHtml(profile.email)}</a>`,
    profile.phone ? escHtml(profile.phone) : null,
    ...links,
  ]
    .filter(Boolean)
    .join('<span class="contact-sep"> | </span>');

  const headlineStr = profile.headline
    ? `<div class="header-title">${escHtml(profile.headline)}</div>`
    : "";

  return `<header class="header">
  <div class="header-name">${escHtml(profile.displayName)}</div>
  ${headlineStr}
  <div class="contact-line">${contactItems}</div>
</header>`;
}

function renderSummary(text: string): string {
  return `<section aria-label="Summary">
  <h2>Summary</h2>
  <p class="summary">${escHtml(text)}</p>
</section>`;
}

function renderExperience(
  tailoredResume: TailoredResume,
  resumeMaster: ResumeMaster
): string {
  const entryMap = new Map<string, WorkExperienceEntry>(
    resumeMaster.experience.map((e) => [e.id, e])
  );

  const parts: string[] = [`<section aria-label="Experience"><h2>Experience</h2>`];

  for (const te of tailoredResume.tailoredExperience) {
    if (!te.included) continue;
    const entry = entryMap.get(te.sourceEntryId);
    if (!entry) continue;

    const dateRange = fmtRange(entry.startDate, entry.endDate, entry.isCurrent);
    const meta = [entry.location, entry.workMode]
      .filter(Boolean)
      .join(" · ");

    const bullets = te.tailoredBullets
      .map((tb) => `<li>${escHtml(tb.tailoredBullet)}</li>`)
      .join("\n      ");

    parts.push(`  <div class="exp-entry">
    <div class="exp-header">
      <span class="exp-company">${escHtml(entry.company)}</span>
      <span class="exp-dates">${escHtml(dateRange)}</span>
    </div>
    <div class="exp-title">${escHtml(entry.title)}</div>
    ${meta ? `<div class="exp-meta">${escHtml(meta)}</div>` : ""}
    <ul class="exp-bullets">
      ${bullets}
    </ul>
  </div>`);
  }

  parts.push("</section>");
  return parts.join("\n");
}

function renderSkills(skills: string[]): string {
  const groups = groupSkillsHtml(skills);
  if (groups.length === 0) return "";

  const rows = groups
    .map(
      ([cat, items]) =>
        `  <div class="skill-cat">${escHtml(cat)}</div><div class="skill-vals">${items.map(escHtml).join(", ")}</div>`
    )
    .join("\n");

  return `<section aria-label="Skills">
  <h2>Skills</h2>
  <div class="skills-table">
${rows}
  </div>
</section>`;
}

function renderEducation(resumeMaster: ResumeMaster): string {
  if (resumeMaster.education.length === 0) return "";

  const entries = resumeMaster.education
    .map((edu) => {
      const degree = edu.field
        ? `${edu.degree}, ${edu.field}`
        : edu.degree;
      const dateRange =
        edu.startDate && edu.endDate
          ? `${fmtDate(edu.startDate)} – ${fmtDate(edu.endDate)}`
          : edu.endDate
          ? fmtDate(edu.endDate)
          : "";
      const honors = edu.honors
        ? `<div class="edu-detail">${escHtml(edu.honors)}</div>`
        : "";
      const gpa = edu.gpa
        ? `<div class="edu-detail">GPA: ${edu.gpa}</div>`
        : "";

      return `  <div class="edu-entry">
    <div class="edu-header">
      <span class="edu-degree">${escHtml(degree)}</span>
      ${dateRange ? `<span class="edu-dates">${escHtml(dateRange)}</span>` : ""}
    </div>
    <div class="edu-institution">${escHtml(edu.institution)}</div>
    ${honors}${gpa}
  </div>`;
    })
    .join("\n");

  return `<section aria-label="Education">
  <h2>Education</h2>
${entries}
</section>`;
}

function renderCertifications(resumeMaster: ResumeMaster): string {
  if (resumeMaster.certifications.length === 0) return "";

  const rows = resumeMaster.certifications
    .map((cert) => {
      const issued = cert.issuedAt ? fmtDate(cert.issuedAt) : "";
      const expires = cert.expiresAt
        ? ` <span style="color:#6b7280">(exp. ${fmtDate(cert.expiresAt)})</span>`
        : "";
      return `  <div class="cert-name">${escHtml(cert.name)}</div>
  <div class="cert-date">${escHtml(issued)}${expires}</div>
  <div class="cert-issuer">${escHtml(cert.issuer)}</div>
  <div></div>`;
    })
    .join("\n");

  return `<section aria-label="Certifications">
  <h2>Certifications</h2>
  <div class="cert-grid">
${rows}
  </div>
</section>`;
}

function renderProjects(
  tailoredResume: TailoredResume,
  resumeMaster: ResumeMaster
): string {
  const selectedIds = new Set(tailoredResume.selectedProjects);
  const projects = resumeMaster.projects.filter((p: ProjectEntry) =>
    selectedIds.has(p.id)
  );
  if (projects.length === 0) return "";

  const entries = projects
    .map((proj: ProjectEntry) => {
      const link = proj.url ?? proj.repoUrl;
      const linkHtml = link
        ? `<a class="project-link" href="${escHtml(link)}">${escHtml(link)}</a>`
        : "";
      const highlights =
        proj.highlights.length > 0
          ? `<ul class="exp-bullets">${proj.highlights.map((h) => `<li>${escHtml(h)}</li>`).join("")}</ul>`
          : "";

      return `  <div class="project-entry">
    <div class="project-header">
      <span class="project-name">${escHtml(proj.name)}</span>
      ${linkHtml}
    </div>
    ${proj.technologies.length > 0 ? `<div class="project-tech">${proj.technologies.map(escHtml).join(", ")}</div>` : ""}
    <div class="project-desc">${escHtml(proj.description)}</div>
    ${highlights}
  </div>`;
    })
    .join("\n");

  return `<section aria-label="Projects">
  <h2>Projects</h2>
${entries}
</section>`;
}

// ── Main export ───────────────────────────────────────────────────────────────

export function renderHtml(
  tailoredResume: TailoredResume,
  resumeMaster: ResumeMaster,
  userProfile: UserProfile
): string {
  const sections: string[] = [renderHeader(userProfile)];

  if (tailoredResume.tailoredSummary?.text) {
    sections.push(renderSummary(tailoredResume.tailoredSummary.text));
  }

  if (tailoredResume.tailoredExperience.length > 0) {
    sections.push(renderExperience(tailoredResume, resumeMaster));
  }

  if (tailoredResume.selectedSkills.length > 0) {
    sections.push(renderSkills(tailoredResume.selectedSkills));
  }

  sections.push(renderEducation(resumeMaster));
  sections.push(renderCertifications(resumeMaster));
  sections.push(renderProjects(tailoredResume, resumeMaster));

  const body = sections.filter(Boolean).join("\n\n");
  return wrapHtmlPage(`${userProfile.displayName} – Resume`, body);
}
