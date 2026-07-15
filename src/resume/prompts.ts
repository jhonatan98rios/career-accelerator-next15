import type { Resume } from "./schema";

export type UserData = {
  name?: string;
  email?: string;
  currentRole?: string;
  targetRole?: string;
  yearsOfExperience?: number;
  careerStage?: string;
  industries?: string[];
  employmentStatus?: string;
  educationLevel?: string;
  fieldOfStudy?: string;
  certifications?: string[];
  hardSkills?: string[];
  softSkills?: string[];
  languages?: { name: string; proficiency: string }[];
  shortTermGoal?: string;
  mediumTermGoal?: string;
  longTermGoal?: string;
};

export const resumeExamplePt: Resume = {
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
  social: { github: null, twitter: null, stackoverflow: null, medium: null, behance: null, dribbble: null },
};

export const resumeExampleEn: Resume = {
  meta: {
    schemaVersion: "1.0.0",
    language: "en",
    generatedAt: null,
  },
  personal: {
    name: "John Smith",
    email: "john@email.com",
    phone: null,
    location: { city: "New York", state: "NY", country: "United States" },
    linkedin: "https://linkedin.com/in/johnsmith",
    website: null,
    photo: null,
  },
  summary: "Full-stack developer with 5 years of experience in React and Node.js.",
  experience: [
    {
      company: "TechCorp",
      position: "Senior Developer",
      startDate: "2022-01",
      endDate: null,
      current: true,
      location: { city: "New York", state: "NY", country: "United States" },
      description: "Led a front-end team of 4 developers.",
      highlights: ["Migrated monolith to micro-frontends", "Reduced build time by 40%"],
    },
  ],
  education: [
    {
      institution: "MIT",
      degree: "Bachelor of Science",
      field: "Computer Science",
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
    soft: [{ name: "Leadership", level: "advanced" }],
  },
  languages: [
    { name: "Portuguese", proficiency: "native" },
    { name: "English", proficiency: "professional" },
  ],
  certifications: [],
  projects: [],
  volunteer: [],
  awards: [],
  publications: [],
  references: [],
  social: { github: null, twitter: null, stackoverflow: null, medium: null, behance: null, dribbble: null },
};

export function getResumeSystemPrompt(userData?: UserData, language: "pt" | "en" = "pt"): string {
  const context = buildContext(userData, language);
  const example = language === "en" ? resumeExampleEn : resumeExamplePt;

  return `
You are an API that generates structured JSON resumes.

CRITICAL: This resume MUST be written entirely in ${language === "en" ? "ENGLISH" : "PORTUGUESE (pt-BR)"}. Every text field — summary, descriptions, highlights, job titles, institution names, skill names, language names — must be in ${language === "en" ? "English" : "Portuguese"}. Only proper names (person names, company names, product names) may remain in their original language.

${context}

Your output MUST be a single JSON object conforming exactly to this schema:

${JSON.stringify(example, null, 2)}

CRITICAL RULES — follow these exactly or the output will be rejected:

1. **Use the provided user data first.** The "Known User Data" section above contains verified information from the user's profile and persona. Use it to fill in the resume. Only fall back to the free-text input for details not covered by the known data (like specific job descriptions, achievements, project details).
2. **Unknown fields must be null.** If a field is not mentioned in either the known data OR the free-text input, set it to null (not empty string, not undefined).
3. **Empty lists stay empty.** If no items are provided for a section, return []. Never remove the array property.
4. **Never remove properties from the schema.** Every property in the example must appear in your output, even if null/empty.
5. **Summarize long texts** keeping key context. Long descriptions should be distilled to 2-3 sentences.
6. **Language field (meta.language):** Always set to "${language}".
7. **ALL text content must be in ${language === "en" ? "English" : "Portuguese"}.** Translate any user-provided non-${language === "en" ? "English" : "Portuguese"} content. Degree names, skill labels, summaries, descriptions — everything.
8. **Dates** must be in YYYY-MM format. If only year is known, use YYYY. Current positions should have endDate: null and current: true.
9. **Skill levels** must be one of: beginner, intermediate, advanced, expert — ONLY if explicitly stated.
10. **Language proficiency** must be one of: basic, conversational, professional, native — ONLY if explicitly stated.
11. **Return ONLY the JSON object.** No markdown, no code fences, no explanation. Just the raw JSON.

If the free-text provides contradictory information, prefer the free-text (it may be an update).
`.trim();
}

function buildContext(userData?: UserData, language: "pt" | "en" = "pt"): string {
  if (!userData) return "";

  const isEn = language === "en";
  const lines: string[] = [isEn ? "## Known User Data (from profile)" : "## Dados do Usuário (do perfil)"];

  if (userData.name) lines.push(`- Name: ${userData.name}`);
  if (userData.email) lines.push(`- Email: ${userData.email}`);
  if (userData.currentRole) lines.push(`- Current role: ${userData.currentRole}`);
  if (userData.targetRole) lines.push(`- Target role: ${userData.targetRole}`);
  if (userData.yearsOfExperience != null) lines.push(`- Years of experience: ${userData.yearsOfExperience}`);
  if (userData.careerStage) lines.push(`- Career stage: ${userData.careerStage}`);
  if (userData.industries?.length) lines.push(`- Industries: ${userData.industries.join(", ")}`);
  if (userData.employmentStatus) lines.push(`- Employment status: ${userData.employmentStatus}`);
  if (userData.educationLevel) lines.push(`- Education level: ${userData.educationLevel}`);
  if (userData.fieldOfStudy) lines.push(`- Field of study: ${userData.fieldOfStudy}`);
  if (userData.certifications?.length) lines.push(`- Certifications: ${userData.certifications.join(", ")}`);
  if (userData.hardSkills?.length) lines.push(`- Hard skills: ${userData.hardSkills.join(", ")}`);
  if (userData.softSkills?.length) lines.push(`- Soft skills: ${userData.softSkills.join(", ")}`);
  if (userData.languages?.length) {
    const langStr = userData.languages.map((l) => `${l.name} (${l.proficiency})`).join(", ");
    lines.push(`- Languages: ${langStr}`);
  }
  if (userData.shortTermGoal) lines.push(`- Short-term goal: ${userData.shortTermGoal}`);
  if (userData.mediumTermGoal) lines.push(`- Medium-term goal: ${userData.mediumTermGoal}`);
  if (userData.longTermGoal) lines.push(`- Long-term goal: ${userData.longTermGoal}`);

  return lines.join("\n");
}
