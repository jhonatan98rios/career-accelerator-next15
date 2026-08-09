// middleware.ts
import { NextRequest, NextResponse } from "next/server";
import { auth0 } from "./lib/auth0";
import { check } from "./lib/rate-limit";

function getIP(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "127.0.0.1"
  );
}

const RULES: Array<{ pattern: RegExp; max: number; windowMs: number }> = [
  { pattern: /^\/api\/insight/, max: 5, windowMs: 60_000 },
  { pattern: /^\/api\/chat/, max: 20, windowMs: 60_000 },
  { pattern: /^\/api\/resume/, max: 10, windowMs: 60_000 },
  { pattern: /^\/api\/roadmap/, max: 5, windowMs: 60_000 },
  { pattern: /^\/api\/auth\/register/, max: 3, windowMs: 3_600_000 },
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Apply IP-based rate limit on API routes
  const rule = RULES.find((r) => r.pattern.test(pathname));
  if (rule) {
    const ip = getIP(request);
    const key = `${pathname}:${ip}`;

    if (!check(key, rule.max, rule.windowMs)) {
      return NextResponse.json({ error: "Muitas requisicoes. Aguarde." }, { status: 429 });
    }
  }

  return await auth0.middleware(request);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)"],
};
