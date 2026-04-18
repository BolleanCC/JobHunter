// ── Inline CSS ────────────────────────────────────────────────────────────────
export const RESUME_CSS = `
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
  font-size: 10.5pt;
  line-height: 1.45;
  color: #1a1a1a;
  background: #fff;
}

.page {
  max-width: 8.3in;
  margin: 0 auto;
  padding: 0.55in 0.65in;
}

/* ── Header ────────────────────────────────────────────────────────────────── */
.header { margin-bottom: 14px; border-bottom: 2px solid #1e3a5f; padding-bottom: 10px; }

.header-name {
  font-size: 22pt;
  font-weight: 700;
  color: #1e3a5f;
  letter-spacing: -0.3px;
  line-height: 1.1;
}

.header-title {
  font-size: 11pt;
  color: #4b5563;
  font-weight: 400;
  margin-top: 2px;
  margin-bottom: 7px;
}

.contact-line {
  font-size: 8.5pt;
  color: #374151;
  display: flex;
  flex-wrap: wrap;
  gap: 3px 14px;
  align-items: center;
}

.contact-line a { color: #2563eb; text-decoration: none; }
.contact-sep { color: #d1d5db; }

/* ── Section headings ──────────────────────────────────────────────────────── */
h2 {
  font-size: 9.5pt;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.13em;
  color: #1e3a5f;
  border-bottom: 1.5px solid #2563eb;
  padding-bottom: 2px;
  margin: 14px 0 7px;
}

/* ── Summary ───────────────────────────────────────────────────────────────── */
.summary {
  font-size: 9.5pt;
  color: #374151;
  line-height: 1.5;
}

/* ── Experience ────────────────────────────────────────────────────────────── */
.exp-entry { margin-bottom: 10px; }

.exp-header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  flex-wrap: wrap;
  gap: 0 8px;
}

.exp-company {
  font-weight: 700;
  font-size: 10.5pt;
  color: #111827;
}

.exp-dates {
  font-size: 8.5pt;
  color: #6b7280;
  white-space: nowrap;
}

.exp-title {
  font-size: 9.5pt;
  color: #374151;
  font-style: italic;
  margin-bottom: 4px;
}

.exp-meta {
  font-size: 8.5pt;
  color: #6b7280;
  margin-bottom: 3px;
}

.exp-bullets { list-style: none; padding: 0; margin: 0; }

.exp-bullets li {
  padding-left: 13px;
  position: relative;
  font-size: 9.5pt;
  color: #1a1a1a;
  margin-bottom: 2px;
  line-height: 1.42;
}

.exp-bullets li::before {
  content: '▸';
  position: absolute;
  left: 0;
  color: #2563eb;
  font-size: 8pt;
  top: 1.5px;
}

/* ── Skills ────────────────────────────────────────────────────────────────── */
.skills-table { display: grid; grid-template-columns: auto 1fr; gap: 4px 14px; }
.skill-cat { font-weight: 600; font-size: 9pt; color: #374151; white-space: nowrap; }
.skill-vals { font-size: 9pt; color: #1a1a1a; }

/* ── Education ─────────────────────────────────────────────────────────────── */
.edu-entry { margin-bottom: 6px; }

.edu-header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
}

.edu-degree { font-weight: 600; font-size: 10pt; color: #111827; }
.edu-dates { font-size: 8.5pt; color: #6b7280; }
.edu-institution { font-size: 9pt; color: #4b5563; }
.edu-detail { font-size: 8.5pt; color: #6b7280; }

/* ── Certifications ────────────────────────────────────────────────────────── */
.cert-grid { display: grid; grid-template-columns: 1fr auto; gap: 3px 16px; }
.cert-name { font-size: 9.5pt; font-weight: 500; color: #111827; }
.cert-issuer { font-size: 9pt; color: #4b5563; }
.cert-date { font-size: 8.5pt; color: #6b7280; text-align: right; }

/* ── Projects ──────────────────────────────────────────────────────────────── */
.project-entry { margin-bottom: 8px; }

.project-header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
}

.project-name { font-weight: 600; font-size: 10pt; color: #111827; }
.project-link { font-size: 8.5pt; color: #2563eb; }
.project-tech { font-size: 8.5pt; color: #6b7280; margin: 1px 0 3px; }
.project-desc { font-size: 9.5pt; color: #1a1a1a; }

/* ── Print ─────────────────────────────────────────────────────────────────── */
@media print {
  body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
  .page { padding: 0.4in 0.5in; }
  h2 { page-break-after: avoid; }
  .exp-entry, .edu-entry, .project-entry { page-break-inside: avoid; }
}
`.trim();

// ── HTML page wrapper ─────────────────────────────────────────────────────────

export function wrapHtmlPage(title: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escHtml(title)}</title>
  <style>${RESUME_CSS}</style>
</head>
<body>
<div class="page">
${body}
</div>
</body>
</html>`;
}

// ── HTML escape utility ───────────────────────────────────────────────────────

export function escHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}
