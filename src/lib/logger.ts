export enum LogLevel {
  INFO = "info",
  WARN = "warn",
  ERROR = "error"
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