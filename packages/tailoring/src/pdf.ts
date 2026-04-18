/**
 * PDF export using Puppeteer.
 *
 * This module is intentionally NOT imported by the main index — it is a
 * standalone script. Run it directly:
 *
 *   tsx packages/tailoring/src/pdf.ts --input resume.html --output resume.pdf
 *
 * Requires puppeteer to be installed:
 *   pnpm add -D puppeteer
 *
 * Puppeteer will download Chromium on first run (~170 MB).
 */

import { readFileSync, writeFileSync } from "fs";
import { resolve } from "path";

async function htmlToPdf(htmlPath: string, outPath: string): Promise<void> {
  // Dynamic import so puppeteer is not required by other modules
  let puppeteer: typeof import("puppeteer");
  try {
    puppeteer = await import("puppeteer");
  } catch {
    throw new Error(
      'puppeteer is not installed. Run: pnpm add -D puppeteer'
    );
  }

  const html = readFileSync(resolve(htmlPath), "utf-8");
  const browser = await puppeteer.default.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "0", right: "0", bottom: "0", left: "0" },
    });

    writeFileSync(resolve(outPath), pdfBuffer);
    console.log(`PDF written to ${outPath}`);
  } finally {
    await browser.close();
  }
}

// ── CLI entry point ───────────────────────────────────────────────────────────

if (process.argv[1] && process.argv[1].endsWith("pdf.ts")) {
  const args = process.argv.slice(2);
  const inputIdx = args.indexOf("--input");
  const outputIdx = args.indexOf("--output");

  if (inputIdx === -1 || outputIdx === -1) {
    console.error("Usage: tsx pdf.ts --input <resume.html> --output <resume.pdf>");
    process.exit(1);
  }

  const htmlPath = args[inputIdx + 1];
  const outPath = args[outputIdx + 1];

  if (!htmlPath || !outPath) {
    console.error("--input and --output values are required");
    process.exit(1);
  }

  htmlToPdf(htmlPath, outPath).catch((err) => {
    console.error("PDF generation failed:", err);
    process.exit(1);
  });
}

export { htmlToPdf };
