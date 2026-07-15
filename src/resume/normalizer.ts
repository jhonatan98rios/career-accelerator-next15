import type { Resume } from "./schema";

/**
 * ponytail: single-pass normalize — strip whitespace, convert empties to null,
 * ensure arrays, normalize date strings.
 */
export function normalize(input: Resume): Resume {
  return {
    ...input,
    meta: {
      ...input.meta,
      language: input.meta.language || "pt",
      generatedAt: input.meta.generatedAt ?? null,
    },
    personal: {
      ...input.personal,
      name: cleanStr(input.personal.name),
      email: cleanStr(input.personal.email),
      phone: cleanStr(input.personal.phone),
      linkedin: cleanStr(input.personal.linkedin),
      website: cleanStr(input.personal.website),
      photo: cleanStr(input.personal.photo),
      location: input.personal.location
        ? {
            city: cleanStr(input.personal.location.city),
            state: cleanStr(input.personal.location.state),
            country: cleanStr(input.personal.location.country),
          }
        : null,
    },
    summary: cleanStr(input.summary),
    experience: ensureArray(input.experience).map((e) => ({
      ...e,
      company: e.company.trim(),
      position: e.position.trim(),
      location: e.location
        ? {
            city: cleanStr(e.location.city),
            state: cleanStr(e.location.state),
            country: cleanStr(e.location.country),
          }
        : null,
      description: cleanStr(e.description),
      highlights: ensureArray(e.highlights).map((h) => h.trim()).filter(Boolean),
      startDate: cleanStr(e.startDate),
      endDate: cleanStr(e.endDate),
    })),
    education: ensureArray(input.education).map((e) => ({
      ...e,
      institution: e.institution.trim(),
      degree: e.degree.trim(),
      field: e.field.trim(),
      gpa: cleanStr(e.gpa),
      description: cleanStr(e.description),
      startDate: cleanStr(e.startDate),
      endDate: cleanStr(e.endDate),
    })),
    skills: {
      hard: ensureArray(input.skills?.hard).map((s) => ({
        name: s.name.trim(),
        level: s.level ?? null,
      })),
      soft: ensureArray(input.skills?.soft).map((s) => ({
        name: s.name.trim(),
        level: s.level ?? null,
      })),
    },
    languages: ensureArray(input.languages).map((l) => ({
      name: l.name.trim(),
      proficiency: l.proficiency ?? null,
    })),
    certifications: ensureArray(input.certifications).map((c) => ({
      ...c,
      name: c.name.trim(),
      issuer: cleanStr(c.issuer),
      date: cleanStr(c.date),
      url: cleanStr(c.url),
    })),
    projects: ensureArray(input.projects).map((p) => ({
      ...p,
      name: p.name.trim(),
      description: cleanStr(p.description),
      url: cleanStr(p.url),
      highlights: ensureArray(p.highlights).map((h) => h.trim()).filter(Boolean),
      startDate: cleanStr(p.startDate),
      endDate: cleanStr(p.endDate),
    })),
    volunteer: ensureArray(input.volunteer).map((v) => ({
      ...v,
      organization: v.organization.trim(),
      role: v.role.trim(),
      description: cleanStr(v.description),
      startDate: cleanStr(v.startDate),
      endDate: cleanStr(v.endDate),
    })),
    awards: ensureArray(input.awards).map((a) => ({
      ...a,
      title: a.title.trim(),
      issuer: cleanStr(a.issuer),
      date: cleanStr(a.date),
      description: cleanStr(a.description),
    })),
    publications: ensureArray(input.publications).map((p) => ({
      ...p,
      title: p.title.trim(),
      publisher: cleanStr(p.publisher),
      date: cleanStr(p.date),
      url: cleanStr(p.url),
      description: cleanStr(p.description),
    })),
    references: ensureArray(input.references).map((r) => ({
      ...r,
      name: r.name.trim(),
      relationship: cleanStr(r.relationship),
      email: cleanStr(r.email),
      phone: cleanStr(r.phone),
    })),
    social: {
      github: cleanStr(input.social?.github),
      twitter: cleanStr(input.social?.twitter),
      stackoverflow: cleanStr(input.social?.stackoverflow),
      medium: cleanStr(input.social?.medium),
      behance: cleanStr(input.social?.behance),
      dribbble: cleanStr(input.social?.dribbble),
    },
  };
}

// ── helpers ─────────────────────────────────────────────────────────────

/** Trim + empty-to-null. */
function cleanStr(val: string | null | undefined): string | null {
  if (val == null) return null;
  const trimmed = val.trim();
  return trimmed === "" ? null : trimmed;
}

/** Ensure value is an array. */
function ensureArray<T>(val: T[] | null | undefined): T[] {
  return Array.isArray(val) ? val : [];
}
