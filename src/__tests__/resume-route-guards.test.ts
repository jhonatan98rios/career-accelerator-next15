import { describe, it } from "node:test";
import { readFileSync } from "fs";
import path from "path";

// expect is global from test-setup.ts

describe("POST /api/resume — input length guard", () => {
  const routeContent = readFileSync(
    path.resolve(import.meta.dirname ?? __dirname, "../app/api/resume/route.ts"),
    "utf-8"
  );

  it("exports a generous MAX_RESUME_INPUT_CHARS constant", async () => {
    const { MAX_RESUME_INPUT_CHARS } = await import("../lib/resume-constants");
    expect(MAX_RESUME_INPUT_CHARS).toBeGreaterThan(0);
    expect(MAX_RESUME_INPUT_CHARS).toBeGreaterThanOrEqual(1000);
    expect(Number.isInteger(MAX_RESUME_INPUT_CHARS)).toBe(true);
  });

  it("rejects input exceeding the limit", () => {
    // Cheapest test: verify the guard line exists and returns 400
    expect(routeContent).toContain("MAX_RESUME_INPUT_CHARS");
    expect(routeContent).toContain("Texto excede o limite");
    expect(routeContent).toContain("status: 400");
  });

  it("validates length BEFORE calling the LLM", () => {
    // The check must appear before generate() — auth/DB setup naturally precedes it
    const lines = routeContent.split("\n");

    const maxCharsLine = lines.findIndex((l) => l.includes("input.length > MAX_RESUME_INPUT_CHARS"));
    const llmCallLine = lines.findIndex((l) => l.includes("generate(input, userData)"));
    const connectDBLine = lines.findIndex((l) => l.includes("connectDB()"));
    const authLine = lines.findIndex((l) => l.includes("isAuthenticated(req.headers)"));

    expect(maxCharsLine).toBeGreaterThan(0);
    expect(llmCallLine).toBeGreaterThan(0);
    expect(connectDBLine).toBeGreaterThan(0);
    expect(authLine).toBeGreaterThan(0);
    // Auth and DB connect come first (needed to identify user)
    expect(authLine).toBeLessThan(maxCharsLine);
    expect(connectDBLine).toBeLessThan(maxCharsLine);
    // But the guard must fire before the LLM call
    expect(maxCharsLine).toBeLessThan(llmCallLine);
  });

  it("emptiness check also precedes LLM call", () => {
    const lines = routeContent.split("\n");
    const emptyCheckLine = lines.findIndex((l) => l.includes("input.trim().length === 0"));
    const llmCallLine = lines.findIndex((l) => l.includes("generate(input, userData)"));

    expect(emptyCheckLine).toBeGreaterThan(0);
    expect(emptyCheckLine).toBeLessThan(llmCallLine);
  });
});
