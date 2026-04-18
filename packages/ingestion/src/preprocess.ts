import type { DetectedHints, DetectedSalary, PreprocessedJob } from "./types.js";

// ── Text cleaning ─────────────────────────────────────────────────────────────

function stripHtml(text: string): string {
  return text
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<\/li>/gi, "\n")
    .replace(/<[^>]+>/g, " ");
}

function normalizeUnicode(text: string): string {
  return text
    .replace(/[\u2013\u2014]/g, "-")   // en-dash, em-dash → hyphen
    .replace(/[\u2018\u2019]/g, "'")   // smart single quotes
    .replace(/[\u201C\u201D]/g, '"')   // smart double quotes
    .replace(/\u00a0/g, " ")           // non-breaking space
    .replace(/\u2022/g, "-")           // bullet → hyphen
    .replace(/\u00b7/g, "-");          // middle dot → hyphen
}

function collapseWhitespace(text: string): string {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/[^\S\n]+/g, " ")         // collapse horizontal whitespace
    .replace(/\n{3,}/g, "\n\n")        // max 2 blank lines
    .trim();
}

// ── Salary detection ──────────────────────────────────────────────────────────

const CURRENCY_SYMBOLS: Record<string, string> = {
  "$": "USD",
  "£": "GBP",
  "€": "EUR",
};

function parseAmount(raw: string): number {
  const n = parseFloat(raw.replace(/,/g, ""));
  // treat values <= 999 as "k" (e.g. "150" in "$150k - $200k")
  return n < 1000 ? n * 1000 : n;
}

function detectSalary(text: string): DetectedSalary | null {
  // Pattern: $150,000 - $200,000 or $150k - $200k
  const symbolRange =
    /([£$€])\s*([\d,]+)k?\s*[-–to]+\s*[£$€]?\s*([\d,]+)k?(?:\s*(per\s+(?:annum|year|yr|month|day|hour)|\/?(?:yr|yr\.?|pa|p\.a\.))?)/i;

  // Pattern: AUD 150,000 - 200,000 or 150,000 - 200,000 AUD
  const codePrefix =
    /\b(AUD|USD|GBP|NZD|EUR|CAD)\s*([\d,]+)k?\s*[-–to]+\s*([\d,]+)k?(?:\s*(per\s+(?:annum|year|month|day|hour)))?/i;
  const codeSuffix =
    /([\d,]+)k?\s*[-–to]+\s*([\d,]+)k?\s*(AUD|USD|GBP|NZD|EUR|CAD)/i;

  // Single value: $120,000 or $120k
  const symbolSingle = /([£$€])\s*([\d,]+)k?(?:\+)?\s*(?:per\s+(?:annum|year|month)|\/?(?:yr|pa|p\.a\.))?/i;

  let m: RegExpMatchArray | null;

  if ((m = text.match(symbolRange))) {
    const currency = CURRENCY_SYMBOLS[m[1] as string] ?? "USD";
    const periodRaw = m[4] ?? "";
    return {
      raw: m[0],
      min: parseAmount(m[2] as string),
      max: parseAmount(m[3] as string),
      currency,
      period: detectPeriod(periodRaw),
    };
  }

  if ((m = text.match(codePrefix))) {
    return {
      raw: m[0],
      min: parseAmount(m[2] as string),
      max: parseAmount(m[3] as string),
      currency: (m[1] as string).toUpperCase(),
      period: detectPeriod(m[4] ?? ""),
    };
  }

  if ((m = text.match(codeSuffix))) {
    return {
      raw: m[0],
      min: parseAmount(m[1] as string),
      max: parseAmount(m[2] as string),
      currency: (m[3] as string).toUpperCase(),
      period: "annual",
    };
  }

  if ((m = text.match(symbolSingle))) {
    const currency = CURRENCY_SYMBOLS[m[1] as string] ?? "USD";
    const amount = parseAmount(m[2] as string);
    return { raw: m[0], min: amount, currency, period: "annual" };
  }

  return null;
}

function detectPeriod(
  raw: string
): "annual" | "monthly" | "daily" | "hourly" {
  const r = raw.toLowerCase();
  if (/month/.test(r)) return "monthly";
  if (/day|daily/.test(r)) return "daily";
  if (/hour/.test(r)) return "hourly";
  return "annual"; // default for annum/year/yr/pa
}

// ── Work mode detection ───────────────────────────────────────────────────────

