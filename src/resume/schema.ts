import { z } from "zod";

// ── Date string: YYYY-MM or YYYY ────────────────────────────────────────
const dateString = z
  .string()
  .regex(/^\d{4}(-\d{2})?$/, "Date must be YYYY or YYYY-MM")
  .nullable();

// ── Location ────────────────────────────────────────────────────────────
const location = z.object({
  city: z.string().nullable(),
  state: z.string().nullable(),
  country: z.string().nullable(),
});

// ── Experience ──────────────────────────────────────────────────────────
const experience = z.object({
  company: z.string(),
  position: z.string(),
  startDate: dateString,
  endDate: dateString,
  current: z.boolean().default(false),
  location: location.nullable().default(null),
  description: z.string().nullable().default(null),
  highlights: z.array(z.string()).default([]),
});

// ── Education ───────────────────────────────────────────────────────────
const education = z.object({
  institution: z.string(),
  degree: z.string(),
  field: z.string(),
  startDate: dateString,
  endDate: dateString,
  gpa: z.string().nullable().default(null),
  description: z.string().nullable().default(null),
});

// ── Skill ───────────────────────────────────────────────────────────────
const skill = z.object({
  name: z.string(),
  level: z.enum(["beginner", "intermediate", "advanced", "expert"]).nullable().default(null),
});

// ── Language ────────────────────────────────────────────────────────────
const language = z.object({
  name: z.string(),
  proficiency: z
    .enum(["basic", "conversational", "professional", "native"])
    .nullable()
    .default(null),
});

// ── Certification ───────────────────────────────────────────────────────
const certification = z.object({
  name: z.string(),
  issuer: z.string().nullable().default(null),
  date: dateString,
  url: z.string().nullable().default(null),
});

// ── Project ─────────────────────────────────────────────────────────────
const project = z.object({
  name: z.string(),
  description: z.string().nullable().default(null),
  url: z.string().nullable().default(null),
  highlights: z.array(z.string()).default([]),
  startDate: dateString,
  endDate: dateString,
});

// ── Volunteer ───────────────────────────────────────────────────────────
const volunteer = z.object({
  organization: z.string(),
  role: z.string(),
  startDate: dateString,
  endDate: dateString,
  description: z.string().nullable().default(null),
});

// ── Award ───────────────────────────────────────────────────────────────
const award = z.object({
  title: z.string(),
  issuer: z.string().nullable().default(null),
  date: dateString,
  description: z.string().nullable().default(null),
});

// ── Publication ─────────────────────────────────────────────────────────
const publication = z.object({
  title: z.string(),
  publisher: z.string().nullable().default(null),
  date: dateString,
  url: z.string().nullable().default(null),
  description: z.string().nullable().default(null),
});

// ── Reference ───────────────────────────────────────────────────────────
const reference = z.object({
  name: z.string(),
  relationship: z.string().nullable().default(null),
  email: z.string().nullable().default(null),
  phone: z.string().nullable().default(null),
});

// ── Social Profiles ─────────────────────────────────────────────────────
const social = z.object({
  github: z.string().nullable().default(null),
  twitter: z.string().nullable().default(null),
  stackoverflow: z.string().nullable().default(null),
  medium: z.string().nullable().default(null),
  behance: z.string().nullable().default(null),
  dribbble: z.string().nullable().default(null),
});

// ── Resume Schema ───────────────────────────────────────────────────────
export const ResumeSchema = z
  .object({
    // ── Metadata ──
    meta: z.object({
      schemaVersion: z.literal("1.0.0"),
      language: z.enum(["pt", "en"]).default("pt"),
      generatedAt: z.string().nullable().default(null),
    }),

    // ── Personal ──
    personal: z.object({
      name: z.string().min(1, "Name cannot be empty"),
      email: z.string().nullable().default(null),
      phone: z.string().nullable().default(null),
      location: location.nullable().default(null),
      linkedin: z.string().nullable().default(null),
      website: z.string().nullable().default(null),
      photo: z.string().nullable().default(null),
    }),

    // ── Summary ──
    summary: z.string().nullable().default(null),

    // ── Sections ──
    experience: z.array(experience).default([]),
    education: z.array(education).default([]),
    skills: z
      .object({
        hard: z.array(skill).default([]),
        soft: z.array(skill).default([]),
      })
      .default({ hard: [], soft: [] }),
    languages: z.array(language).default([]),
    certifications: z.array(certification).default([]),
    projects: z.array(project).default([]),
    volunteer: z.array(volunteer).default([]),
    awards: z.array(award).default([]),
    publications: z.array(publication).default([]),
    references: z.array(reference).default([]),
    social: social.default({}),
  })
  .strict();

export type Resume = z.infer<typeof ResumeSchema>;
