"use server";

import { auth0 } from "@/lib/auth0";
import { connectDB } from "@/lib/db";
import { Profile } from "@/models/Profile";
import { ProfessionalProfile, IExperienceItem } from "@/models/ProfessionalProfile";
import {
  MAX_SECTION_CHARS,
  MAX_EXPERIENCE_ITEMS,
  MAX_EXPERIENCE_TITLE_CHARS,
  MAX_EXPERIENCE_PERIOD_CHARS,
  MAX_EXPERIENCE_DESCRIPTION_CHARS,
} from "@/lib/professional-profile";
import { validateUserInput } from "@/lib/prompt-guard";
import { log, LogLevel } from "@/lib/logger";

interface SavePatch {
  who?: string;
  goals?: string;
  experience?: IExperienceItem[];
}

function checkInput(text: string, maxChars: number, label: string): string {
  const trimmed = text.trim();
  if (!trimmed) throw new Error(`O campo ${label} não pode ficar vazio.`);
  if (trimmed.length > maxChars) {
    throw new Error(`O campo ${label} excede o limite de ${maxChars} caracteres.`);
  }
  const check = validateUserInput(trimmed);
  if (!check.ok) throw new Error(check.error);
  return trimmed;
}

/**
 * Saves manual user edits to the professional profile. Only the provided
 * fields are updated. Experience is validated per item; empty items are
 * dropped.
 */
export async function saveProfessionalProfile(patch: SavePatch) {
  const session = await auth0.getSession();
  if (!session) {
    await log(LogLevel.ERROR, "saveProfessionalProfile: User authentication failed");
    throw new Error("User authentication failed");
  }

  const $set: Record<string, unknown> = {};

  if (patch.who !== undefined) {
    $set.who = checkInput(patch.who, MAX_SECTION_CHARS, "Quem sou eu");
  }

  if (patch.goals !== undefined) {
    $set.goals = checkInput(patch.goals, MAX_SECTION_CHARS, "O que pretendo fazer");
  }

  if (patch.experience !== undefined) {
    if (!Array.isArray(patch.experience)) throw new Error("Experiência inválida.");
    if (patch.experience.length > MAX_EXPERIENCE_ITEMS) {
      throw new Error(`Máximo de ${MAX_EXPERIENCE_ITEMS} itens de experiência.`);
    }

    const items: IExperienceItem[] = [];
    for (const item of patch.experience) {
      const title = item.title?.trim() ?? "";
      if (!title) continue; // drop empty rows
      if (title.length > MAX_EXPERIENCE_TITLE_CHARS) {
        throw new Error(`Título excede o limite de ${MAX_EXPERIENCE_TITLE_CHARS} caracteres.`);
      }
      const period = (item.period?.trim() ?? "").slice(0, MAX_EXPERIENCE_PERIOD_CHARS);
      const description = (item.description?.trim() ?? "").slice(
        0,
        MAX_EXPERIENCE_DESCRIPTION_CHARS
      );
      const check = validateUserInput(`${title} ${period} ${description}`);
      if (!check.ok) throw new Error(check.error);
      items.push({ title, period, description });
    }
    $set.experience = items;
  }

  if (Object.keys($set).length === 0) {
    throw new Error("Nada para salvar.");
  }

  await connectDB();
  const user = await Profile.findOne({ email: session.user.email });
  if (!user) {
    throw new Error("Usuário não encontrado.");
  }

  await ProfessionalProfile.findOneAndUpdate(
    { profile_id: user._id },
    { $set },
    { upsert: true, setDefaultsOnInsert: true }
  );

  return { ok: true };
}
