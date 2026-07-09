import type { Resume } from "../resume/schema";

// ── Dates ───────────────────────────────────────────────────────────────

const MONTHS: Record<string, Record<string, string>> = {
  pt: {
    "01": "Jan", "02": "Fev", "03": "Mar", "04": "Abr",
    "05": "Mai", "06": "Jun", "07": "Jul", "08": "Ago",
    "09": "Set", "10": "Out", "11": "Nov", "12": "Dez",
  },
  en: {
    "01": "Jan", "02": "Feb", "03": "Mar", "04": "Apr",
    "05": "May", "06": "Jun", "07": "Jul", "08": "Aug",
    "09": "Sep", "10": "Oct", "11": "Nov", "12": "Dec",
  },
};

/** Format date string (YYYY-MM or YYYY) to human-readable. Returns null-safe. */
export function formatDate(date: string | null, lang: string): string {
  if (!date) return "";
  const parts = date.split("-");
  if (parts.length === 1) return parts[0];
  const months = MONTHS[lang] ?? MONTHS.en;
  const month = months[parts[1]] ?? parts[1];
  return `${month} ${parts[0]}`;
}

/** Date range string: "Jan 2020 – Present" or "Jan 2020 – Dez 2022" */
export function formatDateRange(
  start: string | null,
  end: string | null,
  current: boolean | undefined,
  lang: string,
): string {
  const startStr = formatDate(start, lang);
  const endStr = current
    ? (lang === "pt" ? "Presente" : "Present")
    : formatDate(end, lang);
  if (!startStr && !endStr) return "";
  if (!startStr) return endStr;
  if (!endStr) return startStr;
  return `${startStr} — ${endStr}`;
}

// ── Phone ───────────────────────────────────────────────────────────────
export function formatPhone(phone: string | null): string {
  if (!phone) return "";
  // ponytail: basic brazilian formatting
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 11) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  }
  if (digits.length === 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return phone;
}

// ── Address ─────────────────────────────────────────────────────────────
export function formatLocation(
  loc: Resume["personal"]["location"],
): string {
  if (!loc) return "";
  const parts = [loc.city, loc.state, loc.country].filter(Boolean);
  return parts.join(", ");
}

// ── Links ───────────────────────────────────────────────────────────────
export function cleanUrl(url: string | null): string {
  if (!url) return "";
  return url.replace(/^https?:\/\//, "");
}

// ── Icons (unicode, works in Word) ──────────────────────────────────────
export const ICONS: Record<string, string> = {
  // Using simple ASCII/unicode that Word renders well
  phone: "📞",
  email: "✉",
  location: "📍",
  linkedin: "🔗",
  website: "🌐",
  github: "🐙",
  calendar: "📅",
  pin: "▶",
};

// ── Section ordering ────────────────────────────────────────────────────

export type ExperienceSort = "date-desc" | "date-asc";

export function sortExperiences(
  exp: Resume["experience"],
  direction: ExperienceSort = "date-desc",
): Resume["experience"] {
  const sorted = [...exp];
  sorted.sort((a, b) => {
    const aDate = a.startDate ?? "0000-00";
    const bDate = b.startDate ?? "0000-00";
    return direction === "date-desc"
      ? bDate.localeCompare(aDate)
      : aDate.localeCompare(bDate);
  });
  return sorted;
}

export function sortEducation(
  edu: Resume["education"],
  direction: ExperienceSort = "date-desc",
): Resume["education"] {
  const sorted = [...edu];
  sorted.sort((a, b) => {
    const aDate = a.startDate ?? "0000-00";
    const bDate = b.startDate ?? "0000-00";
    return direction === "date-desc"
      ? bDate.localeCompare(aDate)
      : aDate.localeCompare(bDate);
  });
  return sorted;
}

// ── Page breaks ─────────────────────────────────────────────────────────
import { PageBreak } from "docx";

/** Returns a PageBreak paragraph or null. */
export function optionalPageBreak(condition: boolean = true): typeof PageBreak | null {
  return condition ? PageBreak : null;
}

// ── Has content check ───────────────────────────────────────────────────
export function hasContent(arr: unknown[] | null | undefined): boolean {
  return Array.isArray(arr) && arr.length > 0;
}
