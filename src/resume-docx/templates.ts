import type { Template } from "../types";

// ── Modern ──────────────────────────────────────────────────────────────
// ponytail: modern = blue bar header, clean sans-serif, compact
export const modern: Template = {
  name: "modern",
  fonts: {
    heading: "Calibri",
    body: "Calibri",
  },
  colors: {
    primary: "1F4E79",
    secondary: "2E75B6",
    text: "333333",
    muted: "666666",
    background: "1F4E79",
    white: "FFFFFF",
  },
  spacing: {
    after: 60,
    sectionGap: 200,
  },
  sectionOrder: [
    "summary",
    "experience",
    "education",
    "skills",
    "certifications",
    "languages",
    "projects",
    "volunteer",
    "awards",
    "publications",
    "references",
  ],
  showIcons: true,
  headerStyle: "bar",
  sectionUnderline: true,
  bullet: "▸",
};

// ── Classic ─────────────────────────────────────────────────────────────
// ponytail: classic = centered, serif headings, traditional
export const classic: Template = {
  name: "classic",
  fonts: {
    heading: "Georgia",
    body: "Georgia",
  },
  colors: {
    primary: "222222",
    secondary: "444444",
    text: "222222",
    muted: "666666",
    background: "222222",
    white: "FFFFFF",
  },
  spacing: {
    after: 80,
    sectionGap: 240,
  },
  sectionOrder: [
    "summary",
    "experience",
    "education",
    "skills",
    "languages",
    "certifications",
    "projects",
    "volunteer",
    "awards",
    "publications",
    "references",
  ],
  showIcons: false,
  headerStyle: "centered",
  sectionUnderline: true,
  bullet: "•",
};

// ── ATS Friendly ────────────────────────────────────────────────────────
// ponytail: ATS = no icons, no columns, single font, plain black
export const ats: Template = {
  name: "ats",
  fonts: {
    heading: "Arial",
    body: "Arial",
  },
  colors: {
    primary: "000000",
    secondary: "000000",
    text: "000000",
    muted: "000000",
    background: "000000",
    white: "FFFFFF",
  },
  spacing: {
    after: 100,
    sectionGap: 200,
  },
  sectionOrder: [
    "summary",
    "experience",
    "education",
    "skills",
    "certifications",
    "languages",
    "projects",
    "volunteer",
    "awards",
    "publications",
    "references",
  ],
  showIcons: false,
  headerStyle: "centered",
  sectionUnderline: false,
  bullet: "-",
};

// ── Academic ────────────────────────────────────────────────────────────
// ponytail: academic = reversed order: publications/awards first, formal
export const academic: Template = {
  name: "academic",
  fonts: {
    heading: "Times New Roman",
    body: "Times New Roman",
  },
  colors: {
    primary: "2C3E50",
    secondary: "34495E",
    text: "2C3E50",
    muted: "7F8C8D",
    background: "2C3E50",
    white: "FFFFFF",
  },
  spacing: {
    after: 100,
    sectionGap: 240,
  },
  sectionOrder: [
    "summary",
    "education",
    "publications",
    "awards",
    "experience",
    "projects",
    "skills",
    "certifications",
    "languages",
    "volunteer",
    "references",
  ],
  showIcons: false,
  headerStyle: "bar",
  sectionUnderline: true,
  bullet: "•",
};
