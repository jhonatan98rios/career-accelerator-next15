# Feature: Stripe Subscription Migration

> **Status**: `implemented`

This file is the primary execution and maintenance contract for Stripe subscriptions.

## What

Use Stripe-hosted Checkout subscriptions while preserving the existing Auth0 -> gateway registration -> inactive-until-payment -> webhook activation -> consent -> profile workflow.

## Acceptance Criteria

- [x] AC-1: Legacy payment-provider runtime code, user-facing copy, constants, environment variables, webhook routes, cancellation flow, subscription model shape, and IDD payment documentation are removed or replaced.
      Verify: forbidden legacy-provider token scan completed with no runtime matches.
- [x] AC-2: Registration creates or reuses a Stripe Customer and creates a Stripe Checkout Session in `mode: "subscription"` for the selected monthly Basic plan, restricted to credit cards, using the configured Stripe Price ID.
      Verify: `rg -n "checkout.sessions.create|mode:.*subscription|payment_method_types|STRIPE_BASIC_MONTHLY_PRICE_ID|customer_email|client_reference_id|subscription_data" src/lib src/app/api/auth/register`
- [x] AC-3: The user registration workflow stays the same from the user's perspective: Auth0 login, gateway form, plan selection, account created as `INACTIVE`, activation link sent by email, webhook grants access, legal terms gate, profile redirect.
      Verify: `rg -n "UserStatus.INACTIVE|sendPaymentEmail|redirect\\('/legal/terms'\\)|redirect\\('/profile/'|returnTo=/gateway" src/app/gateway src/app/api/auth/register`
- [x] AC-4: Stripe webhooks are received at a Stripe-specific API route, verify `stripe-signature` with `STRIPE_WEBHOOK_SECRET` against the raw request body, and process duplicate events idempotently.
      Verify: `rg -n "stripe-signature|STRIPE_WEBHOOK_SECRET|constructEvent|processed|event.id|checkout.session.completed|customer.subscription" src/app/api/webhook src/models`
- [x] AC-5: Stripe webhook state transitions keep `Profile.status` authoritative for authorization: `trialing` and `active` activate the profile; `canceled`, `unpaid`, and terminal checkout/subscription failures deactivate it; `past_due` is logged and handled according to the decision table below.
      Verify: `rg -n "trialing|active|past_due|canceled|unpaid|UserStatus.ACTIVE|UserStatus.INACTIVE" src/app/api/webhook src/models/Subscription.ts`
- [x] AC-6: User-initiated cancellation updates the Stripe subscription, logs the request and result, and relies on the webhook to reconcile local state.
      Verify: `rg -n "subscriptions.update|cancel_at_period_end|subscriptions.cancel|ConfirmCancelPage|Stripe" src/app/config/cancel-subscription src/lib`
- [x] AC-7: Subscription persistence mirrors Stripe identifiers and statuses, including enough data to reconcile users, customers, checkout sessions, subscriptions, prices, current period dates, cancellation status, and last processed webhook event.
      Verify: `rg -n "stripeCustomerId|stripeSubscriptionId|stripeCheckoutSessionId|stripePriceId|currentPeriod|cancelAtPeriodEnd|lastStripeEventId" src/models/Subscription.ts src/models/Profile.ts`
- [x] AC-8: Payment email copy names Stripe as the secure payment provider and links to the Stripe Checkout URL returned by the subscription creation helper.
      Verify: `rg -n "Stripe|checkout.url|paymentLink|sendPaymentEmail" src/lib/emailService.ts src/lib/subscription.ts`
- [x] AC-9: Required Stripe environment variables are documented in a local env template without real secrets.
      Verify: `test -f .env.stripe.local.example && rg -n "STRIPE_SECRET_KEY|STRIPE_WEBHOOK_SECRET|STRIPE_BASIC_MONTHLY_PRICE_ID|NEXT_PUBLIC_APP_URL" .env.stripe.local.example`

## TDD

The user explicitly suspended Red/Green TDD for this migration. Use the `rg`/`test` verification commands above as implementation checklists and perform manual Stripe test-mode smoke checks before production rollout.

## Details

### Current Workflow To Preserve

