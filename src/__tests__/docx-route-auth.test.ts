import { describe, it } from "node:test";
import { readFileSync } from "fs";
import path from "path";

// expect is global from test-setup.ts

describe("POST /api/resume/docx — auth guard", () => {
  const routeContent = readFileSync(
    path.resolve(import.meta.dirname ?? __dirname, "../app/api/resume/docx/route.ts"),
    "utf-8"
  );

  it("calls isAuthenticated before body parsing or rendering", () => {
    const lines = routeContent.split("\n");

    const authLine = lines.findIndex((l) => l.includes("isAuthenticated(req.headers)"));
    const bodyLine = lines.findIndex((l) => l.includes("req.json()"));
    const renderLine = lines.findIndex((l) => l.includes("render(resume"));

    expect(authLine).toBeGreaterThan(0);
    expect(bodyLine).toBeGreaterThan(0);
    expect(renderLine).toBeGreaterThan(0);
    expect(authLine).toBeLessThan(bodyLine);
    expect(authLine).toBeLessThan(renderLine);
  });

  it("handles AuthError with 401", () => {
    expect(routeContent).toContain("AuthError");
    expect(routeContent).toContain("status: 401");
  });
});
