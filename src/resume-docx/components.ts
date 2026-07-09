import {
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  BorderStyle,
  AlignmentType,
  HeadingLevel,
  WidthType,
} from "docx";
import type { Resume } from "../resume/schema";
import type { Template, DocxComponent, DocxElement } from "./types";
import { formatDateRange, formatPhone, formatLocation, cleanUrl, ICONS } from "./helpers";

// ── Shared factories ────────────────────────────────────────────────────

/** Create a TextRun with template styling. */
function run(text: string, t: Template, opts: { bold?: boolean; color?: string; size?: number; italics?: boolean } = {}): TextRun {
  return new TextRun({
    text,
    font: t.fonts.body,
    size: opts.size ?? 20, // half-points, 20 = 10pt
    bold: opts.bold ?? false,
    color: opts.color ?? t.colors.text,
    italics: opts.italics ?? false,
  });
}

/** Heading run (larger, colored, bold). */
function headingRun(text: string, t: Template): TextRun {
  return new TextRun({
    text,
    font: t.fonts.heading,
    size: 24, // 12pt
    bold: true,
    color: t.colors.primary,
  });
}

/** Create an empty spacing paragraph. */
function spacer(gap: number): Paragraph {
  return new Paragraph({ spacing: { before: gap, after: 0 } });
}

// ── Header ──────────────────────────────────────────────────────────────

export function headerComponent(resume: Resume, t: Template): DocxComponent {
  const { personal } = resume;

  const contactParts: string[] = [];
  if (personal.email) contactParts.push(`✉ ${personal.email}`);
  if (personal.phone) contactParts.push(`📞 ${formatPhone(personal.phone)}`);
  if (personal.location) contactParts.push(`📍 ${formatLocation(personal.location)}`);
  if (personal.linkedin) contactParts.push(`🔗 ${cleanUrl(personal.linkedin)}`);
  if (personal.website) contactParts.push(`🌐 ${cleanUrl(personal.website)}`);

  if (t.headerStyle === "bar") {
    // Colored bar with white text
    const namePara = new Paragraph({
      spacing: { before: 0, after: 80 },
      shading: { fill: t.colors.primary, type: "clear" },
      children: [
        new TextRun({
          text: personal.name,
          font: t.fonts.heading,
          size: 44, // 22pt
          bold: true,
          color: t.colors.white,
        }),
      ],
    });

    const contactPara = contactParts.length > 0
      ? new Paragraph({
          spacing: { before: 80, after: 200 },
          children: [
            run(contactParts.join("  |  "), t, { color: t.colors.muted, size: 18 }),
          ],
        })
      : spacer(t.spacing.sectionGap);

    return [namePara, contactPara];
  }

  // Centered header
  const namePara = new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 0, after: 40 },
    children: [
      new TextRun({
        text: personal.name,
        font: t.fonts.heading,
        size: 48, // 24pt
        bold: true,
        color: t.colors.primary,
      }),
    ],
  });

  const contactPara = contactParts.length > 0
    ? new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 40, after: 200 },
        children: [
          run(contactParts.join("  |  "), t, { color: t.colors.muted, size: 18 }),
        ],
      })
    : spacer(t.spacing.sectionGap);

  return [namePara, contactPara];
}

// ── Section Title ───────────────────────────────────────────────────────

export function sectionTitleComponent(title: string, t: Template): DocxComponent {
  const icon = t.showIcons ? ICONS.pin + " " : "";
  const children: TextRun[] = [headingRun(icon + title, t)];

  const para = new Paragraph({
    spacing: { before: t.spacing.sectionGap, after: t.spacing.after + 40 },
    ...(t.sectionUnderline && {
      border: {
        bottom: { color: t.colors.primary, space: 4, style: BorderStyle.SINGLE, size: 6 },
      },
    }),
    children,
  });

  return [para];
}

// ── Summary Paragraph ───────────────────────────────────────────────────

export function summaryComponent(summary: string | null, t: Template): DocxComponent {
  if (!summary) return [];
  return [
    new Paragraph({
      spacing: { before: 0, after: t.spacing.after },
      children: [run(summary, t)],
    }),
  ];
}

