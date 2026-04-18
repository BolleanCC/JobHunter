/**
 * Shared test fixtures for tailoring tests.
 * Uses the same profile/resume from data/samples where possible,
 * but as typed TS constants for direct import.
 */

import type {
  UserProfile,
  ResumeMaster,
  JobRequirements,
} from "@jobhunter/schema";

export const PROFILE: UserProfile = {
  id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  createdAt: new Date("2024-01-15"),
  legalName: "Alex Jordan Smith",
  email: "alex.smith@example.com",
  workAuthorizations: [{ country: "AU", status: "permanent_resident", sponsorshipRequired: false }],
  displayName: "Alex Smith",
  headline: "Senior Full-Stack Engineer · TypeScript · AWS · 8 yrs",
  phone: "+61 400 000 000",
  location: "Sydney, NSW, Australia",
  socialLinks: {
    linkedin: "https://linkedin.com/in/alex-smith-dev",
    github: "https://github.com/alexsmith",
    other: [],
  },
  targetRoles: ["Senior Software Engineer", "Staff Engineer", "Tech Lead"],
  targetLocations: ["Sydney", "Melbourne", "Remote"],
  targetWorkModes: ["hybrid", "remote"],
  salaryExpectation: {
    min: 140000,
    max: 180000,
    currency: "AUD",
    period: "annual",
    isNegotiable: true,
  },
  relocationPreference: "open_to_discuss",
  noticePeriodDays: 28,
  openToContract: true,
  openToPartTime: false,
  languages: [{ language: "English", proficiency: "native" }],
  updatedAt: new Date("2024-11-01"),
};

export const RESUME_MASTER: ResumeMaster = {
  id: "b2c3d4e5-f6a7-8901-bcde-f12345678901",
  userId: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  createdAt: new Date("2024-01-15"),
  label: "Master Resume",
  summary:
    "Senior full-stack engineer with 8+ years building scalable distributed systems.",
  totalYearsOfExperience: 8,
  experience: [
    {
      id: "e1000001-0000-0000-0000-000000000001",
      company: "Acme Fintech Pty Ltd",
      title: "Senior Software Engineer",
      employmentType: "full_time",
      location: "Sydney, NSW",
      workMode: "hybrid",
      startDate: "2021-03",
      isCurrent: true,
      bullets: [
        "Architected event-driven payment processing pipeline handling 50k TPS using Kafka and Node.js, reducing latency by 40%",
        "Led migration of monolith to microservices, cutting deployment time from 2 hours to 8 minutes via GitHub Actions + ECS",
        "Mentored 4 junior engineers; introduced ADR process adopted across 3 teams",
        "Built internal developer portal using React and TypeScript, used daily by 120 engineers",
      ],
      technologies: ["TypeScript", "Node.js", "Kafka", "AWS ECS", "PostgreSQL", "Terraform"],
    },
    {
      id: "e1000002-0000-0000-0000-000000000002",
      company: "StartupXYZ",
      title: "Software Engineer",
      employmentType: "full_time",
      location: "Sydney, NSW",
      workMode: "onsite",
      startDate: "2018-06",
      endDate: "2021-02",
      isCurrent: false,
      bullets: [
        "Built real-time analytics dashboard using React, D3.js, and WebSocket, serving 200+ enterprise clients",
        "Reduced API p99 latency from 800 ms to 120 ms by introducing a Redis caching layer",
        "Delivered GDPR compliance features end-to-end within 6-week regulatory deadline",
      ],
      technologies: ["React", "TypeScript", "Python", "Redis", "PostgreSQL", "AWS Lambda"],
    },
  ],
  education: [
    {
      id: "ed000001-0000-0000-0000-000000000001",
      institution: "University of New South Wales",
      degree: "Bachelor of Engineering (Honours)",
      field: "Software Engineering",
      startDate: "2014-02",
      endDate: "2018-11",
      gpa: 6.5,
      honors: "First Class Honours",
      relevantCourses: [],
    },
  ],
  projects: [
    {
      id: "ab000001-0000-0000-0000-000000000001",
      name: "OpenTraceQL",
      description: "Open-source query language for distributed trace analysis, used by 300+ developers",
      url: "https://opentraceql.dev",
      repoUrl: "https://github.com/alexsmith/opentraceql",
      technologies: ["TypeScript", "Node.js"],
      highlights: ["300+ GitHub stars"],
      startDate: "2022-09",
      isCurrent: true,
    },
  ],
  skills: [
    { name: "TypeScript", proficiency: "expert", yearsOfExperience: 6 },
    { name: "Node.js", proficiency: "expert", yearsOfExperience: 7 },
    { name: "React", proficiency: "advanced", yearsOfExperience: 5 },
    { name: "AWS", proficiency: "advanced", yearsOfExperience: 5 },
    { name: "PostgreSQL", proficiency: "advanced", yearsOfExperience: 6 },
    { name: "Kafka", proficiency: "intermediate", yearsOfExperience: 3 },
    { name: "Terraform", proficiency: "intermediate", yearsOfExperience: 2 },
    { name: "Python", proficiency: "intermediate", yearsOfExperience: 4 },
    { name: "Redis", proficiency: "intermediate", yearsOfExperience: 3 },
    { name: "Docker", proficiency: "intermediate", yearsOfExperience: 4 },
  ],
  certifications: [
    {
      id: "ce000001-0000-0000-0000-000000000001",
      name: "AWS Certified Solutions Architect – Associate",
      issuer: "Amazon Web Services",
      issuedAt: "2022-05",
      expiresAt: "2025-05",
    },
  ],
  awards: [],
  publications: [],
  volunteerWork: [],
  updatedAt: new Date("2024-11-01"),
};

