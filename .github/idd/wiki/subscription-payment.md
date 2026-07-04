# Subscription & Payment Flow

## Summary

Users subscribe through Stripe-hosted Checkout. Registration creates an inactive profile, creates a monthly Basic card Checkout Session, sends the Checkout activation link by email, and keeps the user INACTIVE until Stripe webhook evidence activates access. Cancellation can be triggered by the user from the settings page and is reconciled by Stripe webhooks.

## Mental Model

Three legged stool: Auth0 (who you are) -> Stripe (what you pay) -> MongoDB profile status (what you can do). Status is INACTIVE until Stripe sends a signed subscription event showing `trialing` or `active`. The webhook is the only path that activates a user; Checkout success redirects are informational only.

User-facing cancellation calls Stripe from the server, requests period-end cancellation, then logs the user out. Local access follows the webhook-reconciled subscription status.

## Anchors

- `code::src/app/gateway/page.tsx::Gateway` — Registration orchestration (profile create + subscription + email)
- `code::src/app/gateway/form.tsx::GatewayForm` — Client-side registration form with CEP auto-fill
- `code::src/lib/subscription.ts::createSubscription` — Creates Stripe Checkout Session and returns the Checkout URL
- `code::src/lib/subscription.ts::cancelSubscription` — Requests Stripe subscription cancellation
- `code::src/lib/emailService.ts::sendPaymentEmail` — SES transactional email with Stripe Checkout link
- `code::src/app/api/webhook/payment/stripe/route.ts::POST` — Signed Stripe webhook receiver, drives status transitions
- `code::src/app/api/auth/register/route.ts::POST` — Registration endpoint, creates Profile + subscription + email
- `code::src/models/Subscription.ts::Subscription` — Mongoose model mirroring Stripe subscription state
- `code::src/app/config/cancel-subscription/confirm/page.tsx::ConfirmCancelPage` — User-initiated subscription cancellation
- `code::src/components/cancelSubscriptionButton.tsx::CancelSubscriptionButton` — Client-side cancel trigger with confirm dialog

## Decisions

| Decision | Rationale | Date |
|----------|-----------|------|
| Profile status not redirect-driven | User marked INACTIVE on registration; only Stripe webhook subscription status activates the user | 2026-07-04 |
| Subscription mirror in MongoDB | Enables authorization and support without round-tripping Stripe on every request | 2026-07-04 |
| Stripe metadata carries local ids | Links Stripe events to Profile using profile id, email, and Auth0 subject fallback | 2026-07-04 |
| Hosted Checkout only | Keeps card handling out of the app and limits PCI surface | 2026-07-04 |

## Open Questions

- Whether card retry grace periods should ever deactivate users while Stripe status is `past_due`.
- Whether a future Billing Portal flow should replace the current cancel-only settings action.

## Evidence

- `src/app/gateway/page.tsx` — All three states: no user -> registration form, inactive -> resend email, active -> check consent -> redirect
- `src/app/api/webhook/payment/stripe/route.ts` — Subscription lifecycle via signed Stripe webhook
- `src/models/Profile.ts` — `status: UserStatus.ACTIVE | INACTIVE`, `subscriptionId`, and `stripeCustomerId` linkage
- `src/models/Subscription.ts` — Stripe subscription mirror
