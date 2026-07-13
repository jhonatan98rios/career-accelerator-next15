import { ChatOpenAI } from "@langchain/openai";
import { SystemMessage, HumanMessage, AIMessage } from "@langchain/core/messages";
import { PromptBuilder } from "@/lib/prompt-builder";

const EMERGENCY_GUARDRAIL = 5000; // ponytail: hard cutoff only if model ignores the prompt

const promptBuilder = new PromptBuilder();

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

export async function* generateChatResponse(
  messages: ChatMessage[],
  persona?: PersonaSnapshot,
): AsyncGenerator<string> {
  const systemPrompt = promptBuilder.buildCareerCoachSystemPrompt(persona);

  // ponytail: per-request model avoids stale connections from module-level singleton
  const model = new ChatOpenAI({
    model: "gpt-5-nano-2025-08-07",
    apiKey: process.env.OPENAI_API_KEY,
  });

  const stream = await model.stream([
    new SystemMessage(systemPrompt),
    ...messages.map((m) =>
      m.role === "user" ? new HumanMessage(m.content) : new AIMessage(m.content)
    ),
  ]);

  let total = 0;
  for await (const chunk of stream) {
    const token = (chunk.content as string) ?? "";

    // [DIAGNOSTIC] verify LangChain stream yields tokens incrementally
    console.log("[chat-service] token", {
      time: Date.now(),
      length: token.length,
      content: token.slice(0, 80),
    });

    if (!token) continue;

    if (total >= EMERGENCY_GUARDRAIL) break;

    const remaining = EMERGENCY_GUARDRAIL - total;
    const safe = token.length > remaining ? token.slice(0, remaining) + "…" : token;

    total += safe.length;
    yield safe;

    if (safe.endsWith("…")) break;
  }
}