1. Unauthenticated visitors enter via `/auth/login?returnTo=/gateway`.
2. `Gateway` loads the Auth0 session and checks MongoDB for a `Profile`.
3. New users fill `GatewayForm` with name, CPF, CEP, address complement, and the Basic monthly plan.
4. `POST /api/auth/register` validates the Auth0 bearer token, creates the payment subscription, creates the `Profile` as `UserStatus.INACTIVE`, and sends an activation email.
5. Inactive users who revisit `/gateway` receive another payment email.
6. The payment webhook is the only normal path that sets `Profile.status = UserStatus.ACTIVE`.
7. Active users must accept the latest legal terms before being redirected to `/profile/:profile_id`.
8. Profile routes continue to trust `Profile.status` and the existing Auth0/profile ownership checks.

### Replace Map

| Payment Surface | Stripe Implementation |
|-----------------|-----------------------|
| `src/lib/constants.ts` | App URL and Stripe success/cancel URLs derived from `NEXT_PUBLIC_APP_URL` |
| `src/lib/subscription.ts::createSubscription` | Stripe helper that creates/reuses Customer and creates Checkout Session |
| Plan pricing | Stripe Checkout Session parameters and plan-to-Price-ID mapping |
| Server secrets | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_BASIC_MONTHLY_PRICE_ID` |
| Checkout link | `checkout.url` |
| Reconciliation key | `client_reference_id = profile id or email`, plus metadata `{ email, plan, externalAuthId }` |
| Webhook route | Stripe webhook route `/api/webhook/payment/stripe` |
| Webhook events | Stripe `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed` |
| Active payment status | Stripe subscription `trialing` or `active` |
| Cancelled payment status | Stripe subscription `canceled` or deleted event |
| Cancellation | Stripe subscription cancel/update API |
| `Subscription` model | Stripe-shaped subscription mirror |
| Email copy | Stripe Checkout provider copy |

### Target Stripe Flow

1. Registration validates the Auth0 token exactly as today.
2. Registration validates `Plan.BASIC` only, preserving monthly credit-card subscriptions.
3. Registration creates the local `Profile` as `INACTIVE` before or atomically around Checkout Session creation so Stripe metadata can carry a stable local profile id. If implementation keeps creating Stripe first, metadata must still carry email and Auth0 `sub`.
4. Stripe Customer is found or created by email and linked locally as `stripeCustomerId`.
5. Stripe Checkout Session is created with:
   - `mode: "subscription"`
   - `payment_method_types: ["card"]`
   - `line_items: [{ price: STRIPE_BASIC_MONTHLY_PRICE_ID, quantity: 1 }]`
   - `customer` or `customer_email`
   - `client_reference_id` set to stable local profile id when available, otherwise email
   - metadata on both session and `subscription_data`
   - `subscription_data.trial_period_days = 7` to preserve the current "7 dias gratis" promise
   - success URL back to `/gateway?checkout=success`
   - cancel URL back to `/gateway?checkout=cancelled`
6. Email sends the Checkout Session URL.
7. Stripe webhook verifies the signature and upserts the local subscription mirror.
8. Activation happens from webhook evidence only, never from the Checkout success redirect.
9. Cancellation page calls Stripe and lets the webhook reconcile `Profile.status`.

### Stripe Event Policy

| Event | Local Action |
|-------|--------------|
| `checkout.session.completed` | Retrieve/expand subscription and customer; upsert local `Subscription`; activate profile if subscription is `trialing` or `active`; store checkout session id. |
| `customer.subscription.created` | Upsert local `Subscription`; activate profile if status is `trialing` or `active`. |
| `customer.subscription.updated` | Upsert local `Subscription`; set profile active for `trialing` or `active`; log `past_due`; set inactive for `unpaid`, `canceled`, or `incomplete_expired`. |
| `customer.subscription.deleted` | Upsert final subscription data when present; set profile inactive. |
| `invoice.payment_failed` | Log with customer/subscription ids; mark profile inactive only if retrieved subscription status is `unpaid`, `canceled`, or `incomplete_expired`; for `past_due`, keep current access during Stripe retry window unless the business decides otherwise. |

### Reliability Requirements

- Verify all Stripe webhooks with `stripe.webhooks.constructEvent` and the raw request body.
- Return `2xx` only after local persistence succeeds for events that change access.
- Store `lastStripeEventId` or a processed-event ledger to handle duplicate webhook delivery.
- Use Stripe ids as reconciliation keys: `stripeCustomerId`, `stripeSubscriptionId`, and `stripeCheckoutSessionId`.
- Log every external Stripe call with non-secret ids, plan, email, and status.
- Never log secret keys, full request headers, full card data, or raw Stripe signatures.
- If webhook receives an event without resolvable profile metadata/customer/email, log `ERROR`, store enough event context for repair if a ledger exists, and return a non-2xx only when retry can recover.
- Use Stripe test mode and Stripe CLI before production endpoint registration.

### Data Model Direction

Use a Stripe-shaped `Subscription` document. No backward compatibility or migration path is required because the product currently has no users.

Required fields:

| Field | Purpose |
|-------|---------|
| `email` | Human reconciliation and fallback profile lookup |
| `profileId` | Preferred local profile linkage when created before checkout |
| `plan` | Local plan enum |
| `status` | Stripe subscription status |
| `stripeCustomerId` | Stripe Customer id |
| `stripeSubscriptionId` | Stripe Subscription id |
| `stripeCheckoutSessionId` | Initial activation Checkout Session id |
| `stripePriceId` | Price used for the subscription |
| `currentPeriodStart` / `currentPeriodEnd` | Billing window mirror |
| `cancelAtPeriodEnd` / `canceledAt` | Cancellation state |
| `trialStart` / `trialEnd` | Preserve the 7-day trial state |
| `latestInvoiceId` | Invoice reconciliation |
| `lastStripeEventId` / `processedStripeEventIds` | Idempotency |
| `raw` | Optional bounded Stripe snapshot for support, excluding secrets |

### Operational Setup

- Create one Stripe Product for AcelerAi Basic.
- Create one recurring monthly BRL Price for R$29.99.
- Configure Checkout to collect credit cards only for this integration.
- Configure the Stripe webhook endpoint to point at `/api/webhook/payment/stripe`.
- Subscribe the endpoint to `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, and `invoice.payment_failed`.
- Enable Stripe Billing retry settings/Smart Retries in Dashboard for card failures.
- Keep Nuvem Fiscal unchanged for this feature unless a later invoice feature consumes Stripe invoice events.

