import type {
  Paragraph,
  Table,
  IRunOptions,
  IParagraphOptions,
} from "docx";

// ── Component ───────────────────────────────────────────────────────────
/** Every component returns an array of docx primitive elements. */
export type DocxElement = Paragraph | Table;
export type DocxComponent = DocxElement[];

// ── Template config ─────────────────────────────────────────────────────
export interface TemplateColors {
  primary: string;       // headings, accents
  secondary: string;     // subtitles, borders
  text: string;          // body text
  muted: string;         // dates, locations
  background: string;    // header backgrounds
  white: string;         // text on dark backgrounds
}

export interface TemplateFonts {
  heading: string;
  body: string;
}

export interface TemplateSpacing {
  after: number;         // default spacing after paragraph
  sectionGap: number;    // extra spacing before section headings
}

/** Defines the order in which resume sections are laid out, top to bottom. */
export type SectionKey =
  | "summary"
  | "experience"
  | "education"
  | "skills"
  | "languages"
  | "certifications"
  | "projects"
  | "volunteer"
  | "awards"
  | "publications"
  | "references";

export interface Template {
  name: string;
  fonts: TemplateFonts;
  colors: TemplateColors;
  spacing: TemplateSpacing;
  sectionOrder: SectionKey[];
  /** Show icons (unicode) next to section titles */
  showIcons: boolean;
  /** Header style: "bar" = colored bar with name, "centered" = centered text */
  headerStyle: "bar" | "centered";
  /** Border under section titles */
  sectionUnderline: boolean;
  /** Bullet character for highlights */
  bullet: string;
}

// ── Shared run/text helpers ─────────────────────────────────────────────
export interface StyledRun extends IRunOptions {
  text: string;
}

export interface StyledParagraph extends IParagraphOptions {}
