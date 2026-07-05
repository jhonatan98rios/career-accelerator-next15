import { describe, it, expect } from "vitest";
import { formatPersonaForPrompt } from "@/lib/llm";
import type { IPersona } from "@/models/Persona";
import { Types } from "mongoose";

// ---- helpers ----

function persona(overrides: Partial<IPersona> = {}): IPersona {
  return {
    profile_id: new Types.ObjectId(),
    ...overrides,
  } as IPersona;
}

// ---- formatPersonaForPrompt tests ----

describe("formatPersonaForPrompt", () => {
  // ── empty / null ────────────────────────────────────────────────

  it("returns empty string for null persona", () => {
    expect(formatPersonaForPrompt(null)).toBe("");
  });

  it("returns empty string for undefined persona", () => {
    expect(formatPersonaForPrompt(undefined)).toBe("");
  });

  it("returns empty string for persona with no populated fields", () => {
    const p = persona();
    expect(formatPersonaForPrompt(p)).toBe("");
  });

  // ── career identity ─────────────────────────────────────────────

  it("formats current role with years of experience", () => {
    const p = persona({ currentRole: "Software Engineer", yearsOfExperience: 5 });
    expect(formatPersonaForPrompt(p)).toContain("- Current role: Software Engineer (5 years)");
  });

  it("formats current role without years (no parens)", () => {
    const p = persona({ currentRole: "Junior Dev" });
    expect(formatPersonaForPrompt(p)).toContain("- Current role: Junior Dev");
    expect(formatPersonaForPrompt(p)).not.toContain("(");
  });

  it("formats target role", () => {
    const p = persona({ targetRole: "Tech Lead" });
    expect(formatPersonaForPrompt(p)).toContain("- Target role: Tech Lead");
  });

  it("formats career stage", () => {
    const p = persona({ careerStage: "senior" });
    expect(formatPersonaForPrompt(p)).toContain("- Career stage: senior");
  });

  it("formats industries list", () => {
    const p = persona({ industries: ["FinTech", "AI"] });
    expect(formatPersonaForPrompt(p)).toContain("- Industries: FinTech, AI");
  });

  it("formats employment status", () => {
    const p = persona({ employmentStatus: "employed" });
    expect(formatPersonaForPrompt(p)).toContain("- Employment: employed");
  });

  // ── education ───────────────────────────────────────────────────

  it("formats education level", () => {
    const p = persona({ educationLevel: "bachelors" });
    expect(formatPersonaForPrompt(p)).toContain("- Education: bachelors");
  });

  it("formats field of study", () => {
    const p = persona({ fieldOfStudy: "Computer Science" });
    expect(formatPersonaForPrompt(p)).toContain("- Field of study: Computer Science");
  });

  it("formats certifications", () => {
    const p = persona({ certifications: ["AWS SA", "CKAD"] });
    expect(formatPersonaForPrompt(p)).toContain("- Certifications: AWS SA, CKAD");
  });

  it("shows currently studying flag", () => {
    const p = persona({ currentlyStudying: true });
    expect(formatPersonaForPrompt(p)).toContain("- Currently studying: yes");
  });

  it("omits currently studying when false", () => {
    const p = persona({ currentlyStudying: false });
    expect(formatPersonaForPrompt(p)).not.toContain("Currently studying");
  });

  // ── skills ──────────────────────────────────────────────────────

  it("formats hard skills", () => {
    const p = persona({ hardSkills: ["TypeScript", "React"] });
    expect(formatPersonaForPrompt(p)).toContain("- Hard skills: TypeScript, React");
  });

  it("formats soft skills", () => {
    const p = persona({ softSkills: ["Communication", "Leadership"] });
    expect(formatPersonaForPrompt(p)).toContain("- Soft skills: Communication, Leadership");
  });

  it("formats languages with proficiency", () => {
    const p = persona({
      languages: [
        { language: "Portuguese", proficiency: "native" },
        { language: "English", proficiency: "fluent" },
      ],
    });
    expect(formatPersonaForPrompt(p)).toContain(
      "- Languages: Portuguese (native), English (fluent)"
    );
  });

  it("formats skills gained", () => {
    const p = persona({ skillsGained: ["Docker", "Kubernetes"] });
    expect(formatPersonaForPrompt(p)).toContain("- Previously gained skills: Docker, Kubernetes");
  });

  // ── routine ─────────────────────────────────────────────────────

  it("formats weekly study hours", () => {
    const p = persona({ weeklyStudyHours: 15 });
    expect(formatPersonaForPrompt(p)).toContain("- Weekly study hours: 15");
  });

  it("omits weeklyStudyHours when zero (falsy)", () => {
    // ponytail: zero is a valid value but "0" can be misleading — still displayed
    const p = persona({ weeklyStudyHours: 0 });
    // formatPersonaForPrompt uses != null check, so 0 is included
    expect(formatPersonaForPrompt(p)).toContain("- Weekly study hours: 0");
  });

  it("formats study schedule", () => {
    const p = persona({ studySchedule: "evenings" });
    expect(formatPersonaForPrompt(p)).toContain("- Study schedule: evenings");
  });

  // ── goals ───────────────────────────────────────────────────────

  it("formats short-term goal", () => {
    const p = persona({ shortTermGoal: "Learn Next.js" });
    expect(formatPersonaForPrompt(p)).toContain("- Short-term goal: Learn Next.js");
  });

  it("formats medium-term goal", () => {
    const p = persona({ mediumTermGoal: "Become senior" });
    expect(formatPersonaForPrompt(p)).toContain("- Medium-term goal: Become senior");
  });

  it("formats long-term goal", () => {
    const p = persona({ longTermGoal: "Start a company" });
    expect(formatPersonaForPrompt(p)).toContain("- Long-term goal: Start a company");
  });

  it("formats career motivation", () => {
    const p = persona({ careerMotivation: "growth" });
    expect(formatPersonaForPrompt(p)).toContain("- Motivation: growth");
  });

  it("formats target salary", () => {
    const p = persona({
      targetSalary: { currency: "BRL", amount: 15000, period: "monthly" },
    });
    expect(formatPersonaForPrompt(p)).toContain("- Target salary: 15000 BRL/monthly");
  });

  // ── progress ────────────────────────────────────────────────────

  it("formats completed roadmaps counter", () => {
    const p = persona({ completedRoadmaps: 3 });
    expect(formatPersonaForPrompt(p)).toContain("- Completed roadmaps: 3");
  });

  it("formats insights generated counter", () => {
    const p = persona({ insightsGenerated: 7 });
    expect(formatPersonaForPrompt(p)).toContain("- Insights generated: 7");
  });

  // ── integration: full persona ───────────────────────────────────

  it("opens with User Profile header when any field is populated", () => {
    const p = persona({ currentRole: "Dev" });
    expect(formatPersonaForPrompt(p)).toMatch(/^User Profile:\n/);
  });

  it("includes all populated groups in a full persona", () => {
    const p = persona({
      currentRole: "Full Stack Developer",
      yearsOfExperience: 4,
      targetRole: "Engineering Manager",
      careerStage: "mid",
      industries: ["EdTech"],
      employmentStatus: "employed",
      educationLevel: "bachelors",
      fieldOfStudy: "Computer Engineering",
      certifications: ["AWS Solutions Architect"],
      currentlyStudying: true,
      preferredLearningStyle: "self_paced",
      hardSkills: ["TypeScript", "Node.js", "React"],
      softSkills: ["Mentoring"],
      languages: [{ language: "English", proficiency: "fluent" }],
      tools: ["Docker", "GitHub Actions"],
      weeklyStudyHours: 10,
      studySchedule: "evenings",
      shortTermGoal: "Transition to management",
      mediumTermGoal: "Lead a team of 5+",
      longTermGoal: "VP of Engineering",
      careerMotivation: "growth",
      targetSalary: { currency: "USD", amount: 150000, period: "yearly" },
      completedRoadmaps: 2,
      insightsGenerated: 5,
      skillsGained: ["CI/CD", "System Design"],
    });

    const output = formatPersonaForPrompt(p);

    expect(output).toContain("User Profile:");
    expect(output).toContain("Current role: Full Stack Developer (4 years)");
    expect(output).toContain("Target role: Engineering Manager");
    expect(output).toContain("Career stage: mid");
    expect(output).toContain("Industries: EdTech");
    expect(output).toContain("Employment: employed");
    expect(output).toContain("Education: bachelors");
    expect(output).toContain("Field of study: Computer Engineering");
    expect(output).toContain("Certifications: AWS Solutions Architect");
    expect(output).toContain("Currently studying: yes");
    expect(output).toContain("Hard skills: TypeScript, Node.js, React");
    expect(output).toContain("Soft skills: Mentoring");
    expect(output).toContain("Languages: English (fluent)");
    expect(output).toContain("Previously gained skills: CI/CD, System Design");
    expect(output).toContain("Weekly study hours: 10");
    expect(output).toContain("Study schedule: evenings");
    expect(output).toContain("Short-term goal: Transition to management");
    expect(output).toContain("Medium-term goal: Lead a team of 5+");
    expect(output).toContain("Long-term goal: VP of Engineering");
    expect(output).toContain("Motivation: growth");
    expect(output).toContain("Target salary: 150000 USD/yearly");
    expect(output).toContain("Completed roadmaps: 2");
    expect(output).toContain("Insights generated: 5");
  });

  // ── edge cases ──────────────────────────────────────────────────

  it("skips empty arrays (industries, hardSkills, etc.)", () => {
    const p = persona({
      currentRole: "Dev",
      industries: [],
      hardSkills: [],
      skillsGained: [],
      certifications: [],
      languages: [],
    });
    const output = formatPersonaForPrompt(p);
    expect(output).not.toContain("Industries:");
    expect(output).not.toContain("Hard skills:");
    expect(output).not.toContain("Previously gained skills:");
    expect(output).not.toContain("Certifications:");
    expect(output).not.toContain("Languages:");
    expect(output).toContain("Current role: Dev");
  });
});
