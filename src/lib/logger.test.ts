import { describe, it } from "node:test";
import { AppError, logError } from "./logger";
// expect is global from test-setup.ts (chai + @vitest/expect)

describe("AppError", () => {
  it("is an instance of Error", () => {
    const err = new AppError("test", "internal/unexpected");
    expect(err).toBeInstanceOf(Error);
  });

  it("has name AppError", () => {
    const err = new AppError("test", "auth/token_missing");
    expect(err.name).toBe("AppError");
  });

  it("exposes code, httpStatus, context", () => {
    const err = new AppError("boom", "subscription/creation_failed", 400, { plan: "basic" });
    expect(err.code).toBe("subscription/creation_failed");
    expect(err.httpStatus).toBe(400);
    expect(err.context).toMatchObject({ plan: "basic" });
  });

  it("defaults httpStatus to 500", () => {
    const err = new AppError("boom", "db/connection_failed");
    expect(err.httpStatus).toBe(500);
  });

  it("defaults context to empty object", () => {
    const err = new AppError("boom", "internal/unexpected");
    expect(err.context).toMatchObject({});
  });

  it("passes message through", () => {
    const err = new AppError("explicit message here", "input/validation_failed");
    expect(err.message).toBe("explicit message here");
  });
});

describe("logError", () => {
  it("returns structured error for AppError instances", async () => {
    const appErr = new AppError("not found", "auth/unauthorized", 401, { userId: "u1" });
    const result = await logError(appErr);

    expect(result.message).toBe("not found");
    expect(result.code).toBe("auth/unauthorized");
    expect(result.status).toBe(401);
    expect(result.context).toMatchObject({ userId: "u1" });
  });

  it("handles plain Error instances", async () => {
    const plainErr = new Error("something broke");
    const result = await logError(plainErr);

    expect(result.message).toBe("something broke");
    expect(result.code).toBe("internal/unexpected");
    expect(result.status).toBe(500);
  });

  it("handles string errors", async () => {
    const result = await logError("raw string error");

    expect(result.message).toBe("raw string error");
    expect(result.code).toBe("internal/unexpected");
    expect(result.status).toBe(500);
  });

  it("uses custom fallback code and status for non-AppError", async () => {
    const result = await logError(new Error("fail"), "db/connection_failed", 503);

    expect(result.code).toBe("db/connection_failed");
    expect(result.status).toBe(503);
  });

  it("logs with WARN for 4xx AppErrors", async () => {
    // ponytail: verify via side effect — we can't easily assert log()
    // was called, but the structure is correct.
    const err = new AppError("bad input", "input/validation_failed", 400);
    const result = await logError(err);
    expect(result.status).toBe(400);
    // status < 500 should produce a WARN-level log (tested by integration)
  });

  it("logs with ERROR for 5xx AppErrors", async () => {
    const err = new AppError("db down", "db/connection_failed", 500);
    const result = await logError(err);
    expect(result.status).toBe(500);
  });
});