### Constraints

- Keep only credit cards.
- Keep only monthly subscriptions.
- Keep only the Basic plan active.
- Keep Auth0 as identity provider.
- Keep MongoDB `Profile.status` as the app authorization switch.
- Keep activation webhook-driven; redirect success pages are informational only.
- Do not preserve legacy payment-provider compatibility.
- Do not build a custom card form; use Stripe-hosted Checkout for PCI scope reduction and reliability.

### Out of Scope

- Plan upgrades/downgrades.
- Annual plans.
- PIX, boleto, debit, wallets, or bank debits.
- Customer billing portal unless added in a later feature.
- Existing subscription migration from the legacy provider.
- NFSe automation changes.
- Unit test framework setup.

---

## Dependencies

### Feature Dependencies

- `wiki::subscription-payment::mental-model`
- `code::src/app/gateway/page.tsx::Gateway`
- `code::src/app/api/auth/register/route.ts::POST`
- `code::src/models/Profile.ts::Profile`

### External Dependencies

- Stripe Node SDK package (`stripe`)
- Stripe Secret Key
- Stripe Webhook Signing Secret
- Stripe monthly Basic Price ID
- Stripe webhook endpoint registered in Dashboard
- AWS SES remains required for activation emails
- Auth0 remains required for session and token validation
- MongoDB remains required for profile/subscription persistence

---

## Technical Considerations

### Performance

- Checkout Session creation happens during registration and inactive-user email resend paths; avoid unnecessary Customer duplication by reusing a stored `stripeCustomerId` or searching by email.
- Webhook handlers should do only reconciliation work and return quickly; defer non-critical emails or analytics if they are added later.
- Use targeted MongoDB indexes on `email`, `stripeCustomerId`, `stripeSubscriptionId`, and processed event ids if a ledger collection is introduced.

### Security

- Use Stripe-hosted Checkout instead of collecting card data in the app.
- Verify webhook signatures using `STRIPE_WEBHOOK_SECRET`.
- Use server-only `STRIPE_SECRET_KEY`; never expose it to client components.
- Keep `STRIPE_BASIC_MONTHLY_PRICE_ID` server-side unless a future client UI needs it.
- Treat Checkout success redirects as untrusted.
- Do not log secrets, Authorization headers, Stripe signatures, or raw request headers.
- Keep existing Auth0 token validation for registration.

