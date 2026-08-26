import type { IProfessionalProfile } from "@/models/ProfessionalProfile";

// ── Limits ─────────────────────────────────────────────────────────────

export const MAX_SECTION_CHARS = 10_000;
export const MAX_EXPERIENCE_ITEMS = 30;
export const MAX_EXPERIENCE_TITLE_CHARS = 200;
export const MAX_EXPERIENCE_PERIOD_CHARS = 100;
export const MAX_EXPERIENCE_DESCRIPTION_CHARS = 2_000;

// ── Prompt formatter ───────────────────────────────────────────────────
// Renders the professional profile as natural-language context for LLM
// generation flows (insight, resume, chat). Empty sections are skipped so
// sparse profiles add no prompt noise (same policy as persona).

export function formatProfessionalProfileForPrompt(
  profile: Pick<IProfessionalProfile, "who" | "experience" | "goals"> | null
): string {
  if (!profile) return "";

  const parts: string[] = [];

  const who = profile.who?.trim();
  const goals = profile.goals?.trim();
  const experience = Array.isArray(profile.experience) ? profile.experience : [];

  if (who) {
    parts.push(`Quem sou eu:\n${who}`);
  }

  const experienceLines = experience
    .map((item) => {
      const title = item.title?.trim();
      if (!title) return "";
      const period = item.period?.trim();
      const description = item.description?.trim();
      let line = `- ${title}${period ? ` (${period})` : ""}`;
      if (description) line += `: ${description}`;
      return line;
    })
    .filter(Boolean);

  if (experienceLines.length) {
    parts.push(`Experiência profissional:\n${experienceLines.join("\n")}`);
  }

  if (goals) {
    parts.push(`O que pretendo fazer:\n${goals}`);
  }

  return parts.join("\n\n");
}
