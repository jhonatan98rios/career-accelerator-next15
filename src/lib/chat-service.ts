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
    streaming: true,
    streamUsage: true,
  };

  // ponytail: OpenAI enforces max_tokens on the server side — actually protects cost
  if (maxTokens != null && maxTokens > 0) {
    modelOptions.maxTokens = maxTokens;
  }

  // ponytail: per-request model avoids stale connections from module-level singleton
  const model = new ChatOpenAI(modelOptions);

  // ponytail: bypass IterableReadableStream wrapper from model.stream() —
  // the double ReadableStream wrapping (LangChain → ours) can buffer.
  // _streamIterator yields AIMessageChunks directly from the OpenAI SSE.
  for await (const chunk of (model as any)._streamIterator([
    new SystemMessage(systemPrompt),
    ...messages.map((m) =>
      m.role === "user" ? new HumanMessage(m.content) : new AIMessage(m.content)
    ),
  ])) {
    const meta = (chunk as any).usage_metadata;
    if (meta && out) {
      out.usage = {
        promptTokens: meta.input_tokens,
        completionTokens: meta.output_tokens,
        totalTokens: meta.total_tokens,
      };
    }

    const token = (chunk.content as string) ?? "";
    if (!token) continue;

    yield token;
  }
}
