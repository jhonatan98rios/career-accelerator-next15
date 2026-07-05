# Feature: Persona Profile

> **Status**: `implemented` — Phase 1 (model), Phase 2 (checkpoints CP-1 to CP-4), Phase 3 (prompt injection)

Data model and integration pipeline for a persistent, non-PII career persona that the system builds and evolves across sessions. The persona feeds into LLM prompt generation so insight quality reflects the user's accumulated career context, not just one-shot form answers.

## What

Introduce a `Persona` Mongoose model, four data-ingestion checkpoints (CP-1 to CP-4), and prompt-level injection into the insight-generation pipeline.

- **Phase 1**: `Persona` data model at `src/models/Persona.ts` (AC-1 to AC-10).
- **Phase 2**: Four checkpoints that populate/update the persona from user actions (AC-11 to AC-14).
- **Phase 3**: Persona data injected into the LLM system+user prompt via `formatPersonaForPrompt()` (AC-15).

## Why

Today each insight generation starts from a blank form. The 10 questions plus `manualDescription` are the only context the LLM receives. No data persists between sessions; the system forgets the user every time. A durable persona profile enables:

- Richer LLM context (career trajectory, study rhythm, technical level)
- No repeated recommendations (LLM sees what skills the user already has)
- Calibrated roadmap difficulty (beginner vs. 5-year experienced dev)
- Progress tracking (skills gained, role changes)
- Eventually: adaptive insights that compare "where you were" to "where you are"

## Acceptance Criteria

### Phase 1 — Data Model

- [x] AC-1: A `Persona` Mongoose model exists at `src/models/Persona.ts` with a TypeScript interface, schema, and model export following the project's existing model conventions.
      Verify: `rg -n "interface IPersona|PersonaSchema|export const Persona" src/models/Persona.ts`
- [x] AC-2: The `Persona` schema references `Profile` via `ObjectId` with a unique index so each user has at most one persona document.
      Verify: `rg -n "profile_id.*ObjectId.*ref.*Profile\|unique.*true" src/models/Persona.ts`
- [x] AC-3: The persona stores **career identity** fields.
      Verify: `rg -n "currentRole\|targetRole\|yearsOfExperience\|careerStage\|industries\|employmentStatus" src/models/Persona.ts`
- [x] AC-4: The persona stores **education** fields.
      Verify: `rg -n "educationLevel\|fieldOfStudy\|certifications\|currentlyStudying\|preferredLearningStyle" src/models/Persona.ts`
- [x] AC-5: The persona stores **technical skills** fields.
      Verify: `rg -n "hardSkills\|softSkills\|languages\|tools" src/models/Persona.ts`
- [x] AC-6: The persona stores **routine & availability** fields.
      Verify: `rg -n "weeklyStudyHours\|studySchedule\|preferredContentFormat" src/models/Persona.ts`
- [x] AC-7: The persona stores **goals & motivation** fields.
      Verify: `rg -n "shortTermGoal\|mediumTermGoal\|longTermGoal\|careerMotivation\|targetSalary\|willingToRelocate\|remotePreference" src/models/Persona.ts`
- [x] AC-8: The persona stores **progress tracking** fields.
      Verify: `rg -n "completedRoadmaps\|insightsGenerated\|skillsGained\|lastRoleChange" src/models/Persona.ts`
- [x] AC-9: **Zero PII** — the persona document contains no name, email, CPF, address, phone, billing data.
      Verify: `rg -n -i "name\|email\|cpf\|phone\|address\|billing\|tax_" src/models/Persona.ts` returns no matches
- [x] AC-10: `tsc --noEmit` succeeds without type errors.
      Verify: `npx tsc --noEmit 2>&1; echo "exit: $?"`

### Phase 2 — Data Ingest Checkpoints

- [x] AC-11 (CP-1): Registration seeds an empty persona doc.
      Verify: `rg -n "Persona" src/app/api/auth/register/route.ts` has 2 matches (import + create).
- [x] AC-12 (CP-2): Insight submission maps form answers → persona fields + increments counters.
      Verify: `rg -n "Persona.findOneAndUpdate" src/app/api/insight/route.ts` returns a match after insight creation.
- [x] AC-13 (CP-3): Roadmap step marked DONE adds the step title to `skillsGained` via `$addToSet`.
      Verify: `rg -n "skillsGained" src/app/actions/career_roadmap.ts` returns a match inside Persona.findOneAndUpdate.
- [x] AC-14 (CP-4): Roadmap extension increments `completedRoadmaps` counter.
      Verify: `rg -n "completedRoadmaps" src/app/api/roadmap/route.ts` returns a match inside Persona.findOneAndUpdate.

