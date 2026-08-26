import { describe, it } from "node:test";
import { formatProfessionalProfileForPrompt } from "@/lib/professional-profile";
import type { IProfessionalProfile } from "@/models/ProfessionalProfile";
// expect is global from test-setup.ts (chai + @vitest/expect)

function profile(
  overrides: Partial<Pick<IProfessionalProfile, "who" | "experience" | "goals">> = {}
) {
  return { who: "", experience: [], goals: "", ...overrides };
}

describe("formatProfessionalProfileForPrompt", () => {
  it("returns empty string for null/empty profile", () => {
    expect(formatProfessionalProfileForPrompt(null)).toBe("");
    expect(formatProfessionalProfileForPrompt(profile())).toBe("");
  });

  it("renders who as running text", () => {
    const out = formatProfessionalProfileForPrompt(profile({ who: "Sou dev há 5 anos." }));
    expect(out).toBe("Quem sou eu:\nSou dev há 5 anos.");
  });

  it("renders experience items with title, period and description", () => {
    const out = formatProfessionalProfileForPrompt(
      profile({
        experience: [
          { title: "Dev na Acme", period: "2020-2022", description: "Migrei o monólito." },
          { title: "Estágio", period: "2019", description: "" },
        ],
      })
    );
    expect(out).toContain("Experiência profissional:");
    expect(out).toContain("- Dev na Acme (2020-2022): Migrei o monólito.");
    expect(out).toContain("- Estágio (2019)");
  });

  it("skips items without title", () => {
    const out = formatProfessionalProfileForPrompt(
      profile({
        experience: [
          { title: "", period: "2020", description: "sem título" },
          { title: "Válido", period: "", description: "" },
        ],
      })
    );
    expect(out).not.toContain("sem título");
    expect(out).toContain("- Válido");
  });

  it("renders goals as running text", () => {
    const out = formatProfessionalProfileForPrompt(profile({ goals: "Quero virar tech lead." }));
    expect(out).toBe("O que pretendo fazer:\nQuero virar tech lead.");
  });

  it("combines all sections in order", () => {
    const out = formatProfessionalProfileForPrompt(
      profile({
        who: "Quem sou.",
        experience: [{ title: "X", period: "2021", description: "desc" }],
        goals: "Metas.",
      })
    );
    const idxWho = out.indexOf("Quem sou eu:");
    const idxExp = out.indexOf("Experiência profissional:");
    const idxGoals = out.indexOf("O que pretendo fazer:");
    expect(idxWho).toBeGreaterThanOrEqual(0);
    expect(idxExp).toBeGreaterThan(idxWho);
    expect(idxGoals).toBeGreaterThan(idxExp);
  });
});
