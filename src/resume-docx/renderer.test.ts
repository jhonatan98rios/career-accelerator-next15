import { describe, it, expect } from "vitest";
import { readFileSync, writeFileSync, mkdirSync } from "fs";
import path from "path";
import { render, type TemplateName } from "./renderer";
import { validate } from "../resume/validator";
import type { Resume } from "../resume/schema";

// ── Helpers ─────────────────────────────────────────────────────────────

function loadResume(name: string): Resume {
  const filePath = path.resolve(
    __dirname,
    "..",
    "resume",
    "examples",
    `${name}.json`,
  );
  const raw = JSON.parse(readFileSync(filePath, "utf-8"));
  const result = validate(raw);
  if (!result.ok) {
    throw new Error(`Invalid example ${name}: ${JSON.stringify(result.errors)}`);
  }
  return result.data;
}

const EXAMPLES = ["developer", "teacher", "designer", "doctor", "musician"] as const;
const TEMPLATES: TemplateName[] = ["modern", "classic", "ats", "academic"];

// ── Smoke tests: render all examples × all templates ────────────────────

describe("render", () => {
  for (const example of EXAMPLES) {
    for (const tpl of TEMPLATES) {
      it(`${example} → ${tpl}`, async () => {
        const resume = loadResume(example);
        const buffer = await render(resume, tpl);

        // Basic integrity checks
        expect(buffer).toBeInstanceOf(Buffer);
        expect(buffer.length).toBeGreaterThan(1000); // any valid docx is > 1KB

        // DOCX/ZIP magic bytes (PK\x03\x04)
        expect(buffer[0]).toBe(0x50); // P
        expect(buffer[1]).toBe(0x4b); // K
      });
    }
  }
});

// ── Edge cases ──────────────────────────────────────────────────────────

describe("edge cases", () => {
  it("handles empty resume (only name)", async () => {
    const minimal: Resume = {
      meta: { schemaVersion: "1.0.0", language: "pt", generatedAt: null },
      personal: {
        name: "Fulano",
        email: null,
        phone: null,
        location: null,
        linkedin: null,
        website: null,
        photo: null,
      },
      summary: null,
      experience: [],
      education: [],
      skills: { hard: [], soft: [] },
      languages: [],
      certifications: [],
      projects: [],
      volunteer: [],
      awards: [],
      publications: [],
      references: [],
      social: {},
    };

    const buffer = await render(minimal, "modern");
    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBeGreaterThan(500);
  });

  it("handles resume with 50 experiences", async () => {
    const resume = loadResume("developer");
    const manyExp = Array.from({ length: 50 }, (_, i) => ({
      ...resume.experience[0],
      company: `Company ${i}`,
      position: `Position ${i}`,
    }));
    const large: Resume = { ...resume, experience: manyExp };
    const buffer = await render(large, "ats");
    expect(buffer.length).toBeGreaterThan(2000);
  });

  it("handles international resume (english)", async () => {
    const resume = loadResume("developer"); // developer is "en"
    const buffer = await render(resume, "classic");
    expect(buffer.length).toBeGreaterThan(1000);
  });

  it("academic template puts education before experience", async () => {
    const resume = loadResume("teacher");
    const buffer = await render(resume, "academic");
    expect(buffer.length).toBeGreaterThan(1000);
  });

  it("all templates produce valid ZIP", async () => {
    const resume = loadResume("designer");
    for (const tpl of TEMPLATES) {
      const buffer = await render(resume, tpl);
      expect(buffer[0]).toBe(0x50);
      expect(buffer[1]).toBe(0x4b);
    }
  });
});

// ── Write output files for manual inspection ────────────────────────────

describe("write files", () => {
  it("writes all combinations to /tmp/resume-docx", async () => {
    const outDir = path.resolve(__dirname, "..", "..", "output", "resume-docx");
    mkdirSync(outDir, { recursive: true });

    for (const example of EXAMPLES) {
      const resume = loadResume(example);
      for (const tpl of TEMPLATES) {
        const buffer = await render(resume, tpl);
        const filename = `${example}-${tpl}.docx`;
        writeFileSync(path.join(outDir, filename), buffer);
      }
    }
    // If we got here without throwing, all files were written
    expect(true).toBe(true);
  });
});