// ── BulletList ──────────────────────────────────────────────────────────

export function bulletListComponent(items: string[], t: Template): DocxComponent {
  return items.map((item) =>
    new Paragraph({
      spacing: { before: 0, after: t.spacing.after },
      indent: { left: 360 },
      children: [
        run(t.bullet + " ", t, { color: t.colors.primary }),
        run(item, t),
      ],
    }),
  );
}

// ── SkillList ───────────────────────────────────────────────────────────

export function skillListComponent(
  skills: Resume["skills"],
  t: Template,
): DocxComponent {
  const all = [
    ...skills.hard.map((s) => ({ name: s.name, level: s.level, type: "Hard" })),
    ...skills.soft.map((s) => ({ name: s.name, level: s.level, type: "Soft" })),
  ];

  if (all.length === 0) return [];

  // ponytail: 3-column table for skills
  const chunkSize = Math.ceil(all.length / 3);
  const columns: typeof all[] = [[], [], []];
  all.forEach((s, i) => {
    columns[Math.floor(i / chunkSize) % 3].push(s);
  });

  const rows = Math.max(...columns.map((c) => c.length));
  const tableRows: TableRow[] = [];

  for (let i = 0; i < rows; i++) {
    tableRows.push(
      new TableRow({
        children: columns.map((col) => {
          const skill = col[i];
          return new TableCell({
            width: { size: 33, type: WidthType.PERCENTAGE },
            children: skill
              ? [
                  new Paragraph({
                    spacing: { before: 0, after: 20 },
                    children: [
                      run(skill.name, t, { bold: true, size: 18 }),
                      skill.level
                        ? run(`  (${skill.level})`, t, { color: t.colors.muted, size: 16, italics: true })
                        : new TextRun({ text: "" }),
                    ],
                  }),
                ]
              : [new Paragraph({ children: [] })],
          });
        }),
      }),
    );
  }

  return [
    new Table({
      rows: tableRows,
      width: { size: 100, type: WidthType.PERCENTAGE },
    }),
  ];
}

// ── Experience Card ─────────────────────────────────────────────────────

export function experienceCardComponent(
  exp: Resume["experience"][number],
  t: Template,
): DocxComponent {
  const results: DocxComponent = [];

  // Position + company
  results.push(
    new Paragraph({
      spacing: { before: 60, after: 20 },
      children: [
        run(exp.position, t, { bold: true }),
        run(`  —  ${exp.company}`, t, { color: t.colors.secondary }),
      ],
    }),
  );

  // Date + location
  const dateRange = formatDateRange(exp.startDate, exp.endDate, exp.current, "pt");
  const locStr = formatLocation(exp.location);
  const subInfo = [dateRange, locStr].filter(Boolean).join("  |  ");
  if (subInfo) {
    results.push(
      new Paragraph({
        spacing: { before: 0, after: 20 },
        children: [run(subInfo, t, { color: t.colors.muted, size: 18, italics: true })],
      }),
    );
  }

  // Description
  if (exp.description) {
    results.push(
      new Paragraph({
        spacing: { before: 0, after: t.spacing.after },
        children: [run(exp.description, t)],
      }),
    );
  }

  // Highlights
  results.push(...bulletListComponent(exp.highlights, t));

  return results;
}

// ── Education Card ──────────────────────────────────────────────────────

export function educationCardComponent(
  edu: Resume["education"][number],
  t: Template,
): DocxComponent {
  const results: DocxComponent = [];

  results.push(
    new Paragraph({
      spacing: { before: 60, after: 20 },
      children: [
        run(`${edu.degree} em ${edu.field}`, t, { bold: true }),
      ],
    }),
  );

  const dateRange = formatDateRange(edu.startDate, edu.endDate, false, "pt");
  const subInfo = [edu.institution, dateRange].filter(Boolean).join("  |  ");
  results.push(
    new Paragraph({
      spacing: { before: 0, after: 20 },
      children: [run(subInfo, t, { color: t.colors.muted, size: 18, italics: true })],
    }),
  );

  if (edu.gpa) {
    results.push(
      new Paragraph({
        spacing: { before: 0, after: t.spacing.after },
        children: [run(`GPA: ${edu.gpa}`, t)],
      }),
    );
  }

  if (edu.description) {
    results.push(
      new Paragraph({
        spacing: { before: 0, after: t.spacing.after },
        children: [run(edu.description, t)],
      }),
    );
  }

  return results;
}

