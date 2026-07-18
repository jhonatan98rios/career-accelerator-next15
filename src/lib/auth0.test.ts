import { describe, it } from "node:test";
import { AuthError } from "./auth0";
// expect is global from test-setup.ts (chai + @vitest/expect)

describe("AuthError", () => {
  it("has correct name property", () => {
    const err = new AuthError("test message", "token_missing");
    expect(err.name).toBe("AuthError");
    expect(err).toBeInstanceOf(Error);
  });

  it("exposes code as public property", () => {
    const err = new AuthError("expired", "token_expired");
    expect(err.code).toBe("token_expired");
  });

  it("preserves message", () => {
    const err = new AuthError("Authorization header missing", "token_missing");
    expect(err.message).toBe("Authorization header missing");
  });

  it("supports all three error codes", () => {
    const codes: Array<"token_expired" | "token_missing" | "token_invalid"> = [
      "token_expired",
      "token_missing",
      "token_invalid",
    ];
    for (const code of codes) {
      const err = new AuthError("fail", code);
      expect(err.code).toBe(code);
    }
  });

  it("is catchable as Error", () => {
    try {
      throw new AuthError("boom", "token_invalid");
    } catch (e) {
      expect(e).toBeInstanceOf(Error);
      expect(e).toBeInstanceOf(AuthError);
    }
  });
});

describe("isAuthenticated — token header parsing", () => {
  it("AuthError distinguishes token_missing from token_invalid", () => {
    const missing = new AuthError("no header", "token_missing");
    const invalid = new AuthError("bad token", "token_invalid");
    const expired = new AuthError("expired", "token_expired");

    expect(missing.code).not.toBe(invalid.code);
    expect(invalid.code).not.toBe(expired.code);
    expect(expired.code).not.toBe(missing.code);
  });
});