### Phase 3 — Prompt Injection

- [x] AC-15: Persona data flows into LLM prompts via `formatPersonaForPrompt()`.
      Verify: `rg -n "formatPersonaForPrompt" src/lib/llm.ts` returns a match; `rg -n "personaContext" src/lib/prompts.ts` returns a match; `rg -n "persona" src/app/api/insight/route.ts` includes the `generateInsight` call with persona param.

## TDD

Verification via `rg` pattern checks and `tsc --noEmit`.

- Phase 1 (Red): `rg "Persona" src/models/` returns no results → (Green): each AC pattern match returns hits.
- Phase 2 (Red): no Persona references in checkpoint files → (Green): each CP file has Persona import + mutation.
- Phase 3 (Red): no persona in LLM/generateInsight → (Green): persona param wired from route → llm → prompts.

## Details

### Phase 2 — Checkpoint Design

| CP   | File                                 | Trigger           | Action                                                                            |
| ---- | ------------------------------------ | ----------------- | --------------------------------------------------------------------------------- |
| CP‑1 | `src/app/api/auth/register/route.ts` | User signs up     | `Persona.create({ profile_id })` seeds empty doc                                  |
| CP‑2 | `src/app/api/insight/route.ts`       | Insight generated | Maps 9 form fields → persona `$set` + `$inc insightsGenerated, completedRoadmaps` |
| CP‑3 | `src/app/actions/career_roadmap.ts`  | Step toggled DONE | `$addToSet` step title → `skillsGained`                                           |
| CP‑4 | `src/app/api/roadmap/route.ts`       | Roadmap extended  | `$inc completedRoadmaps`                                                          |

All checkpoints use `upsert: true` — legacy users without a persona document get one auto-created on first write.

### Phase 3 — Prompt Integration

`formatPersonaForPrompt()` in `src/lib/llm.ts` converts the persona document into a natural-language "User Profile" block injected via `{personaContext}` in the user prompt template.

- Only fields with non-empty values are included (empty persona → empty block).
- System prompt instructs the LLM: _"Use the User Profile to avoid recommending skills the user already has and to calibrate roadmap difficulty to the user's experience level."_
- Replaced hardcoded "user has no prior experience" with calibrated instruction.

### Constraints

- Follow existing model conventions: `I{Name}` interface, `{Name}Schema`, `export const {Name}` with `mongoose.models` guard.
- Place the file at `src/models/Persona.ts` (singular PascalCase per `learned.md` naming rule).
- Use `Schema.Types.ObjectId` with `ref: "Profile"` and `unique: true` for the profile link.
- Keep all fields optional except the profile reference — a persona can start empty and grow.
- Use `timestamps: true` for automatic `createdAt`/`updatedAt`.

### Data Model Rationale

Each group targets a specific weakness in the current LLM input:

| Group                  | Why it matters for insight quality                                                                                                                                                                                                                    |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Career identity        | The LLM needs to know _where the user is now_ (role, experience, stage) and _where they want to go_ (target role) to calibrate advice. Structured `yearsOfExperience` (number) replaces free-text `experience` so the LLM can do numeric comparisons. |
| Education              | Insight quality depends on knowing the user's foundation. A bootcamp grad needs different advice than a CS PhD. The `currentlyStudying` flag prevents the LLM from recommending courses the user is already taking.                                   |
| Technical skills       | Free-text `hardSkills` and `softSkills` in the current form are unstructured strings. Structured arrays let the LLM cross-reference skills with market demand, and `languages` unlocks international opportunity advice.                              |
| Routine & availability | A user with 5h/week needs a different roadmap than one with 20h/week. `studySchedule` and `preferredContentFormat` let the LLM tailor step descriptions ("dedicate your Saturday mornings to...").                                                    |
| Goals & motivation     | Replaces the current 3 free-text goal fields with structured + free-text hybrid. `careerMotivation` enum tells the LLM whether to emphasize salary negotiation or impact. `targetSalary` enables compensation benchmarking.                           |
| Progress tracking      | System-updated counters and timestamps that the LLM can reference ("since you started, you've completed 3 roadmaps and added 2 new skills...").                                                                                                       |

### Out of Scope

- UI changes (no form pre-filling, no persona editor, no insight-form integration)
- Auto-population from existing form answers (follow-up feature)
- Persona update API endpoint (model + checkpoints + prompt only)
- Migration of existing user data into the persona model
- Persona-aware guardrail or adaptive insight logic ("since you started, you've gained 3 new skills…")

---

## Dependencies

### Feature Dependencies

- `code::src/models/Profile.ts::Profile` — Persona references Profile via ObjectId
- `wiki::career-insight-generation::mental-model` — Persona is the missing "user memory" layer for the insight pipeline

