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
  const langName = language === "en" ? "English" : "Portuguese";

  return `
You are an expert resume writer and ATS (Applicant Tracking System) optimization specialist. Your job is to produce a professional, keyword-rich resume that maximizes the candidate's chances of being selected — both by AI screening tools and by human recruiters.

CRITICAL: This resume MUST be written entirely in ${language === "en" ? "ENGLISH" : "PORTUGUESE (pt-BR)"}. Every text field — summary, descriptions, highlights, job titles, institution names, skill names, language names — must be in ${langName}. Only proper names (person names, company names, product names) may remain in their original language.

${context}

## How to use the persona data

The "Career direction" fields (short/medium/long-term goals) are provided ONLY as context to help you understand the candidate's ambitions and target trajectory. Use them to:
- Infer the right professional tone and seniority level for the summary
- Identify which skills and experiences to emphasize
- Understand which industries and role types the candidate is targeting

But DO NOT quote, paraphrase, or embed these goals in the resume. They are private context, not resume content.

## ATS Keyword Optimization

To ensure the resume ranks well in AI-powered job matching systems:
1. Extract key technical terms, tools, methodologies, and industry jargon from the candidate's skills, experience, target role, and industries.
2. Weave these keywords naturally into the summary, experience descriptions, and highlights — never as a standalone keyword dump.
3. Use both full terms and common acronyms where appropriate (e.g., "Natural Language Processing (NLP)").
4. Mirror standard industry job titles and skill names as they appear in job descriptions.
5. Prioritize keywords from the target role and industries — these are what recruiters will search for.

## What to NEVER include in a resume

These items damage credibility and are NEVER appropriate in a professional resume. The output will be rejected if they appear:

- Salary expectations, compensation ranges, or desired pay ("starting at \$5,000/month", "R\$10k+ CLT")
- Personal life goals or entrepreneurial ambitions ("I want to build my own AI company", "quero abrir minha própria startup")
- Self-assessments like "fast learner", "self-taught", "hard worker", "passionate" — demonstrate skills through achievements, not adjectives
- Age, marital status, photo descriptions, religious or political affiliations
- Reasons for leaving previous jobs or employment gaps explanations
- First-person pronouns (I, me, my, we) — use implied first person or third person consistently
- Generic filler like "responsible for", "worked on", "helped with" — use action verbs (Led, Built, Designed, Optimized, Delivered)

## Professional Summary Guidelines

The summary is the most-read section. Make it count:
- Lead with current role + years of experience + primary domain (e.g., "Senior Full-Stack Developer with 7 years of experience in fintech and SaaS platforms")
- Follow with top 2-3 technical strengths relevant to the target role
- Close with the type of impact or role the candidate is targeting (e.g., "Seeking senior engineering roles in high-growth startups")
- Keep it to 2-4 sentences. No fluff.

## Experience Guidelines

- Lead each bullet with a strong action verb and quantify results when possible (numbers, percentages, time saved)
- Focus on impact and outcomes, not just responsibilities
- Tailor highlights to the target role and industries when possible

## Output Format

Your output MUST be a single JSON object conforming exactly to this schema:

${JSON.stringify(example, null, 2)}

CRITICAL RULES — follow these exactly or the output will be rejected:

1. **Use the provided user data first.** The "${language === "en" ? "User Profile Data" : "Dados do Usuário"}" section above contains verified information. Use it to fill in the resume. Only fall back to the free-text input for details not covered (like specific job descriptions, achievements, project details).
2. **Unknow fields must be null.** If a field is not in the data or free-text, set it to null (not empty string, not undefined).
3. **Empty lists stay empty.** If no items for a section, return []. Never remove the array property.
4. **Never remove properties from the schema.** Every property must appear even if null/empty.
5. **Summarize long texts** to 2-3 sentences preserving key context.
6. **meta.language:** Always set to "${language}".
7. **ALL text in ${langName}.** Translate any non-${langName} content. Degree names, skill labels, summaries, descriptions — everything.
8. **Dates** in YYYY-MM format. Year-only = YYYY. Current positions: endDate: null, current: true.
9. **Skill levels:** beginner, intermediate, advanced, expert — only if explicitly stated.
10. **Language proficiency:** basic, conversational, professional, native — only if explicitly stated.
11. **Return ONLY the JSON object.** No markdown, no code fences, no explanation.

If the free-text provides contradictory information, prefer the free-text (it may be an update).
`.trim();
}

