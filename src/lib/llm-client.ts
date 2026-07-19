import { ChatOpenAI, type ChatOpenAIFields } from "@langchain/openai";

/**
 * Centralized LLM client factory.
 * All call sites go through here — change provider in one place.
 *
 * ponytail: ChatOpenAI works with DeepSeek because their API is OpenAI-compatible.
 */
export function createModel(overrides?: Partial<ChatOpenAIFields>): ChatOpenAI {
  return new ChatOpenAI({
    model: "deepseek-v4-flash",
    apiKey: process.env.DEEPSEEK_API_KEY || process.env.OPENAI_API_KEY,
    configuration: { baseURL: "https://api.deepseek.com/v1" },
    ...overrides,
  });
}
