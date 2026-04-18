import type {
  TailoredResume,
  ResumeMaster,
  UserProfile,
  WorkExperienceEntry,
  ProjectEntry,
} from "@jobhunter/schema";

function formatDate(ym: string): string {
  const [year, month] = ym.split("-");
  const monthName = new Date(Number(year), Number(month) - 1).toLocaleString(
    "en-AU",
    { month: "short" }
  );
  return `${monthName} ${year}`;
}

function formatDateRange(startDate: string, endDate?: string, isCurrent = false): string {
  const start = formatDate(startDate);
  const end = isCurrent ? "Present" : endDate ? formatDate(endDate) : "Present";
  return `${start} – ${end}`;
}

function groupSkills(skills: string[]): Record<string, string[]> {
  // Group by inferred category based on well-known names
  const LANGUAGES = new Set([
    "TypeScript","JavaScript","Python","Go","Rust","Java","C#","C++",
    "Ruby","Swift","Kotlin","PHP","Scala","SQL","Bash","R",
  ]);
  const FRAMEWORKS = new Set([
    "React","Next.js","Vue","Angular","Node.js","Express","FastAPI",
    "Django","Spring","ASP.NET Core",".NET","Rails","Svelte",
  ]);
  const TOOLS = new Set([
    "Git","Docker","Kubernetes","Terraform","AWS","GCP","Azure",
    "Kafka","Redis","PostgreSQL","MongoDB","MySQL","Elasticsearch",
    "GitHub Actions","Jenkins","Buildkite","Datadog","Grafana","Prometheus",
    "dbt","Airflow","Spark","Snowflake","BigQuery","Tableau",
  ]);

  const groups: Record<string, string[]> = {
    Languages: [],
    Frameworks: [],
    Tools: [],
    Other: [],
  };

  for (const skill of skills) {
    if (LANGUAGES.has(skill)) groups["Languages"]!.push(skill);
    else if (FRAMEWORKS.has(skill)) groups["Frameworks"]!.push(skill);
    else if (TOOLS.has(skill)) groups["Tools"]!.push(skill);
    else groups["Other"]!.push(skill);
  }

  return Object.fromEntries(
    Object.entries(groups).filter(([, v]) => v.length > 0)
  );
}

export function renderMarkdown(
  tailoredResume: TailoredResume,
  resumeMaster: ResumeMaster,
  userProfile: UserProfile
): string {
  const lines: string[] = [];

  // ── Header ──────────────────────────────────────────────────────────────────
  lines.push(`# ${userProfile.displayName}`);

  const contactParts: string[] = [];
  if (userProfile.location) contactParts.push(userProfile.location);
  contactParts.push(userProfile.email);
  if (userProfile.phone) contactParts.push(userProfile.phone);
  if (userProfile.socialLinks?.linkedin)
    contactParts.push(userProfile.socialLinks.linkedin);
  if (userProfile.socialLinks?.github)
    contactParts.push(userProfile.socialLinks.github);
  if (userProfile.socialLinks?.portfolio)
    contactParts.push(userProfile.socialLinks.portfolio);

  lines.push(contactParts.join(" · "));
  lines.push("");

  // ── Summary ──────────────────────────────────────────────────────────────────
  if (tailoredResume.tailoredSummary?.text) {
    lines.push("## Summary");
    lines.push("");
    lines.push(tailoredResume.tailoredSummary.text);
    lines.push("");
  }

  // ── Experience ───────────────────────────────────────────────────────────────
  if (tailoredResume.tailoredExperience.length > 0) {
    lines.push("## Experience");
    lines.push("");

    const entryMap = new Map<string, WorkExperienceEntry>(
      resumeMaster.experience.map((e) => [e.id, e])
    );

    for (const te of tailoredResume.tailoredExperience) {
      if (!te.included) continue;
      const entry = entryMap.get(te.sourceEntryId);
      if (!entry) continue;

      const dateRange = formatDateRange(
        entry.startDate,
        entry.endDate,
        entry.isCurrent
      );
      lines.push(`### ${entry.company}`);
      lines.push(`**${entry.title}** · ${dateRange}`);
      if (entry.location)
        lines.push(`*${entry.location}${entry.workMode ? ` · ${entry.workMode}` : ""}*`);
      lines.push("");

      for (const tb of te.tailoredBullets) {
        lines.push(`- ${tb.tailoredBullet}`);
      }
      lines.push("");
    }
  }

  // ── Skills ───────────────────────────────────────────────────────────────────
  if (tailoredResume.selectedSkills.length > 0) {
    lines.push("## Skills");
    lines.push("");
    const groups = groupSkills(tailoredResume.selectedSkills);
    for (const [cat, skillList] of Object.entries(groups)) {
      lines.push(`**${cat}:** ${skillList.join(", ")}`);
    }
    lines.push("");
  }

  // ── Education ────────────────────────────────────────────────────────────────
  if (resumeMaster.education.length > 0) {
    lines.push("## Education");
    lines.push("");
    for (const edu of resumeMaster.education) {
      const degree = edu.field
        ? `${edu.degree}, ${edu.field}`
        : edu.degree;
      const dateRange =
        edu.startDate && edu.endDate
          ? `${formatDate(edu.startDate)} – ${formatDate(edu.endDate)}`
          : edu.endDate
          ? formatDate(edu.endDate)
          : "";
      lines.push(`### ${edu.institution}`);
      lines.push(`**${degree}**${dateRange ? ` · ${dateRange}` : ""}`);
      if (edu.honors) lines.push(`*${edu.honors}*`);
      if (edu.gpa) lines.push(`GPA: ${edu.gpa}`);
      lines.push("");
    }
  }

  // ── Certifications ────────────────────────────────────────────────────────────
  if (resumeMaster.certifications.length > 0) {
    lines.push("## Certifications");
    lines.push("");
    for (const cert of resumeMaster.certifications) {
      const issued = cert.issuedAt ? ` · ${formatDate(cert.issuedAt)}` : "";
      const expires = cert.expiresAt ? ` (expires ${formatDate(cert.expiresAt)})` : "";
      lines.push(`- **${cert.name}** — ${cert.issuer}${issued}${expires}`);
    }
    lines.push("");
  }

  // ── Projects ──────────────────────────────────────────────────────────────────
  const selectedProjectIds = new Set(tailoredResume.selectedProjects);
  const selectedProjects = resumeMaster.projects.filter((p: ProjectEntry) =>
    selectedProjectIds.has(p.id)
  );

  if (selectedProjects.length > 0) {
    lines.push("## Projects");
    lines.push("");
    for (const proj of selectedProjects) {
      const link = proj.url ?? proj.repoUrl;
      lines.push(
        `### ${proj.name}${link ? ` — [${link}](${link})` : ""}`
      );
      if (proj.technologies.length > 0)
        lines.push(`*${proj.technologies.join(", ")}*`);
      lines.push(proj.description);
      for (const h of proj.highlights) lines.push(`- ${h}`);
      lines.push("");
    }
  }

  return lines.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}