function buildContext(userData?: UserData, language: "pt" | "en" = "pt"): string {
  if (!userData) return "";

  const isEn = language === "en";

  // ── Profile data (use directly in resume) ──
  const profileLines: string[] = [];
  if (userData.name) profileLines.push(`- ${isEn ? "Name" : "Nome"}: ${userData.name}`);
  if (userData.email) profileLines.push(`- ${isEn ? "Email" : "Email"}: ${userData.email}`);
  if (userData.currentRole) profileLines.push(`- ${isEn ? "Current role" : "Cargo atual"}: ${userData.currentRole}`);
  if (userData.targetRole) profileLines.push(`- ${isEn ? "Target role" : "Cargo alvo"}: ${userData.targetRole}`);
  if (userData.yearsOfExperience != null) profileLines.push(`- ${isEn ? "Years of experience" : "Anos de experiência"}: ${userData.yearsOfExperience}`);
  if (userData.careerStage) profileLines.push(`- ${isEn ? "Career stage" : "Estágio da carreira"}: ${userData.careerStage}`);
  if (userData.industries?.length) profileLines.push(`- ${isEn ? "Industries" : "Setores"}: ${userData.industries.join(", ")}`);
  if (userData.employmentStatus) profileLines.push(`- ${isEn ? "Employment status" : "Situação profissional"}: ${userData.employmentStatus}`);
  if (userData.educationLevel) profileLines.push(`- ${isEn ? "Education level" : "Nível de educação"}: ${userData.educationLevel}`);
  if (userData.fieldOfStudy) profileLines.push(`- ${isEn ? "Field of study" : "Área de estudo"}: ${userData.fieldOfStudy}`);
  if (userData.certifications?.length) profileLines.push(`- ${isEn ? "Certifications" : "Certificações"}: ${userData.certifications.join(", ")}`);
  if (userData.hardSkills?.length) profileLines.push(`- ${isEn ? "Hard skills" : "Hard skills"}: ${userData.hardSkills.join(", ")}`);
  if (userData.softSkills?.length) profileLines.push(`- ${isEn ? "Soft skills" : "Soft skills"}: ${userData.softSkills.join(", ")}`);
  if (userData.languages?.length) {
    const langStr = userData.languages.map((l) => `${l.name} (${l.proficiency})`).join(", ");
    profileLines.push(`- ${isEn ? "Languages" : "Idiomas"}: ${langStr}`);
  }

  // ── Career direction (context only — do NOT include in resume text) ──
  const directionLines: string[] = [];
  if (userData.shortTermGoal) directionLines.push(`- ${isEn ? "Short-term" : "Curto prazo"}: ${userData.shortTermGoal}`);
  if (userData.mediumTermGoal) directionLines.push(`- ${isEn ? "Medium-term" : "Médio prazo"}: ${userData.mediumTermGoal}`);
  if (userData.longTermGoal) directionLines.push(`- ${isEn ? "Long-term" : "Longo prazo"}: ${userData.longTermGoal}`);

  const parts: string[] = [];
  if (profileLines.length > 0) {
    parts.push(
      (isEn ? "## User Profile Data (use directly)" : "## Dados do Usuário (usar diretamente)") +
      "\n" + profileLines.join("\n"),
    );
  }
  if (directionLines.length > 0) {
    parts.push(
      (isEn
        ? "## Career Direction (CONTEXT ONLY — do NOT quote or include in resume. Use to infer seniority, target roles, and industry focus)"
        : "## Direção de Carreira (APENAS CONTEXTO — NÃO citar nem incluir no currículo. Use para inferir senioridade, cargos alvo e foco de indústria)") +
      "\n" + directionLines.join("\n"),
    );
  }

  return parts.join("\n\n");
}
