import { ChatOpenAI } from "@langchain/openai";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { getResumeSystemPrompt } from "./prompts";
import { validate } from "./validator";
import { normalize } from "./normalizer";
import type { Resume } from "./schema";

const model = new ChatOpenAI({
  model: "gpt-5-nano-2025-08-07",
  apiKey: process.env.OPENAI_API_KEY,
});

export type GenerateResult =
  | { ok: true; data: Resume }
  | { ok: false; error: string };

/**
 * Generate a validated, normalized Resume from free-text input.
 *
 * Flow: input → LLM → JSON parse → Zod validate → normalize → Resume
 */
export async function generate(input: string): Promise<GenerateResult> {
  // 1. LLM call
  const prompt = ChatPromptTemplate.fromMessages([
    ["system", getResumeSystemPrompt()],
    ["user", "{input}"],
  ]);

  const chain = prompt.pipe(model);

  let raw: string;
  try {
    const response = await chain.invoke({ input });
    raw = (response.content as string) ?? "";
  } catch (err) {
    return { ok: false, error: `LLM call failed: ${err instanceof Error ? err.message : String(err)}` };
  }

  // 2. Extract JSON from possible markdown fences
  const json = extractJSON(raw);
  if (!json) {
    return { ok: false, error: "LLM response doesn't contain valid JSON" };
  }

  // 3. Parse JSON
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    return { ok: false, error: "Failed to parse LLM output as JSON" };
  }

  // 4. Zod validation
  const result = validate(parsed);
  if (!result.ok) {
    return {
      ok: false,
      error: `Validation failed:\n${result.errors.map((e) => `  - ${e.path}: ${e.message}`).join("\n")}`,
    };
  }

  // 5. Normalize
  const normalized = normalize(result.data);

  return { ok: true, data: normalized };
}

/**
 * Extract a JSON object from text that may be wrapped in ```json fences.
 */
function extractJSON(raw: string): string | null {
  const trimmed = raw.trim();

  // Try markdown code fence: ```json ... ```
  const fenceMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) {
    return fenceMatch[1].trim();
  }

  // ponytail: find outermost { ... }
  const firstBrace = trimmed.indexOf("{");
  const lastBrace = trimmed.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    return trimmed.slice(firstBrace, lastBrace + 1);
  }

  return null;
}
