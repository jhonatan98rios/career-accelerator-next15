// ponytail: in-memory rate limiter — one Map, zero dependencies, zero persistence.
// Keys live in memory only, expire after their window. No DB, no log, no PII leak.
// Downside: per-serverless-instance counters (not shared). Fine for Hobby traffic.

const store = new Map<string, { count: number; resetAt: number }>();

export function check(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (entry.count >= max) return false;

  entry.count++;
  return true;
}