function detectWorkMode(
  text: string
): "remote" | "hybrid" | "onsite" | null {
  const lower = text.toLowerCase();
  const isRemote =
    /\b(?:fully?\s+remote|100%\s+remote|work(?:ing)?\s+from\s+home|wfh|remote.?first|remote.?only)\b/.test(
      lower
    );
  const isHybrid = /\bhybrid\b/.test(lower);
  const isOnsite =
    /\b(?:on.?site|in.?office|in\s+person|office.?based|required\s+in\s+(?:the\s+)?office)\b/.test(
      lower
    );

  // Prefer the most specific: if both "hybrid" and "remote" appear, trust hybrid
  if (isHybrid) return "hybrid";
  if (isRemote) return "remote";
  if (isOnsite) return "onsite";
  return null;
}

// ── Employment type detection ─────────────────────────────────────────────────

function detectEmploymentType(
  text: string
): "full_time" | "part_time" | "contract" | "casual" | null {
  const lower = text.toLowerCase();
  if (/\b(?:full.?time|permanent|perm)\b/.test(lower)) return "full_time";
  if (/\b(?:part.?time)\b/.test(lower)) return "part_time";
  if (/\b(?:contract(?:or)?|fixed.?term|temp(?:orary)?)\b/.test(lower))
    return "contract";
  if (/\b(?:casual|on.?call)\b/.test(lower)) return "casual";
  return null;
}

// ── Years of experience detection ─────────────────────────────────────────────

function detectYearsOfExperience(
  text: string
): { min: number; max?: number } | null {
  // "5+ years", "5 or more years", "3-5 years", "at least 3 years"
  const rangeMatch = text.match(
    /(\d+)\s*[-–to]+\s*(\d+)\s*\+?\s*years?(?:\s+of)?\s+(?:experience|exp|professional)/i
  );
  if (rangeMatch) {
    return {
      min: parseInt(rangeMatch[1] as string, 10),
      max: parseInt(rangeMatch[2] as string, 10),
    };
  }

  const plusMatch = text.match(
    /(\d+)\s*\+\s*years?(?:\s+of)?\s+(?:experience|exp|professional)/i
  );
  if (plusMatch) {
    return { min: parseInt(plusMatch[1] as string, 10) };
  }

  const atLeastMatch = text.match(
    /(?:at\s+least|minimum\s+of?)\s+(\d+)\s+years?/i
  );
  if (atLeastMatch) {
    return { min: parseInt(atLeastMatch[1] as string, 10) };
  }

  return null;
}

// ── Location detection ────────────────────────────────────────────────────────

function detectLocation(text: string): string | null {
  // Look for explicit "Location:" label
  const labelMatch = text.match(
    /(?:location|based\s+in|office(?:s)?\s+in|located\s+in)[:\s]+([A-Za-z\s,]+?)(?:\n|\.|\|)/i
  );
  if (labelMatch) return (labelMatch[1] as string).trim();

  // Common Australian/NZ/UK city patterns followed by state/country
  const cityMatch = text.match(
    /\b(Sydney|Melbourne|Brisbane|Perth|Adelaide|Canberra|Auckland|Wellington|London|New York|San Francisco|Seattle|Austin|Toronto|Vancouver)\b(?:,\s*[A-Z]{2,3})?/
  );
  if (cityMatch) return cityMatch[0].trim();

  return null;
}

// ── Sponsorship detection ─────────────────────────────────────────────────────

function detectSponsorship(text: string): boolean {
  const lower = text.toLowerCase();
  return (
    /(?:sponsorship|working\s+rights|right\s+to\s+work|work\s+authoris|visa\s+sponsorship|must\s+be\s+(?:a\s+)?(?:citizen|resident|pr)|no\s+sponsorship)/.test(
      lower
    )
  );
}

// ── Main export ───────────────────────────────────────────────────────────────

export function preprocessJobDescription(rawText: string): PreprocessedJob {
  if (!rawText.trim()) {
    throw new Error("Job description text is empty");
  }

  const htmlStripped = stripHtml(rawText);
  const unicodeNormalized = normalizeUnicode(htmlStripped);
  const cleanedText = collapseWhitespace(unicodeNormalized);
  const wordCount = cleanedText.split(/\s+/).filter(Boolean).length;

  const hints: DetectedHints = {
    salary: detectSalary(cleanedText),
    location: detectLocation(cleanedText),
    workMode: detectWorkMode(cleanedText),
    employmentType: detectEmploymentType(cleanedText),
    yearsOfExperience: detectYearsOfExperience(cleanedText),
    sponsorshipMentioned: detectSponsorship(cleanedText),
  };

  return { cleanedText, wordCount, hints };
}
