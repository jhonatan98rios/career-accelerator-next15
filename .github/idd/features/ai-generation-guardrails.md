# Feature: AI Generation Guardrails

> **Status**: `implemented`

This file is the primary execution and maintenance contract for AI generation limits on insights and roadmap extensions.

## What

Replace the hardcoded token meter with enforceable generation guardrails that reduce AI spam while still allowing one corrective roadmap retry.

## Acceptance Criteria

- [x] AC-1: Insight generation is limited to 1 successful report per user per rolling 24-hour window, enforced server-side in `POST /api/insight`.
      Verify: `rg -n "24-hour|24 hour|insight.*limit|lastInsight|canGenerateInsight|NextResponse.json\\(\\{ error:.*insight" src/app/api/insight src/lib src/models`
- [x] AC-2: Roadmap extension is allowed only when the current roadmap is 100% complete, and one additional roadmap retry is allowed within 24 hours of the originating insight even if the roadmap is disliked.
      Verify: `rg -n "100%|all steps|retry|roadmap.*limit|canGenerateRoadmap|retryWindow|originating insight" src/app/api/roadmap src/app/profile src/components src/models`
- [x] AC-3: The profile UI removes the fake token count and instead shows actionable lock-state messaging with the next unlock time or retry availability.
      Verify: `rg -n "unlock|disponivel|amanha|pr[oó]xima gera[cç][aã]o|retry|tokens=|credit" src/app/profile src/components`
- [x] AC-4: Blocked generation attempts return clear, non-ambiguous API errors that the client surfaces without silently failing.
      Verify: `rg -n "429|403|locked|limit|retryAfter|unlockAt|Error while generating" src/app/api/insight src/app/api/roadmap src/components`
- [x] AC-5: Generation-limit state is persisted in MongoDB so refreshes, devices, and direct API calls all respect the same policy.
      Verify: `rg -n "lastInsight|lastRoadmap|retryCount|unlockAt|generationLimit|usage" src/models src/app/api src/lib`
- [x] AC-6: Developers can bypass AI generation limits by setting `Profile.skipAiGenerationGuardrails = true` directly in MongoDB; this flag has no UI control and defaults to `false`.
      Verify: `rg -n "skipAiGenerationGuardrails|bypass.*guardrail|guardrail.*bypass" src/models/Profile.ts src/app/api src/lib`

## TDD

Use the `rg` verification commands above as contract checks until the repo adopts a test framework. For any implementation pass, run each check Red -> Green and manually confirm the locked and unlocked UI states.

## Details

### Constraints

- Enforce limits on the server first; client-side disable states are guidance only.
- Keep the current insight -> roadmap flow intact.
- Prefer time-based and progress-based rules over abstract token math in the UI.
- Preserve one legitimate correction path for a bad roadmap.
- Add `skipAiGenerationGuardrails: boolean` to `Profile` for developer/admin use only; do not expose it in profile settings or registration UI.

### Out of Scope

- Subscription plan redesign.
- Multi-tier monthly token accounting.
- Pricing-page copy changes beyond removing misleading token claims if needed by implementation.

---

## Dependencies

### Feature Dependencies

- `wiki::career-insight-generation::mental-model`
- `code::src/app/api/insight/route.ts::POST`
- `code::src/app/api/roadmap/route.ts::POST`
- `code::src/app/profile/[profile_id]/layout.tsx::ProfileLayout`

### External Dependencies

- MongoDB persistence for per-user generation state
- `Profile.skipAiGenerationGuardrails` boolean bypass flag
- Auth0 session and bearer-token validation
- OpenAI usage remains unchanged behind the new guardrails

---

## Technical Considerations

### Performance

- Check generation eligibility before any LLM call.
- Store enough timestamps and counters to decide limits with one profile or roadmap lookup.

### Security

- Treat limit enforcement as an authorization rule, not a cosmetic UI rule.
- Do not trust client-reported completion or retry eligibility.
- Only trust the persisted `Profile.skipAiGenerationGuardrails` value after resolving the authenticated user server-side.

### Backward Compatibility

- Existing insights and roadmaps remain readable.
- Users without usage metadata should be treated as eligible on first guarded request.
- Existing profiles without `skipAiGenerationGuardrails` behave as `false`.

---

## API Contract

```text
POST /api/insight
- Auth: Bearer Auth0 access token, unchanged.
- Behavior: reject generation when the user already created an insight in the last rolling 24 hours, unless `Profile.skipAiGenerationGuardrails` is `true`.
- Failure shape: include a clear machine-readable limit reason plus the next unlock timestamp.

POST /api/roadmap
- Auth: Bearer Auth0 access token, unchanged.
- Behavior: allow generation only when the roadmap is complete, except for one retry within 24 hours of the originating insight, unless `Profile.skipAiGenerationGuardrails` is `true`.
- Failure shape: include a clear machine-readable limit reason plus retry or unlock context.

Profile model
- Add `skipAiGenerationGuardrails: boolean` with default `false`.
- No UI writes this field; developers may update it directly in MongoDB for test accounts.

Profile UI
- Replace token count with status text and button states derived from server-returned eligibility data.
```

## Glossary

| Location | Type | Description |
|----------|------|-------------|
| `feature::ai-generation-guardrails::ac-1` | acceptance | Limit each user to one insight generation per rolling 24-hour window. |
| `feature::ai-generation-guardrails::ac-2` | acceptance | Gate roadmap extension by completion, with one corrective retry window. |
| `feature::ai-generation-guardrails::ac-3` | acceptance | Replace the fake token meter with lock-state UX. |
| `feature::ai-generation-guardrails::ac-4` | acceptance | Surface blocked-generation errors clearly in API and UI. |
| `feature::ai-generation-guardrails::ac-5` | acceptance | Persist generation-limit state in MongoDB. |
| `feature::ai-generation-guardrails::ac-6` | acceptance | Allow developer/admin test accounts to bypass generation limits via MongoDB. |
| `code::src/app/api/insight/route.ts::POST` | source | Insight generation endpoint that will enforce the report cooldown. |
| `code::src/app/api/roadmap/route.ts::POST` | source | Roadmap generation endpoint that will enforce completion and retry rules. |
| `code::src/components/insightForm.tsx::InsightForm` | source | Client form that starts insight generation and must surface lock errors. |
| `code::src/components/roadmap.tsx::RoadmapUpdateButton` | source | Client button that requests additional roadmap steps. |
| `code::src/app/profile/[profile_id]/layout.tsx::ProfileLayout` | source | Current location of the hardcoded sidebar token prop. |
| `code::src/models/Profile.ts::ProfileSchema` | source | Profile persistence location for the developer bypass flag. |
| `wiki::career-insight-generation::mental-model` | wiki | Existing product flow for insight and roadmap generation. |
