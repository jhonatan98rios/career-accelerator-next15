// Derives the job search keyword used for the mercado-de-trabalho insight.
// Pure helper extracted from the insight route so tests can import it without
// pulling the whole route module.
export function deriveJobSearchKeyword(
  targetRole?: string,
  hardSkills?: string[],
  currentRole?: string
): string | undefined {
  const keyword = targetRole || hardSkills?.[0] || currentRole;
  if (!keyword) return undefined;
  // Keep full role phrase ("AI Engineer" -> "ai engineer"); split only on list separators like "," or "/"
  return keyword.split(/[,/]+/)[0].toLowerCase().trim();
}
