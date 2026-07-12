import { ChatOpenAI } from "@langchain/openai";
import { SystemMessage, HumanMessage, AIMessage } from "@langchain/core/messages";
import { PromptBuilder } from "@/lib/prompt-builder";

const EMERGENCY_GUARDRAIL = 5000; // ponytail: hard cutoff only if model ignores the prompt

const promptBuilder = new PromptBuilder();

const model = new ChatOpenAI({
  model: "gpt-5-nano-2025-08-07",
  apiKey: process.env.OPENAI_API_KEY,
});

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

// ponytail: flat subset, only fields the coach prompt uses
export interface PersonaSnapshot {
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
  languages?: { language: string; proficiency: string }[];
  tools?: string[];
  weeklyStudyHours?: number;
  studySchedule?: string;
  preferredContentFormat?: string;
  shortTermGoal?: string;
  mediumTermGoal?: string;
  longTermGoal?: string;
  careerMotivation?: string;
  willingToRelocate?: boolean;
  remotePreference?: string;
}

export async function generateChatResponse(
  messages: ChatMessage[],
  persona?: PersonaSnapshot,
): Promise<string> {
  const systemPrompt = promptBuilder.buildCareerCoachSystemPrompt(persona);

  const response = await model.invoke([
    new SystemMessage(systemPrompt),
    ...messages.map((m) =>
      m.role === "user" ? new HumanMessage(m.content) : new AIMessage(m.content)
    ),
  ]);

  let content = (response.content as string) ?? "";

  // ponytail: trust the prompt for ~500 chars; emergency guardrail only
  if (content.length > EMERGENCY_GUARDRAIL) {
    content = content.slice(0, EMERGENCY_GUARDRAIL).trimEnd() + "…";
  }

  return content;
}
