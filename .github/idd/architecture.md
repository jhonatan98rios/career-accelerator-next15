# Architecture

## Summary

Next.js 15 monolith bootstrapped with create-next-app, deployed on Vercel. Serves a Brazilian Portuguese career-acceleration SaaS ("AcelerAi"). Auth via Auth0, payments via Stripe Checkout subscriptions, LLM insights via OpenAI/LangChain (gpt-5-nano), MongoDB/Mongoose for persistence, AWS SES for transactional email, Datadog for logging, Nuvem Fiscal for NFSe invoicing. AI generation access is guarded by Mongo-backed cooldown and retry rules rather than a UI-only token counter.

## Mode

- Mode: brownfield
- Source: discovery
- Last Updated: 2026-07-04

## Projects

| Name | Path | Role | Notes |
|------|------|------|-------|
| career-accelerator | `.` | monolith | Single Next.js app, App Router + Pages Router hybrid |

## Capabilities

- Career insight generation (LLM-powered market analysis, compensation, roadmap)
- AI generation guardrails (24-hour insight cooldown, roadmap completion gate, one corrective retry, developer bypass flag)
- User registration + Auth0 authentication
- Stripe Checkout subscription lifecycle (create, activate, cancel via webhook)
- Consent management (versioned data-usage terms, PDFs, audit trail)
- NFSe invoice generation via Nuvem Fiscal
- Email notifications via AWS SES
- Datadog-structured logging (Vercel → DD HTTP intake)
- Career roadmap CRUD with step-level status tracking

## Runtime Topology

| Component | Type | Runtime Or Host | Notes |
|-----------|------|-----------------|-------|
| Web app | Next.js 15 App Router | Vercel (serverless) | Turbopack dev, `next build` for production |
| Pages Router | Legacy pages | Vercel | Single route: profile output `/profile/[id]/output/[output_id]` |
| MongoDB | Database | Atlas / self-hosted | Mongoose ODM, connection cached globally |
| Auth0 | Auth provider | Auth0 tenant | JWKS token validation, `@auth0/nextjs-auth0` v4 |
| OpenAI | LLM | OpenAI API | `gpt-5-nano-2025-08-07`, LangChain integration |
| Stripe | Payment processor | Stripe API | Checkout subscription, webhook-driven status |
| AWS SES | Email | AWS | Transactional payment-activation emails |
| Nuvem Fiscal | Invoicing | Nuvem Fiscal API | NFSe issuance, OAuth2 client credentials |
| Datadog | Logging | Datadog HTTP intake | Structured JSON logs from serverless functions |
| ViaCEP | Address lookup | ViaCEP API | Client-side CEP auto-fill on registration form |

## Data Stores

| Name | Type | Used By | Notes |
|------|------|---------|-------|
| Profile | MongoDB/Mongoose | Auth, registration, user config | Email-indexed, linked to Auth0 `externalAuthId` |
| CareerInsight | MongoDB/Mongoose | LLM output, insight display | Nested sections (hero, market snapshot, compensation, etc.) |
| CareerRoadmap | MongoDB/Mongoose | LLM output, step tracking | Embedded steps array with status per step |
| Subscription | MongoDB/Mongoose | Payment webhook, billing | Mirror of Stripe subscription state |
| Consent | MongoDB/Mongoose | Legal compliance | Versioned event log per user |
| Term | MongoDB/Mongoose | Legal compliance | Version registry of data-usage PDFs |

## Integrations

| System | Direction | Purpose | Notes |
|--------|-----------|---------|-------|
| Auth0 | inbound | Auth flows, session, token validation | `@auth0/nextjs-auth0` v4 server SDK, jose for API route validation |
| OpenAI | outbound | LLM career insight generation | LangChain ChatOpenAI with gpt-5-nano, structured prompt templates |
| MongoDB | outbound | Persistence | Mongoose ODM, global connection cache pattern |
| Stripe | outbound/inbound | Subscription creation and lifecycle | Stripe SDK for Checkout/subscriptions; signed webhook POST from Stripe |
| AWS SES | outbound | Transactional email | SESClient via @aws-sdk/client-ses |
| Nuvem Fiscal | outbound | NFSe invoice | OAuth2 client-credentials, REST v2 |
| Datadog | outbound | Structured logging | HTTP POST to DD intake API |
| ViaCEP | outbound | Address autocomplete | Public REST API, client-side `fetch` |

## Open Questions

- Pages Router output page (`/profile/[id]/output/[output_id]`) uses `getStaticProps` with `fallback: 'blocking'` — should migrate to App Router.
- Intermediate/Premium plans stubbed but never activated; code shows commented-out enum values.
- `ponytail:` comments may accumulate over time — ledger at `.github/idd/learned.md` or `/ponytail-debt`.

## Evidence

- `package.json` — Next.js 15.4.10, React 19, Auth0, LangChain, Mongoose
- `src/middleware.ts` — Auth0 middleware on all routes except static + api
- `src/lib/db.ts` — Mongoose global cache pattern
- `src/app/layout.tsx` — Provider tree: Auth0Provider > UserContextProvider > FormProvider
- `src/app/api/webhook/payment/stripe/route.ts` — Stripe webhook drives subscription lifecycle
- `src/app/gateway/page.tsx` — Registration orchestration (profile + subscription + email + consent)
- `src/pages/profile/[profile_id]/output/[output_id]/index.tsx` — Pages Router output page
- `src/lib/ai-generation-guardrails.ts` — Shared eligibility logic for insight cooldown and roadmap retry rules
