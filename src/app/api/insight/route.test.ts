import { describe, it } from "node:test";
import assert from "node:assert";
import { deriveJobSearchKeyword } from "@/lib/job-search-keyword";

describe("deriveJobSearchKeyword", () => {
  it("keeps full multi-word role, not just first token", () => {
    assert.equal(deriveJobSearchKeyword("AI Engineer"), "ai engineer");
    assert.equal(deriveJobSearchKeyword("Engenheiro de Software"), "engenheiro de software");
  });

  it("splits only on list separators", () => {
    assert.equal(deriveJobSearchKeyword("AI Engineer, Machine Learning"), "ai engineer");
    assert.equal(deriveJobSearchKeyword("Python/Django"), "python");
    assert.equal(deriveJobSearchKeyword("Python / Django"), "python");
  });

  it("falls back to hard skill, then current role", () => {
    assert.equal(deriveJobSearchKeyword(undefined, ["Python"], "Analista"), "python");
    assert.equal(
      deriveJobSearchKeyword(undefined, undefined, "Analista de Dados"),
      "analista de dados"
    );
    assert.equal(deriveJobSearchKeyword(), undefined);
  });
});
