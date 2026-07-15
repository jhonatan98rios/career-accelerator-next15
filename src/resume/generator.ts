import { ChatOpenAI } from "@langchain/openai";
import { SystemMessage, HumanMessage } from "@langchain/core/messages";
import { getResumeSystemPrompt, type UserData } from "./prompts";
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
export async function generate(input: string, userData?: UserData, language: "pt" | "en" = "pt"): Promise<GenerateResult> {
  console.warn("[resume] step=start inputLength=%d hasUserData=%s", input.length, userData != null);

  // 1. LLM call — use raw messages to avoid LangChain template-parsing the JSON schema
  let raw: string;
  try {
    console.warn("[resume] step=llm-call");
    const response = await model.invoke([
      new SystemMessage(getResumeSystemPrompt(userData, language)),
      new HumanMessage(input),
    ]);
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

  // 4. Sanitize — strip entries where required fields are null
  const obj = parsed as Record<string, unknown>;
  sanitize(obj);
  console.warn("[resume] step=sanitize-done");

  // 5. Zod validation
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

  // 6. Normalize
  console.warn("[resume] step=normalize");
  const normalized = normalize(result.data);
  console.warn("[resume] step=done");

  return { ok: true, data: normalized };
}

/**
 * Strip array entries where required fields are null (common LLM artifact).
 * Mutates in place — runs before Zod validation.
 */
function sanitize(obj: Record<string, unknown>): void {
  // ponytail: filter arrays by checking if all required fields are non-null strings
  const requiredArrays: Array<{ key: string; required: string[] }> = [
    { key: "experience", required: ["company", "position"] },
    { key: "education", required: ["institution", "degree", "field"] },
    { key: "projects", required: ["name"] },
    { key: "certifications", required: ["name"] },
    { key: "languages", required: ["name"] },
    { key: "volunteer", required: ["organization", "role"] },
    { key: "awards", required: ["title"] },
    { key: "publications", required: ["title"] },
    { key: "references", required: ["name"] },
  ];

  for (const { key, required } of requiredArrays) {
    const arr = obj[key];
    if (!Array.isArray(arr)) continue;
    obj[key] = arr.filter((item: Record<string, unknown>) =>
      required.every((f) => typeof item[f] === "string" && item[f].trim().length > 0),
    );
  }

  // Skills: filter individual skill entries
  const skills = obj["skills"] as Record<string, unknown> | undefined;
  if (skills) {
    for (const cat of ["hard", "soft"]) {
      const arr = skills[cat];
      if (Array.isArray(arr)) {
        skills[cat] = arr.filter(
          (s: Record<string, unknown>) => typeof s.name === "string" && s.name.trim().length > 0,
        );
      }
    }
  }
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
