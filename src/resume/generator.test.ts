/// <reference types="vitest" />
import { describe, it, expect } from "vitest";
import { validate } from "./validator";
import { normalize } from "./normalizer";
import { ResumeSchema, type Resume } from "./schema";
import { readFileSync } from "fs";
import path from "path";

// ── Helpers ─────────────────────────────────────────────────────────────

function loadJson(name: string): unknown {
  const filePath = path.resolve(__dirname, "examples", `${name}.json`);
  return JSON.parse(readFileSync(filePath, "utf-8"));
}

// ── Schema shape check ──────────────────────────────────────────────────

describe("ResumeSchema", () => {
  it("should have all required top-level keys", () => {
    const shape = ResumeSchema.shape;
    expect(Object.keys(shape)).toEqual([
      "meta",
      "personal",
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
      "social",
    ]);
  });

  it("should reject empty object", () => {
    const result = validate({});
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.length).toBeGreaterThan(0);
    }
  });

  it("should reject unknown properties at root", () => {
    const result = validate({ ...loadJson("developer"), unknownField: 123 });
    // ponytail: Zod strict mode rejects extra keys
    expect(result.ok).toBe(false);
  });
});

// ── Validator ───────────────────────────────────────────────────────────

describe("validator", () => {
  it("dev: accepts developer resume", () => {
    const result = validate(loadJson("developer"));
    expect(result.ok).toBe(true);
  });

  it("teacher: accepts teacher resume", () => {
    const result = validate(loadJson("teacher"));
    expect(result.ok).toBe(true);
  });

  it("musician: accepts musician resume", () => {
    const result = validate(loadJson("musician"));
    expect(result.ok).toBe(true);
  });

  it("designer: accepts designer resume", () => {
    const result = validate(loadJson("designer"));
    expect(result.ok).toBe(true);
  });

  it("doctor: accepts doctor resume", () => {
    const result = validate(loadJson("doctor"));
    expect(result.ok).toBe(true);
  });

  it("rejects invalid date format", () => {
    const base = loadJson("developer") as Record<string, unknown>;
    const exp = (base as { experience: { startDate: string }[] }).experience;
    exp[0].startDate = "01/2020";
    const result = validate(base);
    expect(result.ok).toBe(false);
  });

  it("rejects invalid skill level enum", () => {
    const base = loadJson("developer") as Record<string, unknown>;
    (base as { skills: { hard: { level: string }[] } }).skills.hard[0].level = "super";
    const result = validate(base);
    expect(result.ok).toBe(false);
  });

  it("rejects invalid language enum", () => {
    const base = loadJson("developer") as Record<string, unknown>;
    (base as { languages: { proficiency: string }[] }).languages[0].proficiency = "fluent";
    const result = validate(base);
    expect(result.ok).toBe(false);
  });

  it("returns friendly error messages", () => {
    const result = validate({});
    expect(result.ok).toBe(false);
    if (!result.ok) {
      const paths = result.errors.map((e) => e.path);
      expect(paths).toContain("personal");
      expect(paths).toContain("meta");
    }
  });
});

// ── Normalizer ──────────────────────────────────────────────────────────

describe("normalizer", () => {
  it("trims whitespace from strings", () => {
    const input = loadJson("developer") as Resume;
    input.personal.name = "  Ana Costa  ";
    const result = normalize(input);
    expect(result.personal.name).toBe("Ana Costa");
  });

  it("converts empty strings to null", () => {
    const input = loadJson("developer") as Resume;
    input.personal.email = "";
    input.summary = "   ";
    const result = normalize(input);
    expect(result.personal.email).toBeNull();
    expect(result.summary).toBeNull();
  });

  it("ensures arrays when missing", () => {
    const input = loadJson("developer") as Resume;
    (input as Record<string, unknown>).experience = null;
    const result = normalize(input);
    expect(result.experience).toEqual([]);
  });

  it("preserves null values", () => {
    const input = loadJson("developer") as Resume;
    input.personal.phone = null;
    const result = normalize(input);
    expect(result.personal.phone).toBeNull();
  });

  it("defaults language to pt when missing", () => {
    const input = loadJson("developer") as Resume;
    (input.meta as Record<string, unknown>).language = null;
    const result = normalize(input);
    expect(result.meta.language).toBe("pt");
  });

  it("strips empty highlights", () => {
    const input = loadJson("developer") as Resume;
    input.experience[0].highlights = ["Real thing", "", "  "];
    const result = normalize(input);
    expect(result.experience[0].highlights).toEqual(["Real thing"]);
  });

  it("normalizes deep nested location", () => {
    const input = loadJson("developer") as Resume;
    input.experience[0].location = {
      city: "  SP  ",
      state: "",
      country: "Brasil",
    };
    const result = normalize(input);
    expect(result.experience[0].location).toEqual({
      city: "SP",
      state: null,
      country: "Brasil",
    });
  });
});

// ── Incomplete resume ───────────────────────────────────────────────────

describe("incomplete resume", () => {
  it("validates minimal resume with only name", () => {
    const minimal = {
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
    const result = validate(minimal);
    expect(result.ok).toBe(true);
  });
});

// ── Edge cases ──────────────────────────────────────────────────────────

describe("edge cases", () => {
  it("handles resume with only LinkedIn", () => {
    const linkedinOnly = {
      meta: { schemaVersion: "1.0.0", language: "pt", generatedAt: null },
      personal: {
        name: "LinkedIn User",
        email: null,
        phone: null,
        location: null,
        linkedin: "https://linkedin.com/in/example",
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
    const result = validate(linkedinOnly);
    // ponytail: name is required string but "" is a string so it's valid at zod level
    // normalizer will convert "" → null which we handle downstream
    expect(result.ok).toBe(true);
  });

  it("accepts english resume", () => {
    const result = validate(loadJson("developer")); // developer.json has language: "en"
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.meta.language).toBe("en");
    }
  });

  it("accepts portuguese resume", () => {
    const result = validate(loadJson("teacher")); // teacher.json has language: "pt"
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.meta.language).toBe("pt");
    }
  });
});

// ── Large resume ────────────────────────────────────────────────────────

describe("large resume", () => {
  it("handles resume with many entries", () => {
    const base = loadJson("developer") as Resume;
    // add 50 experiences
    const manyExp = Array.from({ length: 50 }, (_, i) => ({
      ...base.experience[0],
      company: `Company ${i}`,
      position: `Position ${i}`,
    }));
    const large: Resume = {
      ...base,
      experience: manyExp,
      skills: {
        hard: Array.from({ length: 30 }, (_, i) => ({ name: `Skill ${i}`, level: "intermediate" as const })),
        soft: Array.from({ length: 20 }, (_, i) => ({ name: `Soft ${i}`, level: "intermediate" as const })),
      },
    };
    const result = validate(large);
    expect(result.ok).toBe(true);
  });
});

// ── Normalize → Validate round-trip ─────────────────────────────────────

describe("normalize + validate round-trip", () => {
  it("normalized output passes validation", () => {
    const input = loadJson("developer") as Resume;
    // mess it up
    input.personal.name = "  DIRTY  ";
    input.personal.email = "";
    (input as Record<string, unknown>).summary = "   ";
    input.experience[0].highlights = ["  A  ", "", "B"];

    const normalized = normalize(input);
    const result = validate(normalized);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.personal.name).toBe("DIRTY");
      expect(result.data.personal.email).toBeNull();
      expect(result.data.summary).toBeNull();
      expect(result.data.experience[0].highlights).toEqual(["A", "B"]);
    }
  });
});
