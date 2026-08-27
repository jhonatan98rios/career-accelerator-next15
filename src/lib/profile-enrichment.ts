// src/lib/profile-enrichment.ts
//
// ponytail: single-purpose additive enrichment — one extra LLM call fired in
// parallel with insight generation. It only ADDS data the user's own inputs
// (questionnaire answers + persona) reveal about their professional profile;
// it never overwrites user-written text. No chat tool-calling, no UI.
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { createModel } from "@/lib/llm-client";
import {
  ProfessionalProfile,
  type IProfessionalProfile,
  type IExperienceItem,
} from "@/models/ProfessionalProfile";
import type { IPersona } from "@/models/Persona";
import {
  MAX_SECTION_CHARS,
  MAX_EXPERIENCE_ITEMS,
  MAX_EXPERIENCE_TITLE_CHARS,
  MAX_EXPERIENCE_PERIOD_CHARS,
  MAX_EXPERIENCE_DESCRIPTION_CHARS,
  formatProfessionalProfileForPrompt,
} from "@/lib/professional-profile";
import { formatPersonaForPrompt } from "@/lib/llm";
import { validateUserInput } from "@/lib/prompt-guard";
import { log, LogLevel } from "@/lib/logger";

export type EnrichmentInput = {
  profileId: string | import("mongoose").Types.ObjectId;
  answers: Record<string, string>;
  manualDescription: string;
  persona?: IPersona | null;
};

export type EnrichmentExtraction = {
  who?: string;
  goals?: string;
  experience?: IExperienceItem[];
};

const SYSTEM_PROMPT = `Você é um assistente que mantém o perfil profissional de um usuário.
Você recebe os dados de carreira do usuário (respostas do questionário, descrição manual e perfil de usuário) e o perfil profissional atual.
Tarefa: identificar informações RELEVANTES para o perfil profissional que ainda NÃO estão presentes nele.
Regras:
- Inclua APENAS dados explicitamente presentes nos dados fornecidos. NÃO invente, não infira, não generalize.
- "who": texto corrido sobre quem o usuário é profissionalmente (função atual, área, nível). Se estiver vazio, escreva um resumo. Se já tiver conteúdo e os dados novos o enriquecem, retorne a versão COMPLETA ATUALIZADA (conteúdo atual + melhorias). Se não quiser alterar o conteúdo atual, OMITA o campo.
- "goals": idem — se vazio, escreva; se enriquecer, retorne a versão COMPLETA ATUALIZADA; se não, OMITA.
- "experience": itens de experiência (title, period, description). Inclua APENAS itens cujo título ainda não existe no perfil atual.
- Se não houver nada novo, retorne {}.
Responda SOMENTE com JSON válido, sem markdown.`;

const USER_PROMPT = `Dados de carreira:
- Respostas do questionário: {answers}
- Descrição manual: {manualDescription}

{personaContext}

Perfil profissional atual:
{profileContext}

Campos bloqueados (editados pelo usuário, NÃO alterar): {lockedFields}

Extraia as informações novas e relevantes para o perfil profissional.`;

/**
 * Parses and validates the model's JSON response. Strips markdown fences if
 * the model wraps the payload, caps every field to the same limits used by
 * the manual edit action, and drops anything that fails the prompt-injection
 * scan. Returns an empty extraction when nothing usable was found.
 */
export function parseEnrichmentResponse(raw: string): EnrichmentExtraction {
  const cleaned = raw
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "");
  if (!cleaned) return {};

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    return {};
  }
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) return {};

  const obj = parsed as Record<string, unknown>;
  const result: EnrichmentExtraction = {};

  const cleanSection = (value: unknown, max: number): string | undefined => {
    if (typeof value !== "string") return undefined;
    const text = value.trim().slice(0, max);
    if (!text) return undefined;
    if (!validateUserInput(text).ok) return undefined;
    return text;
  };

  result.who = cleanSection(obj.who, MAX_SECTION_CHARS);
  result.goals = cleanSection(obj.goals, MAX_SECTION_CHARS);

  if (Array.isArray(obj.experience)) {
    const items: IExperienceItem[] = [];
    for (const item of obj.experience.slice(0, MAX_EXPERIENCE_ITEMS)) {
      if (typeof item !== "object" || item === null) continue;
      const raw = item as Record<string, unknown>;
      const title = cleanSection(raw.title, MAX_EXPERIENCE_TITLE_CHARS);
      if (!title) continue;
      const period = cleanSection(raw.period, MAX_EXPERIENCE_PERIOD_CHARS) ?? "";
      const description = cleanSection(raw.description, MAX_EXPERIENCE_DESCRIPTION_CHARS) ?? "";
      items.push({ title, period, description });
    }
    if (items.length) result.experience = items;
  }

  return result;
}

