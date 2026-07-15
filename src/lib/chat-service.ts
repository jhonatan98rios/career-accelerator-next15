import { ChatOpenAI } from "@langchain/openai";
import { SystemMessage, HumanMessage, AIMessage } from "@langchain/core/messages";
import { PromptBuilder } from "@/lib/prompt-builder";

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

  const modelOptions: Record<string, unknown> = {
    model: "gpt-5-nano-2025-08-07",
    apiKey: process.env.OPENAI_API_KEY,
  };

  // ponytail: OpenAI enforces max_tokens on the server side — actually protects cost
  if (maxTokens != null && maxTokens > 0) {
    modelOptions.maxTokens = maxTokens;
  }

  // ponytail: per-request model avoids stale connections from module-level singleton
  const model = new ChatOpenAI(modelOptions);

  const stream = await model.stream([
    new SystemMessage(systemPrompt),
    ...messages.map((m) =>
      m.role === "user" ? new HumanMessage(m.content) : new AIMessage(m.content)
    ),
  ]);

  for await (const chunk of stream) {
    // OpenAI returns usage_metadata on the final chunk
    const meta = (chunk as any).usage_metadata;
    if (meta && out) {
      out.usage = {
        promptTokens: meta.input_tokens,
        completionTokens: meta.output_tokens,
        totalTokens: meta.total_tokens,
      };
    }

    const token = (chunk.content as string) ?? "";

    // [DIAGNOSTIC] verify LangChain stream yields tokens incrementally
    console.log("[chat-service] token", {
      time: Date.now(),
      length: token.length,
      content: token.slice(0, 80),
    });

    if (!token) continue;

    yield token;
  }
}
