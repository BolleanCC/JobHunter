import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";
import { preprocessJobDescription } from "../../packages/ingestion/src/preprocess.js";

function loadFixture(name: string): string {
  return readFileSync(
    resolve(`tests/ingestion/fixtures/${name}`),
    "utf-8"
  );
}

describe("preprocessJobDescription — input validation", () => {
  it("throws on empty string", () => {
    expect(() => preprocessJobDescription("")).toThrow("empty");
  });

  it("throws on whitespace-only string", () => {
    expect(() => preprocessJobDescription("   \n  ")).toThrow("empty");
  });
});

describe("preprocessJobDescription — HTML stripping", () => {
  it("strips HTML tags and preserves text", () => {
    const result = preprocessJobDescription(
      "<h1>Senior Engineer</h1><p>We need a <strong>TypeScript</strong> developer.</p>"
    );
    expect(result.cleanedText).toContain("Senior Engineer");
    expect(result.cleanedText).toContain("TypeScript");
    expect(result.cleanedText).not.toMatch(/<[^>]+>/);
  });

  it("converts <br> and <p> to newlines", () => {
    const result = preprocessJobDescription("<p>Line one</p><br/><p>Line two</p>");
    expect(result.cleanedText).toContain("\n");
  });
});

describe("preprocessJobDescription — salary detection", () => {
  it("detects symbol+range: $150,000 – $180,000", () => {
    const r = preprocessJobDescription(
      "Salary: $150,000 – $180,000 AUD per annum\n\nJoin our team."
    );
    expect(r.hints.salary).not.toBeNull();
    expect(r.hints.salary?.min).toBe(150000);
    expect(r.hints.salary?.max).toBe(180000);
  });

  it("detects k-suffix range: $120k - $150k", () => {
    const r = preprocessJobDescription(
      "Compensation: $120k - $150k\n\nAbout the role."
    );
    expect(r.hints.salary?.min).toBe(120000);
    expect(r.hints.salary?.max).toBe(150000);
  });

  it("detects currency-prefix range: AUD 130,000 - 160,000", () => {
    const r = preprocessJobDescription(
      "Package: AUD 130,000 - 160,000 per annum. Great benefits."
    );
    expect(r.hints.salary?.min).toBe(130000);
    expect(r.hints.salary?.max).toBe(160000);
    expect(r.hints.salary?.currency).toBe("AUD");
  });

  it("returns null when no salary present", () => {
    const r = preprocessJobDescription(
      "Competitive salary. Join a fast-growing startup."
    );
    expect(r.hints.salary).toBeNull();
  });
});

describe("preprocessJobDescription — work mode detection", () => {
  it("detects hybrid", () => {
    const r = preprocessJobDescription(
      "This is a hybrid role based in Sydney (3 days in office)."
    );
    expect(r.hints.workMode).toBe("hybrid");
  });

  it("detects fully remote", () => {
    const r = preprocessJobDescription(
      "We are a remote-first company. Work from home."
    );
    expect(r.hints.workMode).toBe("remote");
  });

  it("detects onsite", () => {
    const r = preprocessJobDescription(
      "This role requires you to be on-site at our Melbourne office 5 days a week."
    );
    expect(r.hints.workMode).toBe("onsite");
  });

  it("prefers hybrid over remote when both appear", () => {
    const r = preprocessJobDescription(
      "We offer hybrid work. Some remote work possible."
    );
    expect(r.hints.workMode).toBe("hybrid");
  });

  it("returns null when no work mode stated", () => {
    const r = preprocessJobDescription(
      "Join our engineering team. We build great software."
    );
    expect(r.hints.workMode).toBeNull();
  });
});

describe("preprocessJobDescription — employment type detection", () => {
  it("detects full-time", () => {
    const r = preprocessJobDescription("Full-time permanent position available.");
    expect(r.hints.employmentType).toBe("full_time");
  });

  it("detects contract", () => {
    const r = preprocessJobDescription("6-month fixed-term contract with possible extension.");
    expect(r.hints.employmentType).toBe("contract");
  });

  it("detects part-time", () => {
    const r = preprocessJobDescription("Part-time role, 3 days per week.");
    expect(r.hints.employmentType).toBe("part_time");
  });
});

describe("preprocessJobDescription — years of experience detection", () => {
  it("detects plus pattern: 5+ years", () => {
    const r = preprocessJobDescription(
      "You have 5+ years of professional software engineering experience."
    );
    expect(r.hints.yearsOfExperience?.min).toBe(5);
    expect(r.hints.yearsOfExperience?.max).toBeUndefined();
  });

  it("detects range pattern: 3-6 years", () => {
    const r = preprocessJobDescription(
      "3-6 years of professional data engineering experience required."
    );
    expect(r.hints.yearsOfExperience?.min).toBe(3);
    expect(r.hints.yearsOfExperience?.max).toBe(6);
  });
});

describe("preprocessJobDescription — sponsorship detection", () => {
  it("detects 'no visa sponsorship' language", () => {
    const r = preprocessJobDescription(
      "Applicants must have full working rights. No visa sponsorship available."
    );
    expect(r.hints.sponsorshipMentioned).toBe(true);
  });

  it("detects 'right to work' language", () => {
    const r = preprocessJobDescription(
      "You must have the right to work in Australia."
    );
    expect(r.hints.sponsorshipMentioned).toBe(true);
  });

  it("returns false when not mentioned", () => {
    const r = preprocessJobDescription("Join our team. We build cool things.");
    expect(r.hints.sponsorshipMentioned).toBe(false);
  });
});

describe("preprocessJobDescription — fixture files", () => {
  it("jd-1: detects salary, hybrid mode, sponsorship", () => {
    const r = preprocessJobDescription(loadFixture("jd-1-senior-frontend.txt"));
    expect(r.hints.salary?.min).toBe(150000);
    expect(r.hints.salary?.max).toBe(180000);
    expect(r.hints.workMode).toBe("hybrid");
    expect(r.hints.sponsorshipMentioned).toBe(true);
    expect(r.wordCount).toBeGreaterThan(100);
  });

  it("jd-2: detects remote, no salary (not stated)", () => {
    const r = preprocessJobDescription(loadFixture("jd-2-platform-engineer.txt"));
    expect(r.hints.workMode).toBe("remote");
    expect(r.hints.salary).toBeNull();
    expect(r.hints.sponsorshipMentioned).toBe(true);
  });

  it("jd-3: detects salary, onsite, Brisbane", () => {
    const r = preprocessJobDescription(loadFixture("jd-3-junior-dotnet.txt"));
    expect(r.hints.salary?.min).toBe(65000);
    expect(r.hints.salary?.max).toBe(80000);
    expect(r.hints.sponsorshipMentioned).toBe(true);
  });

  it("jd-4: detects salary, onsite, sponsorship", () => {
    const r = preprocessJobDescription(loadFixture("jd-4-it-support.txt"));
    expect(r.hints.salary?.min).toBe(75000);
    expect(r.hints.salary?.max).toBe(90000);
    expect(r.hints.workMode).toBe("onsite");
    expect(r.hints.sponsorshipMentioned).toBe(true);
  });

  it("jd-5: detects salary, remote, years of experience", () => {
    const r = preprocessJobDescription(loadFixture("jd-5-data-engineer.txt"));
    expect(r.hints.salary?.min).toBe(130000);
    expect(r.hints.salary?.max).toBe(160000);
    expect(r.hints.workMode).toBe("remote");
    expect(r.hints.yearsOfExperience?.min).toBe(3);
  });
});