### Backward Compatibility

- None required. Legacy payment-provider code, fields, routes, constants, and environment variables were deleted or replaced outright.

---

## API Contract

```text
POST /api/auth/register
- Auth: Bearer Auth0 access token, unchanged.
- Request body: existing RegisterBody shape, unchanged.
- Behavior: creates Profile as INACTIVE and sends Stripe Checkout activation link by email.
- Response: preserves existing success/error status semantics where practical.

POST /api/webhook/payment/stripe
- Auth: Stripe webhook signature header.
- Body: raw Stripe event payload.
- Behavior: idempotently reconciles Subscription and Profile.status from Stripe events.
- Response: 2xx after successful reconciliation, 4xx for invalid signature, 5xx for retryable persistence failures.

/config/cancel-subscription/confirm
- Auth: Auth0 session, unchanged.
- Behavior: requests Stripe cancellation for the current user's subscription and logs out after success.
```

## Source Evidence

- `graphify-out/GRAPH_REPORT.md` groups `Gateway`, `POST`, `ConfirmCancelPage`, `sendPaymentEmail`, `createSubscription`, and `Subscription` in the User Config & Actions/Auth & Consent areas.
- `src/app/gateway/page.tsx` implements the no-user, inactive-user, and active-user gateway branches.
- `src/app/api/auth/register/route.ts` creates the inactive profile, Stripe Checkout Session, and payment email.
- `src/app/api/webhook/payment/stripe/route.ts` is the current activation/deactivation path.
- `src/app/config/cancel-subscription/confirm/page.tsx` cancels the Stripe subscription.
- `src/models/Profile.ts` stores the app-level authorization status and payment subscription id.
- `src/models/Subscription.ts` is the Stripe subscription mirror.
- Stripe docs: Checkout subscription integrations, subscription webhooks, webhook duplicate handling/signature verification, and subscription status semantics.

## Glossary

| Location | Type | Description |
|----------|------|-------------|
| `feature::stripe-subscription-migration::ac-1` | acceptance | Remove every legacy payment-provider runtime/payment surface. |
| `feature::stripe-subscription-migration::ac-2` | acceptance | Create Stripe monthly card Checkout Sessions for Basic subscriptions. |
| `feature::stripe-subscription-migration::ac-3` | acceptance | Preserve the current user-facing registration and activation workflow. |
| `feature::stripe-subscription-migration::ac-4` | acceptance | Verify and idempotently process Stripe webhooks. |
| `feature::stripe-subscription-migration::ac-5` | acceptance | Map Stripe subscription statuses to `Profile.status`. |
| `feature::stripe-subscription-migration::ac-6` | acceptance | Replace cancellation with Stripe cancellation. |
| `feature::stripe-subscription-migration::ac-7` | acceptance | Use Stripe-shaped subscription persistence. |
| `feature::stripe-subscription-migration::ac-8` | acceptance | Update activation email copy and link source. |
| `feature::stripe-subscription-migration::ac-9` | acceptance | Document required Stripe env values. |
| `wiki::subscription-payment::mental-model` | wiki | Current payment mental model to preserve while swapping providers. |
| `code::src/app/gateway/page.tsx::Gateway` | source | Gateway orchestration for no-user, inactive, and active states. |
| `code::src/app/gateway/form.tsx::GatewayForm` | source | Registration form and Basic monthly plan selection. |
| `code::src/app/api/auth/register/route.ts::POST` | source | Registration API endpoint that creates payment and profile records. |
| `code::src/lib/subscription.ts::createSubscription` | source | Provider-specific subscription creation helper to replace with Stripe. |
| `code::src/lib/emailService.ts::sendPaymentEmail` | source | SES payment activation email sender. |
| `code::src/app/api/webhook/payment/stripe/route.ts::POST` | source | Stripe webhook route. |
| `code::src/app/config/cancel-subscription/confirm/page.tsx::ConfirmCancelPage` | source | Cancellation flow to retarget to Stripe. |
| `code::src/models/Profile.ts::Profile` | source | Profile model carrying app authorization status and subscription linkage. |
| `code::src/models/Subscription.ts::Subscription` | source | Subscription mirror model to reshape for Stripe. |
