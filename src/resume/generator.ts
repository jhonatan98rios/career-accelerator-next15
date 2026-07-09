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
  console.warn("[resume] step=start inputLength=%d", input.length);

  // 1. LLM call
  const prompt = ChatPromptTemplate.fromMessages([
    ["system", getResumeSystemPrompt()],
    ["user", "{input}"],
  ]);

  const chain = prompt.pipe(model);

  let raw: string;
  try {
    console.warn("[resume] step=llm-call");
    const response = await chain.invoke({ input });
    raw = (response.content as string) ?? "";
    console.warn("[resume] step=llm-done rawLength=%d", raw.length);
  } catch (err) {
    console.error("[resume] step=llm-failed", err);
    return { ok: false, error: `LLM call failed: ${err instanceof Error ? err.message : String(err)}` };
  }

  // 2. Extract JSON from possible markdown fences
  const json = extractJSON(raw);
  if (!json) {
    console.error("[resume] step=extract-json-failed raw=%s", raw.slice(0, 500));
    return { ok: false, error: "LLM response doesn't contain valid JSON" };
  }
  console.warn("[resume] step=extract-json-done jsonLength=%d", json.length);

  // 3. Parse JSON
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
    console.warn("[resume] step=parse-json-done");
  } catch {
    console.error("[resume] step=parse-json-failed json=%s", json.slice(0, 500));
    return { ok: false, error: "Failed to parse LLM output as JSON" };
  }

  // 4. Zod validation
  console.warn("[resume] step=validate");
  const result = validate(parsed);
  if (!result.ok) {
    console.error("[resume] step=validate-failed errors=%o", result.errors);
    return {
      ok: false,
      error: `Validation failed:\n${result.errors.map((e) => `  - ${e.path}: ${e.message}`).join("\n")}`,
    };
  }
  console.warn("[resume] step=validate-done");

  // 5. Normalize
  console.warn("[resume] step=normalize");
  const normalized = normalize(result.data);
  console.warn("[resume] step=done");

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
