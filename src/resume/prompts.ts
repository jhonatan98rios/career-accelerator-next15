import type { Resume } from "./schema";

export const resumeExample: Resume = {
  meta: {
    schemaVersion: "1.0.0",
    language: "pt",
    generatedAt: null,
  },
  personal: {
    name: "João Silva",
    email: "joao@email.com",
    phone: null,
    location: { city: "São Paulo", state: "SP", country: "Brasil" },
    linkedin: "https://linkedin.com/in/joaosilva",
    website: null,
    photo: null,
  },
  summary: "Desenvolvedor full-stack com 5 anos de experiência em React e Node.js.",
  experience: [
    {
      company: "TechCorp",
      position: "Senior Developer",
      startDate: "2022-01",
      endDate: null,
      current: true,
      location: { city: "São Paulo", state: "SP", country: "Brasil" },
      description: "Liderança de time front-end com 4 desenvolvedores.",
      highlights: ["Migrou monólito para micro-frontends", "Reduziu tempo de build em 40%"],
    },
  ],
  education: [
    {
      institution: "USP",
      degree: "Bacharelado",
      field: "Ciência da Computação",
      startDate: "2015-01",
      endDate: "2019-12",
      gpa: null,
      description: null,
    },
  ],
  skills: {
    hard: [
      { name: "React", level: "advanced" },
      { name: "TypeScript", level: "advanced" },
      { name: "Node.js", level: "intermediate" },
    ],
    soft: [{ name: "Liderança", level: "advanced" }],
  },
  languages: [
    { name: "Português", proficiency: "native" },
    { name: "Inglês", proficiency: "professional" },
  ],
  certifications: [],
  projects: [],
  volunteer: [],
  awards: [],
  publications: [],
  references: [],
  social: {},
};

export const getResumeSystemPrompt = () => `
You are an API that generates structured JSON resumes from free-text user input.

Your output MUST be a single JSON object conforming exactly to this schema:

${JSON.stringify(resumeExample, null, 2)}

CRITICAL RULES — follow these exactly or the output will be rejected:

1. **Never invent information.** Only include data explicitly provided by the user.
2. **Unknown fields must be null.** If a field is not mentioned, set it to null (not empty string, not undefined).
3. **Empty lists stay empty.** If no items are provided for a section, return []. Never remove the array property.
4. **Never remove properties from the schema.** Every property in the example must appear in your output, even if null/empty.
5. **Fill only what is provided.** Do not infer skills from job titles, do not guess dates, do not create summaries from thin air.
6. **Summarize long texts** keeping key context. Long descriptions should be distilled to 2-3 sentences.
7. **Language field (meta.language):** Use "pt" for Portuguese input, "en" for English input. This field is REQUIRED.
8. **Dates** must be in YYYY-MM format. If only year is known, use YYYY. Current positions should have endDate: null and current: true.
9. **Skill levels** must be one of: beginner, intermediate, advanced, expert — ONLY if explicitly stated.
10. **Language proficiency** must be one of: basic, conversational, professional, native — ONLY if explicitly stated.
11. **Return ONLY the JSON object.** No markdown, no code fences, no explanation. Just the raw JSON.

If the user provides very little information (e.g., only a LinkedIn URL), still output the full schema with null/empty fields for unknown data.
`.trim();