// ── Project Card ────────────────────────────────────────────────────────

export function projectCardComponent(
  proj: Resume["projects"][number],
  t: Template,
): DocxComponent {
  const results: DocxComponent = [];

  results.push(
    new Paragraph({
      spacing: { before: 60, after: 20 },
      children: [
        run(proj.name, t, { bold: true }),
        proj.url
          ? run(`  (${cleanUrl(proj.url)})`, t, { color: t.colors.primary, size: 18 })
          : new TextRun({ text: "" }),
      ],
    }),
  );

  const dateRange = formatDateRange(proj.startDate, proj.endDate, false, "pt");
  if (dateRange) {
    results.push(
      new Paragraph({
        spacing: { before: 0, after: 20 },
        children: [run(dateRange, t, { color: t.colors.muted, size: 18, italics: true })],
      }),
    );
  }

  if (proj.description) {
    results.push(
      new Paragraph({
        spacing: { before: 0, after: t.spacing.after },
        children: [run(proj.description, t)],
      }),
    );
  }

  results.push(...bulletListComponent(proj.highlights, t));

  return results;
}

// ── Certification Card ──────────────────────────────────────────────────

export function certificationCardComponent(
  cert: Resume["certifications"][number],
  t: Template,
): DocxComponent {
  const results: DocxComponent = [];

  results.push(
    new Paragraph({
      spacing: { before: 60, after: 20 },
      children: [
        run(cert.name, t, { bold: true }),
      ],
    }),
  );

  const dateStr = formatDateRange(cert.date, null, false, "pt");
  const subInfo = [cert.issuer, dateStr].filter(Boolean).join("  |  ");
  if (subInfo) {
    results.push(
      new Paragraph({
        spacing: { before: 0, after: t.spacing.after },
        children: [run(subInfo, t, { color: t.colors.muted, size: 18, italics: true })],
      }),
    );
  }

  return results;
}

// ── Language Card ───────────────────────────────────────────────────────

export function languageCardComponent(
  lang: Resume["languages"][number],
  t: Template,
): DocxComponent {
  return [
    new Paragraph({
      spacing: { before: 0, after: 20 },
      children: [
        run(`${lang.name}`, t, { bold: true }),
        lang.proficiency
          ? run(`  —  ${lang.proficiency}`, t, { color: t.colors.muted, size: 18, italics: true })
          : new TextRun({ text: "" }),
      ],
    }),
  ];
}

// ── Reference Card ──────────────────────────────────────────────────────

export function referenceCardComponent(
  ref: Resume["references"][number],
  t: Template,
): DocxComponent {
  const results: DocxComponent = [];

  results.push(
    new Paragraph({
      spacing: { before: 60, after: 20 },
      children: [run(ref.name, t, { bold: true })],
    }),
  );

  const parts = [ref.relationship, ref.email, ref.phone].filter(Boolean) as string[];
  if (parts.length > 0) {
    results.push(
      new Paragraph({
        spacing: { before: 0, after: t.spacing.after },
        children: [run(parts.join("  |  "), t, { color: t.colors.muted, size: 18 })],
      }),
    );
  }

  return results;
}

// ── Divider ─────────────────────────────────────────────────────────────

export function dividerComponent(t: Template): DocxComponent {
  return [
    new Paragraph({
      spacing: { before: 40, after: 40 },
      border: {
        bottom: { color: t.colors.secondary, space: 4, style: BorderStyle.SINGLE, size: 2 },
      },
      children: [],
    }),
  ];
}

// ── Footer ──────────────────────────────────────────────────────────────

export function footerComponent(t: Template): DocxComponent {
  return [
    new Paragraph({
      spacing: { before: 400, after: 0 },
      alignment: AlignmentType.CENTER,
      children: [
        run("Gerado por Career Accelerator", t, { color: t.colors.muted, size: 16, italics: true }),
      ],
    }),
  ];
}
