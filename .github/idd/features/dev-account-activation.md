# Feature: Dev Environment Account Activation

> **Status**: `partial`

## What

Bypass Stripe checkout/webhook activation flow in development —
`POST /register` creates ACTIVE profiles immediately, and all
Stripe-dependent pages skip API calls instead of breaking on missing
`subscriptionId`/`stripeCustomerId`.

## Acceptance Criteria

- [x] **AC-1**: `POST /api/auth/register` with `ENVIRONMENT=development`
      creates a Profile with `status: ACTIVE`, skips `createSubscription()`
      and `sendPaymentEmail()`, and leaves `subscriptionId`/`stripeCustomerId`
      as `null`.
      Verify: `npm test -- --test-name-pattern="POST /register — dev mode"`

- [x] **AC-2**: Gateway page server component auto-activates an INACTIVE
      profile when `isDevelopment` (direct `status: ACTIVE` update, no
      Stripe checkout recreation, no payment email).
      Verify: `npm test -- --test-name-pattern="Gateway — dev mode auto-activate"`

- [x] **AC-3**: `changePlan()` server action updates the Profile plan
      directly in MongoDB when `isDevelopment`, redirects to profile page
      instead of Stripe Checkout.
      Verify: `npm test -- --test-name-pattern="ChangePlan — dev mode direct update"`

- [x] **AC-4**: Cancel-subscription confirm page skips `cancelSubscription()`
      Stripe API call in dev, logs + redirects to logout.
      Verify: `npm test -- --test-name-pattern="CancelSubscription — dev mode skip"`

- [x] **AC-5**: Profile config page returns a safe fallback when
      `subscriptionId` is `null` in dev (no Stripe API fetch), still
      renders plan/billing info from Profile document.
      Verify: `npm test -- --test-name-pattern="Profile config — dev mode no subscriptionId"`

## TDD

Per `wiki::red-green-tdd::mental-model`: each AC runs Red (fails before
code), Green (passes after), then glossary anchor updated.

## Details

### Constraints

- ENVIRONMENT env var already set in `dev.env` as `development` and
  `prod.env` as `production`. No `.env` changes needed.
- Environment module lives at `src/lib/environment.ts` and exports
  `isDevelopment`, `isProduction`, `environment`.
- All gates use `import { isDevelopment } from "@/lib/environment"`.
- `Profile.subscriptionId` and `stripeCustomerId` already accept `null`
  (schema `required: false, default: null`).

### Out of Scope

- Client-side feature flags — ENVIRONMENT is server-only. Client
  components don't need it for these pages.
- Stripe test mode (`STRIPE_SECRET_KEY` pointing at test keys) — this
  feature skips Stripe entirely in dev, not just uses test Stripe.

---

## Dependencies

### Feature Dependencies

- `src/lib/environment.ts` — `isDevelopment` export (already exists)

### External Dependencies

- None

---

## Technical Considerations

### Performance

- No impact. Dev path is strictly cheaper (fewer network calls).

### Security

- Dev-only gate — `isDevelopment` is `false` at module load in
  production (ENVIRONMENT=production). No path leaks into prod.

### Backward Compatibility

- None. Existing prod flow unchanged. Dev profiles created before this
  feature remain INACTIVE unless manually updated.

---

## Glossary

| Location                                                                       | Type    | Description                                                           |
| ------------------------------------------------------------------------------ | ------- | --------------------------------------------------------------------- |
| `code::src/lib/environment.ts::isDevelopment`                                  | source  | Boolean gate for dev-only code paths                                  |
| `code::src/lib/environment.ts::isProduction`                                   | source  | Boolean gate for prod-only code paths                                 |
| `code::src/app/api/auth/register/route.ts::POST`                               | source  | Registration endpoint — dev gate at Profile creation                  |
| `code::src/app/gateway/page.tsx::Gateway`                                      | source  | Gateway page — dev gate at inactive-user re-subscription              |
| `code::src/app/actions/change_plan.ts::changePlan`                             | source  | Plan change server action — dev bypass Stripe checkout                |
| `code::src/app/config/cancel-subscription/confirm/page.tsx::ConfirmCancelPage` | source  | Cancel subscription page — dev skip Stripe cancel                     |
| `code::src/lib/subscription.ts::createSubscription`                            | source  | Stripe checkout session factory (skipped in dev)                      |
| `code::src/lib/subscription.ts::syncProfileFromStripeSubscription`             | source  | Webhook-driven profile activation (unnecessary in dev)                |
| `code::src/lib/emailService.ts::sendPaymentEmail`                              | source  | Payment email via SES (skipped in dev)                                |
| `code::src/models/Profile.ts::IProfile.status`                                 | source  | UserStatus field — ACTIVE in dev, INACTIVE→ACTIVE via webhook in prod |
| `feature::dev-account-activation::ac-1`                                        | feature | Registration dev gate                                                 |
| `feature::dev-account-activation::ac-2`                                        | feature | Gateway auto-activation                                               |
| `feature::dev-account-activation::ac-3`                                        | feature | Plan change direct update                                             |
| `feature::dev-account-activation::ac-4`                                        | feature | Cancel subscription skip                                              |
| `code::src/__tests__/dev-account-activation.test.ts`                           | source  | Structural tests covering AC-1 through AC-5                           |
