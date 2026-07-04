# Conventions

## Summary

Standard Next.js 15 App Router layout with React 19 and TypeScript. Mongoose models in `src/models/`, server actions in `src/app/actions/`, lib utilities in `src/lib/`, React context stores in `src/store/`. Server components by default, client components when state/interactivity needed. Auth0 guards on all non-public routes. Tailwind CSS v4 for styling.

## Languages And Tooling

| Area | Choice | Notes |
|------|--------|-------|
| Languages | TypeScript 5 (strict mode) | `tsconfig.json` targets ES2017, bundler resolution |
| Package Manager | npm | `package-lock.json` in repo |
| Frameworks | Next.js 15.4.10, React 19.1.0 | Turbopack in dev, App Router primary, one Pages Router route |
| Linters And Formatters | `next lint` | ESLint via Next.js built-in |
| Test Tooling | None detected | No test framework in devDependencies |
| CSS | Tailwind CSS v4 | `@tailwindcss/postcss`, PostCSS config |

## Formatting

- Indentation: 2 spaces
- Quotes: double (`"`) for JSX/TSX attributes and JS strings (single `'` detected in `'use client'` directives and a few files — inconsistent)
- Line Length: no enforced limit
- File Organization: Co-located by route segment under `src/app/`, shared components in `src/components/`, lib in `src/lib/`

## Naming

- Files: `kebab-case.ts` for lib utilities, `PascalCase.tsx` for components; route files use Next.js conventions (`page.tsx`, `layout.tsx`, `route.ts`)
- Functions: `camelCase` for regular functions, `PascalCase` for React components
- Classes: PascalCase (Mongoose models, interfaces)
- Tests: none present

## Imports And Boundaries

- Path alias `@/*` maps to `./src/*`
- Server actions import from `@/app/actions/` directory
- Mongoose models import from `@/models/` (singular filename, no barrel index)
- Client components use `'use client'` directive
- No barrel files (`index.ts`) detected

## Testing

No test framework installed. Verification is manual (`next build`, manual smoke testing). If tests are introduced, they must use a framework chosen at that time — no framework currently preferred.

## Logging And Errors

- Datadog HTTP intake via `src/lib/logger.ts` — `log(LogLevel, message, meta)` function
- Three levels: `INFO`, `WARN`, `ERROR`
- Logged from server components, server actions, API routes, and webhooks
- Error messages string-interpolated with `throw new Error(...)` pattern (not custom error classes)
- No error boundaries detected

## Library Patterns

| Library Or Tool | Approved Usage Pattern | Avoid |
|-----------------|------------------------|-------|
| Mongoose | Model definition in `src/models/` with `I{Name}` interface + `{Name}Schema` + export | Raw `mongodb` driver (avoid unless needed) |
| `@auth0/nextjs-auth0` | `Auth0Client` server init in `src/lib/auth0.ts`; middleware in `src/middleware.ts`; `getSessionCached()` wrapped with `React.cache()` | Calling `auth0.getSession()` directly without cache in server components |
| LangChain / OpenAI | `ChatOpenAI` model in `src/lib/llm.ts`; prompts in `src/lib/prompts.ts` | Embedding model not needed; direct OpenAI SDK preferred over LangChain for simple calls |
| `canvas-confetti` | Trigger on roadmap completion | Persistent DOM manipulation |
| Stripe | Subscription lifecycle via Checkout Session + signed webhook | Manual status manipulation or custom card forms |

## Component Locations

| Component Type | Preferred Location | Notes |
|----------------|--------------------|-------|
| Page/Layout | `src/app/[route]/page.tsx` | Next.js App Router convention |
| API Route | `src/app/api/[route]/route.ts` | Next.js App Router API handlers |
| Server Action | `src/app/actions/[name].ts` | `"use server"` directive |
| Shared Component | `src/components/[name].tsx` | No subdirectories |
| Context Store | `src/store/[Name]Context.tsx` | React `createContext` + Provider component |
| Mongoose Model | `src/models/[Name].ts` | Singular PascalCase filename |
| Utility/Lib | `src/lib/[name].ts` | No subdirectories |
| Type Definition | `src/types/[name].ts` or `.d.ts` | |
| Pages Router | `src/pages/[route]/[param].tsx` | Only one Pages Router route exists |

## Anti-Patterns

- Hardcoded token count (25) in sidebar component instead of querying from database
- `@ts-ignore` used in output page (`src/pages/profile/[profile_id]/output/[output_id]/index.tsx`) — suppress errors instead of fixing types
- Pages Router (`src/pages/`) coexists with App Router — migration incomplete
- Inconsistent quote style (`'use client'` single-quoted, JS strings double-quoted)
- Empty `useEffect` in `ProgressBar` component
- Registration page sends full user data (CPF, address) with JWT token but comments say "TODO: Send only JWT token"
- `confirm()` modal used for destructive actions (cancel subscription, logout) — blocks rendering on client-side before redirect

## Evidence

- `package.json` — dependency list, no test framework
- `tsconfig.json` — strict mode, `@/*` alias, bundler resolution
- `src/app/layout.tsx` — Provider nesting order
- `src/lib/auth0.ts` — `getSessionCached` patched with `React.cache()`
- `src/lib/logger.ts` — Datadog HTTP intake
- `src/app/gateway/form.tsx` — Client-side registration form pattern
- `src/pages/profile/[profile_id]/output/[output_id]/index.tsx` — Pages Router remnant