function normalizeTitle(title: string): string {
  return title.trim().toLowerCase().replace(/\s+/g, " ");
}

/**
 * Builds the additive MongoDB update for the current profile.
 *
 * who/goals: fully blocked when the user manually edited them
 * (whoEditedByUser/goalsEditedByUser). Otherwise the extracted value is the
 * COMPLETE updated version (current text + enrichment) and overwrites the
 * field; identical text is skipped. experience: items are appended only when
 * their normalized title is not already present.
 */
export function buildEnrichmentUpdate(
  current: Pick<
    IProfessionalProfile,
    "who" | "experience" | "goals" | "whoEditedByUser" | "goalsEditedByUser"
  > | null,
  extracted: EnrichmentExtraction
): { $set: Record<string, string>; $push?: Record<string, unknown> } {
  const $set: Record<string, string> = {};
  const $push: Record<string, unknown> = {};

  const currentWho = current?.who?.trim() ?? "";
  const currentGoals = current?.goals?.trim() ?? "";
  const existingTitles = new Set(
    (current?.experience ?? []).map((item) => normalizeTitle(item.title ?? ""))
  );

  if (extracted.who && !current?.whoEditedByUser && extracted.who !== currentWho) {
    $set.who = extracted.who;
  }
  if (extracted.goals && !current?.goalsEditedByUser && extracted.goals !== currentGoals) {
    $set.goals = extracted.goals;
  }

  const newItems = (extracted.experience ?? []).filter(
    (item) => !existingTitles.has(normalizeTitle(item.title))
  );
  if (newItems.length) $push.experience = { $each: newItems };

  return Object.keys($push).length ? { $set, $push } : { $set };
}

/**
 * Runs the enrichment pass: one parallel LLM request asking which data from
 * the insight inputs is relevant to the profile but missing from it, then an
 * additive write. Best-effort — logs and returns false on any failure, never
 * throws, so the insight generation is unaffected.
 */
export async function enrichProfessionalProfile({
  profileId,
  answers,
  manualDescription,
  persona,
}: EnrichmentInput): Promise<boolean> {
  try {
    let current: IProfessionalProfile | null = null;
    try {
      current = await ProfessionalProfile.findOne({ profile_id: profileId });
    } catch {
      current = null;
    }

    // ponytail: response_format via modelKwargs — not a typed field in this
    // langchain version; modelKwargs merges straight into the API body.
    const model = createModel({ modelKwargs: { response_format: { type: "json_object" } } });
    const prompt = ChatPromptTemplate.fromMessages([
      ["system", SYSTEM_PROMPT],
      ["user", USER_PROMPT],
    ]);
    const lockedFields =
      [current?.whoEditedByUser ? "who" : null, current?.goalsEditedByUser ? "goals" : null]
        .filter(Boolean)
        .join(", ") || "nenhum";

    const response = await prompt.pipe(model).invoke({
      answers: JSON.stringify(answers ?? {}, null, 2),
      manualDescription: manualDescription?.trim() || "N/A",
      personaContext: formatPersonaForPrompt(persona),
      profileContext: formatProfessionalProfileForPrompt(current) || "(vazio)",
      lockedFields,
    });

    const extracted = parseEnrichmentResponse(response.content as string);
    const hasContent = extracted.who || extracted.goals || (extracted.experience?.length ?? 0) > 0;

    if (!hasContent) {
      await log(LogLevel.INFO, "Profile enrichment: nothing new to add", { profileId });
      return false;
    }

    const update = buildEnrichmentUpdate(current, extracted);
    if (!Object.keys(update.$set).length && !update.$push) {
      await log(LogLevel.INFO, "Profile enrichment: nothing new to add", { profileId });
      return false;
    }

    await ProfessionalProfile.findOneAndUpdate({ profile_id: profileId }, update, {
      upsert: true,
      setDefaultsOnInsert: true,
    });

    await log(LogLevel.INFO, "Profile enrichment: applied additive update", {
      profileId,
      set: Object.keys(update.$set),
      pushed: update.$push?.experience ? "experience" : undefined,
    });
    return true;
  } catch (err) {
    await log(LogLevel.WARN, "Profile enrichment: failed, insight unaffected", {
      error: err instanceof Error ? err.message : String(err),
    });
    return false;
  }
}
