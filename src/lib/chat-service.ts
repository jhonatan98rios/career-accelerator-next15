import OpenAI from "openai";
import { PromptBuilder } from "@/lib/prompt-builder";

const promptBuilder = new PromptBuilder();

// ponytail: per-request client avoids stale connections
function getClient(): OpenAI {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

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

export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export async function* generateChatResponse(
  messages: ChatMessage[],
  persona?: PersonaSnapshot,
  out?: { usage?: TokenUsage },
  maxTokens?: number,
): AsyncGenerator<string> {
  const systemPrompt = promptBuilder.buildCareerCoachSystemPrompt(persona);

  // ponytail: skip LangChain streaming abstractions, call OpenAI SSE directly.
  // The IterableReadableStream + _streamIterator double-wrapping was buffering
  // tokens until the stream completed.
  const openai = getClient();

  const stream = await openai.chat.completions.create({
    model: "gpt-5-nano-2025-08-07",
    max_completion_tokens: maxTokens != null && maxTokens > 0 ? maxTokens : undefined,
    stream: true,
    stream_options: { include_usage: true },
    messages: [
      { role: "system", content: systemPrompt },
      ...messages.map((m) => ({ role: m.role, content: m.content })),
    ],
  });

  for await (const chunk of stream) {
    const choice = chunk.choices?.[0];
    if (!choice) continue;

    // usage comes in a dedicated chunk when include_usage is set
    if (chunk.usage && out) {
      out.usage = {
        promptTokens: chunk.usage.prompt_tokens,
        completionTokens: chunk.usage.completion_tokens,
        totalTokens: chunk.usage.total_tokens,
      };
    }

    const token = choice.delta?.content ?? "";
    if (!token) continue;

    yield token;
  }
}