### External Dependencies

- MongoDB/Mongoose (already in project)
- No new npm packages required

---

## Technical Considerations

### Performance

- Unique index on `profile_id` ensures single-document lookup per user.
- All fields are optional — the document stays lean when data is sparse.

### Security

- Zero PII by construction — the model contains no identifying fields.
- Persona is only accessible server-side behind Auth0 validation (follow-up: persona read/write will use the same `isAuthenticated` pattern as other API routes).

### Backward Compatibility

- New model file only — zero impact on existing code.
- Existing `Profile`, `CareerInsight`, `CareerRoadmap` models unchanged.
- `next build` must pass with the new file present (no dangling imports).

---

## API Contract

```text
Persona model (Mongoose, not an API route)

- profile_id: ObjectId ref Profile, unique, required, indexed
- currentRole: string, optional
- targetRole: string, optional
- yearsOfExperience: number, optional
- careerStage: enum (entry | mid | senior | lead | executive), optional
- industries: string[], optional
- employmentStatus: enum (employed | unemployed | freelancer | student | retired), optional
- educationLevel: enum (high_school | bootcamp | bachelors | masters | phd | other), optional
- fieldOfStudy: string, optional
- certifications: string[], optional
- currentlyStudying: boolean, optional
- preferredLearningStyle: enum (self_paced | structured | project_based | mentorship), optional
- hardSkills: string[], optional
- softSkills: string[], optional
- languages: { language: string, proficiency: enum (basic | intermediate | fluent | native) }[], optional
- tools: string[], optional
- weeklyStudyHours: number, optional
- studySchedule: enum (mornings | afternoons | evenings | weekends | flexible), optional
- preferredContentFormat: enum (video | text | interactive | audio), optional
- shortTermGoal: string, optional
- mediumTermGoal: string, optional
- longTermGoal: string, optional
- careerMotivation: enum (salary | growth | impact | stability | flexibility | passion), optional
- targetSalary: { currency: string, amount: number, period: enum (monthly | yearly) }, optional
- willingToRelocate: boolean, optional
- remotePreference: enum (remote | hybrid | onsite | flexible), optional
- completedRoadmaps: number, optional
- insightsGenerated: number, optional
- skillsGained: string[], optional
- lastRoleChange: Date, optional
- timestamps: true (createdAt, updatedAt)
```

## Glossary

| Location                                                    | Type       | Description                                                           |
| ----------------------------------------------------------- | ---------- | --------------------------------------------------------------------- |
| `feature::persona-profile::ac-1`                            | acceptance | Persona model file exists with interface, schema, and export.         |
| `feature::persona-profile::ac-11`                           | acceptance | CP-1: Registration seeds empty persona.                               |
| `feature::persona-profile::ac-12`                           | acceptance | CP-2: Insight submission populates persona + counters.                |
| `feature::persona-profile::ac-13`                           | acceptance | CP-3: Roadmap step DONE adds to skillsGained.                         |
| `feature::persona-profile::ac-14`                           | acceptance | CP-4: Roadmap extension increments completedRoadmaps.                 |
| `feature::persona-profile::ac-15`                           | acceptance | Persona injected into LLM prompts via formatPersonaForPrompt.         |
| `code::src/models/Persona.ts::IPersona`                     | source     | Persona TypeScript interface.                                         |
| `code::src/models/Persona.ts::PersonaSchema`                | source     | Mongoose schema definition.                                           |
| `code::src/models/Persona.ts::Persona`                      | source     | Exported Mongoose model.                                              |
| `code::src/models/Profile.ts::Profile`                      | source     | Referenced by Persona.profile_id.                                     |
| `code::src/app/api/auth/register/route.ts::POST`            | source     | CP-1: seeds Persona after Profile.create.                             |
| `code::src/app/api/insight/route.ts::POST`                  | source     | CP-2: maps form answers → persona; fetches persona → generateInsight. |
| `code::src/app/actions/career_roadmap.ts::toggleStepStatus` | source     | CP-3: $addToSet step title → skillsGained.                            |
| `code::src/app/api/roadmap/route.ts::POST`                  | source     | CP-4: $inc completedRoadmaps.                                         |
| `code::src/lib/llm.ts::formatPersonaForPrompt`              | source     | Converts persona doc → natural-language User Profile block.           |
| `code::src/lib/llm.ts::generateInsight`                     | source     | Accepts persona param, passes formatted text to prompt.               |
| `code::src/lib/prompts.ts::getUserPrompt`                   | source     | User prompt template includes {personaContext} placeholder.           |
| `wiki::career-insight-generation::mental-model`             | wiki       | The generation flow persona enriches.                                 |
