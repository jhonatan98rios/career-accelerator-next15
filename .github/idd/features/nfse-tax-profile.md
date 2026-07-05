# Feature: NFS-e Tax Profile

> **Status**: `complete`

This file is the primary execution and maintenance contract for the NFS-e tax profile and manual-invoicing preparation feature.

## What

Collect structured Brazilian individual tax data during registration and account settings so the team can issue NFS-e manually later from Mongo-exported data.

## Acceptance Criteria

- [x] AC-1: The profile model stores structured tax and billing address data for Brazilian individual invoice recipients, while preserving existing profile identity, payment, and authorization fields.
      Verify: `rg -n "taxDocumentType|taxDocument|billingEmail|billingAddress|billingProfileCompletedAt|ibgeCityCode" src/models/Profile.ts`
- [x] AC-2: New-user registration collects and validates CPF, CEP, address number, street, neighborhood, city, state, IBGE city code, and optional complement before creating the inactive profile and Stripe Checkout subscription.
      Verify: `rg -n "taxDocument|billingAddress|ibgeCityCode|addressNumber|handleCpf|handleCep|viacep" src/app/gateway src/app/api/auth/register`
- [x] AC-3: Active users can review and update the same fiscal data from the account settings page without changing Auth0 identity or email ownership.
      Verify: `rg -n "billingAddress|taxDocument|billingProfileCompletedAt|updateUserData|session.user.email" src/app/profile/\\[profile_id\\]/config src/app/actions/user_config.ts`
- [x] AC-4: Fiscal-profile validation and normalization are centralized in a shared helper so registration, settings updates, and future export code use the same CPF/address rules.
      Verify: `rg -n "normalizeTaxProfile|isValidCpf|billingProfileCompletedAt|formatCpf|formatCep" src/lib/tax-profile.ts src/lib/tax-profile.test.ts`
- [x] AC-5: The persisted profile shape remains export-friendly for manual invoicing, with structured Mongo fields for billing recipient and address data rather than a single flattened address string.
      Verify: `rg -n "billingEmail|taxDocumentType|taxDocument|billingAddress|street|number|neighborhood|city|state|ibgeCityCode" src/models/Profile.ts src/app/api/auth/register/route.ts src/app/actions/user_config.ts`
- [x] AC-6: The feature explicitly avoids invoice-provider integration for now and documents manual issuance/export as the operational path.
      Verify: `rg -n "manual|Mongo|export|sem integracao|without invoice-provider integration|Nuvem Fiscal nao faz parte" .github/idd/features/nfse-tax-profile.md .github/idd/architecture.md`
- [x] AC-7: The feature documentation records the accounting assumptions, mandatory contador validation points, and rollout constraints before production issuance is enabled.
      Verify: `rg -n "Simples Nacional|LC 116|1\\.05|62\\.03-1/00|Manaus|contador|Nuvem Fiscal" .github/idd/features/nfse-tax-profile.md`

## TDD

Execute each acceptance criterion as a Red -> Green -> Anchor loop, per `wiki::red-green-tdd::mental-model`.

1. Red: run the criterion's `Verify` command and confirm it fails or misses the required implementation evidence.
2. Green: make the minimal implementation change and re-run `Verify` until it passes.
3. Anchor: update the Glossary and any affected wiki entries so the implemented symbols remain reachable.

Use unit tests around validation and normalization helpers, then do manual form smoke tests in the registration and account-settings flows.

## Details

### Tax And Accounting Assumptions

- Issuer: `Teixeira Desenvolvimento de Software LTDA`, CNPJ `42.855.933/0001-00`.
- Regime: Simples Nacional.
- Initial recipient scope: Brazilian individuals only, using CPF.
- Operational tax treatment: SaaS subscription as ISS/NFS-e, most likely LC 116 service item `1.05 - Licenciamento ou cessao de direito de uso de programas de computacao`.
- Current main CNAE evidence is `62.01-5-01` for custom software; accountant must validate whether standardized SaaS should add/use `62.03-1/00` or `62.02-3/00`.
- Do not hardcode Simples Nacional annex, Fator R, ISS rate, or municipal service code as tax truth; these values are operational configuration confirmed by accounting.

### Data Collection

