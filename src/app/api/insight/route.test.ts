import { describe, it, expect } from "vitest";
import { deriveJobSearchKeyword } from "./route";

describe("deriveJobSearchKeyword", () => {
  it("keeps full multi-word role, not just first token", () => {
    expect(deriveJobSearchKeyword("AI Engineer")).toBe("ai engineer");
    expect(deriveJobSearchKeyword("Engenheiro de Software")).toBe("engenheiro de software");
  });

  it("splits only on list separators", () => {
    expect(deriveJobSearchKeyword("AI Engineer, Machine Learning")).toBe("ai engineer");
    expect(deriveJobSearchKeyword("Python/Django")).toBe("python");
    expect(deriveJobSearchKeyword("Python / Django")).toBe("python");
  });

  it("falls back to hard skill, then current role", () => {
    expect(deriveJobSearchKeyword(undefined, ["Python"], "Analista")).toBe("python");
    expect(deriveJobSearchKeyword(undefined, undefined, "Analista de Dados")).toBe(
      "analista de dados"
    );
    expect(deriveJobSearchKeyword()).toBeUndefined();
  });
});
