export enum LogLevel {
  INFO = "info",
  WARN = "warn",
  ERROR = "error",
}

export async function log(level: LogLevel, message: string, meta: Record<string, any> = {}) {
  await fetch("https://http-intake.logs.datadoghq.com/v1/input", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "DD-API-KEY": process.env.DD_API_KEY!, // set in Vercel env vars
    },
    body: JSON.stringify({
      ddsource: "vercel",
      service: "aceler.ai",
      message,
      level,
      ...meta,
    }),
  });
}

// ── Standardized application error ──────────────────────────────────
// ponytail: single error class with code + context. Replaces ad-hoc
// `throw new Error(...)` scattered across routes.

export type ErrorCode =
  | "auth/token_missing"
  | "auth/token_expired"
  | "auth/token_invalid"
  | "auth/unauthorized"
  | "subscription/creation_failed"
  | "subscription/cancellation_failed"
  | "subscription/plan_unsupported"
  | "webhook/signature_invalid"
  | "webhook/processing_failed"
  | "webhook/idempotency_miss"
  | "guardrail/insight_cooldown"
  | "guardrail/roadmap_retry_used"
  | "guardrail/roadmap_retry_expired"
  | "usage/daily_sessions_exceeded"
  | "usage/token_limit_exceeded"
  | "input/validation_failed"
  | "db/connection_failed"
  | "internal/unexpected";

export class AppError extends Error {
  constructor(
    message: string,
    public readonly code: ErrorCode,
    public readonly httpStatus: number = 500,
    public readonly context: Record<string, unknown> = {}
  ) {
    super(message);
    this.name = "AppError";
  }
}

// ponytail: log + return structured error response in one call.
// Routes call this instead of log() + NextResponse.json() separately.
export async function logError(
  err: unknown,
  fallbackCode: ErrorCode = "internal/unexpected",
  fallbackStatus = 500
): Promise<{ message: string; code: ErrorCode; status: number; context: Record<string, unknown> }> {
  if (err instanceof AppError) {
    await log(err.httpStatus >= 500 ? LogLevel.ERROR : LogLevel.WARN, err.message, {
      code: err.code,
      ...err.context,
    });
    return { message: err.message, code: err.code, status: err.httpStatus, context: err.context };
  }

  const message = err instanceof Error ? err.message : String(err);
  await log(LogLevel.ERROR, message, {
    code: fallbackCode,
    stack: err instanceof Error ? err.stack : undefined,
  });
  return { message, code: fallbackCode, status: fallbackStatus, context: {} };
}