- Replace the current flattened fiscal fields (`cpf`, `cep`, `address`, `address2`) with structured tax fields on `Profile`.
- Required person data: invoice name, CPF, billing email.
- Required address data: CEP, street, number, neighborhood, city, state, IBGE city code, country `BR`.
- Optional address data: complement.
- Keep collection in `/gateway` so new users provide invoice data before the subscription is created.
- Add the same fiscal section to `/profile/[profile_id]/config` so existing users can repair data before the next invoice.
- Use ViaCEP as the address autofill source, but keep user-entered correction possible where ViaCEP returns incomplete data.
- Keep the structured fields easy to flatten into CSV/Excel later without adding an invoice integration now.

### Manual Issuance Preparation

- The application collects and stores the exact recipient data needed for manual NFS-e issuance later.
- No webhook-driven invoice creation is required in this feature.
- No third-party invoice provider integration is required in this feature.
- Export to CSV/Excel can be added later on top of the structured Mongo fields introduced here.

### Constraints

- Keep Stripe as the payment source of truth.
- Keep MongoDB `Profile.status` as the app authorization switch.
- Keep first implementation limited to Brazilian individual recipients.
- Do not add invoice-provider integrations in this feature.
- Do not expose export or admin tooling to end users in this feature.

### Out of Scope

- CNPJ recipients and B2B retention rules.
- Foreign customers or export invoices.
- Retroactive automatic emission for old payments.
- CSV/Excel export UI or admin tooling.
- Plan upgrades, accounting reconciliation dashboards, or tax calculation engines.
- Replacing Stripe Checkout or changing subscription pricing.

---

## Dependencies

### Feature Dependencies

- `wiki::subscription-payment::mental-model`
- `code::src/app/gateway/form.tsx::GatewayForm`
- `code::src/app/api/auth/register/route.ts::POST`
- `code::src/models/Profile.ts::Profile`

### External Dependencies

- ViaCEP for address lookup.
- Accountant approval before production issuance.
- Confirmed Manaus municipal service code, taxation code, ISS rate, and any required NBS/classification values.

---

## Technical Considerations

### Performance

- Keep registration and settings validation logic in one shared helper to avoid drift between flows.
- Prefer storing normalized digits for CPF/CEP and structured address parts so export code stays simple.

### Security

- Do not log CPF, full address, Stripe signatures, Authorization headers, or full raw payloads.
- Validate ownership from Auth0 session/token before accepting registration or settings updates.
- Treat CPF and address as personal data; store only data needed for NFS-e issuance.
- Keep manual invoice data limited to what accounting actually needs.

### Backward Compatibility

- Existing profiles may have legacy `cpf`, `cep`, `address`, and `address2`; implementation should best-effort preserve them while introducing the new structured shape.
- Legacy incomplete profiles must be able to complete fiscal data from settings without blocking app access.

---

## API Contract

```text
POST /api/auth/register
- Auth: Bearer Auth0 access token, unchanged.
- Request body: add structured fiscal fields for CPF and billing address.
- Behavior: reject missing/invalid fiscal data before creating Profile or Stripe Checkout.
- Response: preserve current success/error status semantics where practical.

Server action updateUserData
- Auth: Auth0 session, unchanged.
- Input: account name plus structured fiscal fields from settings.
- Behavior: update only the authenticated user's profile.

No invoice API integration
- This feature does not add Nuvem Fiscal or any other invoice-provider API calls.
- Manual issuance and future CSV/Excel export are handled outside the app for now.
```

---

## Glossary

| Location | Type | Description |
|----------|------|-------------|
| `feature::nfse-tax-profile::ac-1` | acceptance | Structured Profile tax and billing address persistence. |
| `feature::nfse-tax-profile::ac-2` | acceptance | New-user fiscal data collection and validation in registration. |
| `feature::nfse-tax-profile::ac-3` | acceptance | Settings-page fiscal data maintenance for active users. |
| `feature::nfse-tax-profile::ac-4` | acceptance | Shared fiscal-profile validation and normalization rules. |
| `feature::nfse-tax-profile::ac-5` | acceptance | Export-friendly structured profile persistence. |
| `feature::nfse-tax-profile::ac-6` | acceptance | Explicit manual-invoicing scope without provider integration. |
| `feature::nfse-tax-profile::ac-7` | acceptance | Accounting assumptions and rollout constraints documentation. |
| `code::src/models/Profile.ts::Profile` | source | User profile model that will own recipient fiscal data. |
| `code::src/lib/tax-profile.ts::normalizeTaxProfile` | source | Shared normalization and validation for CPF and billing address fields. |
| `code::src/app/gateway/form.tsx::GatewayForm` | source | Registration form that will collect initial fiscal data. |
| `code::src/app/profile/[profile_id]/config/page.tsx::Page` | source | Settings page that will allow fiscal data correction. |
