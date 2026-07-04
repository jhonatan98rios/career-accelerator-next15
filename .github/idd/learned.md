# Learned Rules

## Summary

Repository-specific operational rules discovered through interaction with the codebase. These override generic preferences but remain subordinate to explicit user instruction.

## Rules

| Rule Type | Scope | Constraint | Rationale | Status |
|-----------|-------|------------|-----------|--------|
| naming | files | Server actions use `kebab-case.ts` with `"use server"` directive in `src/app/actions/` | Existing convention across `career_roadmap.ts`, `consent.ts`, `user_config.ts` | active |
| naming | files | Mongoose model files use singular `PascalCase.ts` in `src/models/` | Existing convention: `Profile.ts`, `Subscription.ts`, `CareerRoadmap.ts`, `CarrerInsight.ts` (note typo), `Consent.ts`, `Term.ts` | active |
| naming | convention | `import { log, LogLevel } from "@/lib/logger"` is the standard import for logging in every server-side file | Every API route, server action, and server component uses this pattern | active |
| naming | convention | Auth0 token validation in API routes uses `isAuthenticated(req.headers)` from `@/lib/auth0` | All protected API routes use this pattern; server components use `getSessionCached()` | active |
| anti-pattern | code | Do not add `@ts-ignore` without a `// TODO:` explaining why | Existing `@ts-ignore` in output page; suppress-all pattern masks real type issues | active |
| anti-pattern | code | Avoid hardcoded values in components that should come from DB or API | AI generation limits and availability must come from persisted guardrail state, not UI-only counters | active |
| naming | models | Model file `src/models/CarrerInsight.ts` has a typo ("Carrer" vs "Career") — keep filename as-is to avoid breaking existing references | Renaming would require updating all imports across the codebase `CareerInsight.ts` | active |

## Notes

- Add or change rules only with explicit user approval unless the user directly asks to save the rule.
- Pages Router migration to App Router is incomplete — only `src/pages/profile/[profile_id]/output/[output_id]/index.tsx` remains.
- No test infrastructure exists; `next build` is the only verification path.
