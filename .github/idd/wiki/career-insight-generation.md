# Career Insight Generation

## Summary

Users answer 10 career-oriented questions (current role, experience, goals, etc.) plus an optional free-text field. A POST to `/api/insight` sends these to OpenAI (gpt-5-nano via LangChain) which returns a structured JSON insight object. The insight is persisted as a CareerInsight document and a CareerRoadmap document is auto-created from the roadmap steps embedded in the insight. Insight generation is limited to one successful report per user per rolling 24-hour window unless the profile bypass flag is enabled. Subsequent `/api/roadmap` calls generate additional roadmap steps when the user finishes the current set, with one corrective retry available during the first 24 hours after the originating insight.

## Mental Model

The insight is the primary artifact: a full-page rendered report with hero, market snapshot, compensation data, global opportunities, big-tech hiring, a 6-step roadmap, and a CTA linking to Udemy courses. It is generated in a single LLM call.

The roadmap is a secondary artifact extracted from the insight's embedded `roadmap.steps`. Each step has `step`, `title`, `description`, and `status` (PENDING/DONE). When all steps are done, the user can request "proximos passos" — a new LLM call generates additional steps appended to the existing roadmap array. The LLM receives the old steps as context so it does not repeat them. Before completion, the user may use one corrective roadmap retry during the first 24 hours after the insight was created; that retry is tracked on the roadmap document.

A separate Pages Router page (`/profile/[id]/output/[output_id]`) renders the full insight report with scroll-triggered fade-in animations. The roadmaps page is an App Router page with step-level checkboxes that call a server action.

## Anchors

- `code::src/app/api/insight/route.ts::POST` — Insight generation endpoint, validates auth + user status + creates CareerInsight + CareerRoadmap
- `code::src/app/api/roadmap/route.ts::POST` — Roadmap extension endpoint, generates next steps via LLM
- `code::src/lib/ai-generation-guardrails.ts::getInsightGuardrailState` — Shared insight cooldown policy
- `code::src/lib/ai-generation-guardrails.ts::getRoadmapGuardrailState` — Shared roadmap completion and retry policy
- `code::src/lib/llm.ts::generateInsight` — LangChain ChatOpenAI call with system + user prompt
- `code::src/lib/llm.ts::generateRoadmap` — LangChain call for roadmap extension
- `code::src/lib/prompts.ts::getSystemPrompt` — System prompt instructing the model to output structured JSON
- `code::src/models/Profile.ts::ProfileSchema` — Profile fields include insight cooldown timestamp and developer bypass flag
- `code::src/models/CarrerInsight.ts::CareerInsightSchema` — Mongoose schema for insight data
- `code::src/models/CareerRoadmap.ts::CareerRoadmapSchema` — Mongoose schema with embedded steps and corrective retry marker
- `code::src/pages/profile/[profile_id]/output/[output_id]/index.tsx::Page` — Pages Router insight render (getStaticProps + fallback blocking)
- `code::src/app/profile/[profile_id]/roadmaps/[roadmap_id]/page.tsx::Page` — Roadmap detail with checkboxes + progress bar + "next steps" button

## Decisions

| Decision | Rationale | Date |
|----------|-----------|------|
| Single LLM call for full insight | Avoids multi-call orchestration complexity; model can produce the full report in one structured JSON | 2026-07-04 |
| Roadmap steps embedded in insight | Simple extraction from the same JSON; avoids separate LLM calls for initial steps | 2026-07-04 |
| Roadmap extension via separate `generateRoadmap` | Same prompt shape but receives old steps to avoid repetition, appends to array | 2026-07-04 |
| Daily insight cooldown replaces UI token meter | Users understand time-based access more easily than an abstract credit counter, while server enforcement reduces AI spam | 2026-07-04 |
| One corrective roadmap retry | Allows a user to recover from an unhelpful roadmap without opening unlimited repeat generations | 2026-07-04 |
| Output page uses Pages Router (getStaticProps) | Likely predates App Router or was migrated early; still on fallback: blocking | 2026-07-04 |

## Evidence

- `src/lib/prompts.ts` — Contains `insightExample` (the full expected JSON shape), system prompt, user prompt, and roadmap prompts
- `src/lib/ai-generation-guardrails.ts` — Shared server and UI eligibility logic for cooldowns and retries
- `src/types/data.d.ts` — TypeScript type `InsightType` matching the LLM output shape
- `src/app/actions/career_roadmap.ts::toggleStepStatus` — Server action for step checkbox toggle
- `src/components/roadmap.tsx::RoadmapUpdateButton` — Client component triggering roadmap extension