export const REQUIREMENTS_FRONTEND: JobRequirements = {
  id: "d4e5f6a7-b8c9-0123-defa-234567890123",
  jobPostingId: "c3d4e5f6-a7b8-9012-cdef-123456789012",
  extractedAt: new Date("2024-11-05"),
  extractedByModel: "claude-sonnet-4-6",
  roleTitle: "Senior Frontend Engineer – Consumer Products",
  seniority: "senior",
  domain: "Frontend Engineering",
  responsibilities: [
    "Build high-performance React components",
    "Drive technical direction for frontend",
  ],
  mustHaveSkills: [
    { name: "TypeScript", category: "language", isRequired: true, isAmbiguous: false },
    { name: "React", category: "framework", isRequired: true, isAmbiguous: false },
    { name: "Redux", category: "framework", isRequired: true, isAmbiguous: true },
  ],
  niceToHaveSkills: [
    { name: "Next.js", category: "framework", isRequired: false, isAmbiguous: false },
    { name: "GraphQL", category: "tool", isRequired: false, isAmbiguous: false },
  ],
  atsKeywords: [
    "TypeScript", "React", "Redux", "Next.js", "GraphQL",
    "state management", "component library", "performance optimisation",
    "Core Web Vitals", "Jest", "React Testing Library",
  ],
  educationRequirements: [],
  workAuthorizationSignals: ["Must have full working rights in Australia"],
  location: "Sydney, NSW",
  workModel: "hybrid",
  salary: {
    min: 150000,
    max: 180000,
    currency: "AUD",
    period: "annual",
    isNegotiable: false,
  },
  redFlags: [],
  humanReviewed: false,
};

export const REQUIREMENTS_PLATFORM: JobRequirements = {
  id: "e5f6a7b8-c9d0-1234-e0a1-345678901234",
  jobPostingId: "c3d4e5f6-a7b8-9012-cdef-123456789012",
  extractedAt: new Date("2024-11-05"),
  extractedByModel: "claude-sonnet-4-6",
  roleTitle: "Senior Platform Engineer",
  seniority: "senior",
  domain: "Platform Engineering",
  responsibilities: ["Own Kubernetes clusters", "Build developer tooling"],
  mustHaveSkills: [
    { name: "Kubernetes", category: "platform", isRequired: true, isAmbiguous: false },
    { name: "Terraform", category: "tool", isRequired: true, isAmbiguous: false },
    { name: "AWS", category: "platform", isRequired: true, isAmbiguous: false },
    { name: "Go", category: "language", isRequired: true, isAmbiguous: true },
  ],
  niceToHaveSkills: [
    { name: "Helm", category: "tool", isRequired: false, isAmbiguous: false },
    { name: "Argo CD", category: "tool", isRequired: false, isAmbiguous: false },
  ],
  atsKeywords: [
    "Kubernetes", "k8s", "Terraform", "AWS", "EKS", "Go", "Python",
    "Prometheus", "Grafana", "GitOps", "Argo CD", "Helm",
    "platform engineering", "infrastructure-as-code", "CI/CD",
  ],
  educationRequirements: [],
  workAuthorizationSignals: [],
  location: "Melbourne, VIC",
  workModel: "remote",
  redFlags: [
    { type: "vague_compensation", description: "Salary not disclosed", severity: "medium" },
  ],
  humanReviewed: false,
};
