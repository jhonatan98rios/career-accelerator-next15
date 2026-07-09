import { Document, Packer, Paragraph, TextRun } from "docx";
import type { Resume } from "../resume/schema";
import type { Template, SectionKey } from "./types";
import { modern, classic, ats, academic } from "./templates";
import { sortExperiences, sortEducation, hasContent } from "./helpers";
import {
  headerComponent,
  sectionTitleComponent,
  summaryComponent,
  skillListComponent,
  experienceCardComponent,
  educationCardComponent,
  projectCardComponent,
  certificationCardComponent,
  languageCardComponent,
  referenceCardComponent,
  footerComponent,
} from "./components";

// ── Template registry ───────────────────────────────────────────────────

const TEMPLATES: Record<string, Template> = {
  modern,
  classic,
  ats,
  academic,
};

// ── Section label (localized) ───────────────────────────────────────────

const LABELS: Record<string, Record<SectionKey, string>> = {
  pt: {
    summary: "Resumo",
    experience: "Experiência Profissional",
    education: "Formação Acadêmica",
    skills: "Habilidades",
    languages: "Idiomas",
    certifications: "Certificações",
    projects: "Projetos",
    volunteer: "Voluntariado",
    awards: "Premiações",
    publications: "Publicações",
    references: "Referências",
  },
  en: {
    summary: "Summary",
    experience: "Professional Experience",
    education: "Education",
    skills: "Skills",
    languages: "Languages",
    certifications: "Certifications",
    projects: "Projects",
    volunteer: "Volunteer Experience",
    awards: "Awards",
    publications: "Publications",
    references: "References",
  },
};

// ── Renderer ────────────────────────────────────────────────────────────

export type TemplateName = "modern" | "classic" | "ats" | "academic";

export async function render(
  resume: Resume,
  templateName: TemplateName = "modern",
): Promise<Buffer> {
  const t = TEMPLATES[templateName] ?? TEMPLATES.modern;
  const lang = resume.meta.language ?? "pt";
  const labels = LABELS[lang] ?? LABELS.pt;

  // Build sections according to template order
  const children: (Paragraph | import("docx").Table)[] = [];

  // 1. Header (always first)
  children.push(...headerComponent(resume, t));

  // 2. Sections in template-defined order
  const sortedExperience = sortExperiences(resume.experience);
  const sortedEducation = sortEducation(resume.education);

  for (const section of t.sectionOrder) {
    const sectionElements = buildSection(
      section,
      labels[section],
      resume,
      t,
      sortedExperience,
      sortedEducation,
    );

    if (sectionElements.length > 0) {
      children.push(...sectionElements);
    }
  }

  // 3. Footer
  children.push(...footerComponent(t));

  // Assemble document
  const doc = new Document({
    styles: {
      default: {
        document: {
          run: {
            font: t.fonts.body,
            size: 20, // 10pt
          },
        },
      },
    },
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 720,    // 0.5 inch
              bottom: 720,
              left: 720,
              right: 720,
            },
          },
        },
        children,
      },
    ],
  });

  return Buffer.from(await Packer.toBuffer(doc));
}

// ── Section builder ─────────────────────────────────────────────────────

function buildSection(
  section: SectionKey,
  title: string,
  resume: Resume,
  t: Template,
  sortedExp: Resume["experience"],
  sortedEdu: Resume["education"],
): (Paragraph | import("docx").Table)[] {
  const elements: (Paragraph | import("docx").Table)[] = [];

  switch (section) {
    case "summary": {
      if (!resume.summary) return [];
      elements.push(...sectionTitleComponent(title, t));
      elements.push(...summaryComponent(resume.summary, t));
      break;
    }

    case "experience": {
      if (!hasContent(resume.experience)) return [];
      elements.push(...sectionTitleComponent(title, t));
      for (const exp of sortedExp) {
        elements.push(...experienceCardComponent(exp, t));
      }
      break;
    }

    case "education": {
      if (!hasContent(resume.education)) return [];
      elements.push(...sectionTitleComponent(title, t));
      for (const edu of sortedEdu) {
        elements.push(...educationCardComponent(edu, t));
      }
      break;
    }

    case "skills": {
      const hard = resume.skills?.hard ?? [];
      const soft = resume.skills?.soft ?? [];
      if (hard.length === 0 && soft.length === 0) return [];
      elements.push(...sectionTitleComponent(title, t));
      elements.push(...skillListComponent(resume.skills, t));
      break;
    }

    case "languages": {
      if (!hasContent(resume.languages)) return [];
      elements.push(...sectionTitleComponent(title, t));
      for (const lang of resume.languages) {
        elements.push(...languageCardComponent(lang, t));
      }
      break;
    }

    case "certifications": {
      if (!hasContent(resume.certifications)) return [];
      elements.push(...sectionTitleComponent(title, t));
      for (const cert of resume.certifications) {
        elements.push(...certificationCardComponent(cert, t));
      }
      break;
    }

    case "projects": {
      if (!hasContent(resume.projects)) return [];
      elements.push(...sectionTitleComponent(title, t));
      for (const proj of resume.projects) {
        elements.push(...projectCardComponent(proj, t));
      }
      break;
    }

    case "volunteer": {
      if (!hasContent(resume.volunteer)) return [];
      elements.push(...sectionTitleComponent(title, t));
      for (const vol of resume.volunteer) {
        elements.push(...experienceCardComponent(vol, t)); // ponytail: reuse experience card
      }
      break;
    }

    case "awards": {
      if (!hasContent(resume.awards)) return [];
      elements.push(...sectionTitleComponent(title, t));
      for (const award of resume.awards) {
        // ponytail: reuse cert card, award.title maps to cert.name
        elements.push(
          ...certificationCardComponent(
            { name: award.title, issuer: award.issuer, date: award.date, url: null },
            t,
          ),
        );
        if (award.description) {
          elements.push(
            new Paragraph({
              spacing: { before: 0, after: t.spacing.after },
              children: [
                new TextRun({
                  text: award.description,
                  font: t.fonts.body,
                  size: 20,
                  color: t.colors.text,
                }),
              ],
            }),
          );
        }
      }
      break;
    }

    case "publications": {
      if (!hasContent(resume.publications)) return [];
      elements.push(...sectionTitleComponent(title, t));
      for (const pub of resume.publications) {
        elements.push(
          ...certificationCardComponent(
            { name: pub.title, issuer: pub.publisher, date: pub.date, url: pub.url },
            t,
          ),
        );
        if (pub.description) {
          elements.push(
            new Paragraph({
              spacing: { before: 0, after: t.spacing.after },
              children: [
                new TextRun({
                  text: pub.description,
                  font: t.fonts.body,
                  size: 20,
                  color: t.colors.text,
                }),
              ],
            }),
          );
        }
      }
      break;
    }

    case "references": {
      if (!hasContent(resume.references)) return [];
      elements.push(...sectionTitleComponent(title, t));
      for (const ref of resume.references) {
        elements.push(...referenceCardComponent(ref, t));
      }
      break;
    }
  }

  return elements;
}
