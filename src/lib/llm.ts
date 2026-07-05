import { ChatOpenAI } from "@langchain/openai";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import {
  getUserPrompt,
  getSystemPrompt,
  getRoadmapSystemPrompt,
  getRoadmapUserPrompt,
  insightExample,
} from "./prompts";
import { IStep } from "@/models/CareerRoadmap";
import { IPersona } from "@/models/Persona";

type InsightRequestInput = {
  answers: Record<string, string>;
  manualDescription: string;
  persona?: IPersona | null;
};

const model = new ChatOpenAI({
  model: "gpt-5-nano-2025-08-07",
  // model: "gpt-5-mini", (5x more expensive but 15% faster)
  apiKey: process.env.OPENAI_API_KEY,
});

export const generateInsight = async ({
  answers,
  manualDescription,
  persona,
}: InsightRequestInput): Promise<string | null> => {
  const prompt = ChatPromptTemplate.fromMessages([
    ["system", getSystemPrompt()],
    ["user", getUserPrompt()],
  ]);

  const chain = prompt.pipe(model);

  const response = await chain.invoke({
    insightExample: JSON.stringify(insightExample, null, 2),
    answers: JSON.stringify(answers, null, 2),
    manualDescription: manualDescription || "N/A",
    personaContext: formatPersonaForPrompt(persona),
  });

  return response.content as string;
};

export const generateRoadmap = async (oldSteps: IStep[]): Promise<string | null> => {
  const systemPrompt = getRoadmapSystemPrompt();
  const userPrompt = getRoadmapUserPrompt();

  const prompt = ChatPromptTemplate.fromMessages([
    ["system", systemPrompt],
    ["user", userPrompt],
  ]);

  const chain = prompt.pipe(model);

  const steps = oldSteps.map((step) => ({
    step: step.step,
    title: step.title,
    description: step.description,
  }));

  const res = await chain.invoke({
    steps: JSON.stringify(steps, null, 2),
  });

  if (!res.content) {
    return null;
  }

  return res.content as string;
};

// ── persona → prompt formatter ─────────────────────────────────────────

export function formatPersonaForPrompt(persona?: IPersona | null): string {
  if (!persona) return "";

  const lines: string[] = [];

  // Career identity
  const roleParts: string[] = [];
  if (persona.currentRole) roleParts.push(persona.currentRole);
  if (persona.yearsOfExperience != null) roleParts.push(`${persona.yearsOfExperience} years`);
  if (roleParts.length)
    lines.push(
      `- Current role: ${roleParts.join(" (")}${persona.yearsOfExperience != null ? ")" : ""}`
    );
  if (persona.targetRole) lines.push(`- Target role: ${persona.targetRole}`);
  if (persona.careerStage) lines.push(`- Career stage: ${persona.careerStage}`);
  if (persona.industries?.length) lines.push(`- Industries: ${persona.industries.join(", ")}`);
  if (persona.employmentStatus) lines.push(`- Employment: ${persona.employmentStatus}`);

  // Education
  if (persona.educationLevel) lines.push(`- Education: ${persona.educationLevel}`);
  if (persona.fieldOfStudy) lines.push(`- Field of study: ${persona.fieldOfStudy}`);
  if (persona.certifications?.length)
    lines.push(`- Certifications: ${persona.certifications.join(", ")}`);
  if (persona.currentlyStudying) lines.push(`- Currently studying: yes`);

  // Skills
  if (persona.hardSkills?.length) lines.push(`- Hard skills: ${persona.hardSkills.join(", ")}`);
  if (persona.softSkills?.length) lines.push(`- Soft skills: ${persona.softSkills.join(", ")}`);
  if (persona.languages?.length) {
    const langStr = persona.languages.map((l) => `${l.language} (${l.proficiency})`).join(", ");
    lines.push(`- Languages: ${langStr}`);
  }
  if (persona.skillsGained?.length)
    lines.push(`- Previously gained skills: ${persona.skillsGained.join(", ")}`);

  // Routine
  if (persona.weeklyStudyHours != null)
    lines.push(`- Weekly study hours: ${persona.weeklyStudyHours}`);
  if (persona.studySchedule) lines.push(`- Study schedule: ${persona.studySchedule}`);

  // Goals
  if (persona.shortTermGoal) lines.push(`- Short-term goal: ${persona.shortTermGoal}`);
  if (persona.mediumTermGoal) lines.push(`- Medium-term goal: ${persona.mediumTermGoal}`);
  if (persona.longTermGoal) lines.push(`- Long-term goal: ${persona.longTermGoal}`);
  if (persona.careerMotivation) lines.push(`- Motivation: ${persona.careerMotivation}`);
  if (persona.targetSalary) {
    lines.push(
      `- Target salary: ${persona.targetSalary.amount} ${persona.targetSalary.currency}/${persona.targetSalary.period}`
    );
  }

  // Progress
  if (persona.completedRoadmaps != null)
    lines.push(`- Completed roadmaps: ${persona.completedRoadmaps}`);
  if (persona.insightsGenerated != null)
    lines.push(`- Insights generated: ${persona.insightsGenerated}`);

  if (!lines.length) return "";

  return `User Profile:\n${lines.join("\n")}`;
}
