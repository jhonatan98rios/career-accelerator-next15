# Feature: Chat Usage Control (V1)

> **Status**: `complete`

Daily session limits for the Career Coach chat. Backend-enforced, frontend-aware for UX.

## What

Control how many chat sessions a user can start per day based on their plan. The backend acts as the enforcement point; the frontend queries usage state to disable the "New session" button when the limit is reached.

## Acceptance Criteria

- [x] DailyUsage model exists with `(profileId, date)` unique index and `chat.sessionsStarted` counter.
      Verify: `grep -r "DailyUsage" src/models/DailyUsage.ts` — model exports DailyUsage, schema has compound unique index
- [x] PlanService centralizes plan limits (currently `chatSessionsPerDay: 1` for BASIC).
      Verify: `grep "chatSessionsPerDay" src/lib/plan-service.ts` — PLAN_LIMITS map keyed by Plan enum
- [x] UsageService provides `getTodayUsage`, `canStartChatSession`, `registerChatSession`.
      Verify: `grep "export async function" src/lib/usage-service.ts` — three exported async functions
- [x] GET /api/chat/usage returns `{ sessionsStarted, sessionsLimit, canStartSession }`.
      Verify: `grep "canStartSession" src/app/api/chat/usage/route.ts` — response includes canStartSession boolean
- [x] POST /api/chat enforces daily limit when `sessionId` is absent (new session).
      Verify: `grep "canStartChatSession\|registerChatSession" src/app/api/chat/route.ts` — both called in the !sessionId branch
- [x] POST /api/chat returns 429 when limit is exceeded.
      Verify: `grep "TOO_MANY_REQUESTS" src/app/api/chat/route.ts` — status 429 returned on limit hit
- [x] Frontend fetches usage on mount and disables "Nova conversa" when limit reached.
      Verify: `grep "fetchChatUsage\|canStartNew" src/app/profile/\[profile_id\]/chat/page.tsx` — usage state gates the new-session button
- [x] ChatSidebar shows limit message when `canCreate` is false.
      Verify: `grep "canCreate\|Limite diário" src/components/ChatSidebar.tsx` — conditional UI based on canCreate prop

## Details

### Constraints

- Sessions are in-memory only (no ChatSession MongoDB model) — the `sessionId` sent by the frontend is a client-generated opaque string used solely to signal "this is a new session" to the backend
- Only sessions-per-day counter is implemented; the nested `chat` block in DailyUsage is structured to accept future `tokensUsed` and `messagesSent` fields without migration
- All limit queries flow through PlanService; no hardcoded numbers in controllers or routes

### Out of Scope

- Token counting
- Message limits
- Character limits
- Billing integration
- Analytics
- Persisted chat sessions

---

## Dependencies

### Feature Dependencies

- Existing chat API route (`code::src/app/api/chat/route.ts::POST`)
- Existing Profile model with `plan` field (`code::src/models/Profile.ts::IProfile`)
- Existing Plan enum (`code::src/lib/enums.ts::Plan`)
- Existing chat page (`code::src/app/profile/[profile_id]/chat/page.tsx::ChatPage`)
- Existing ChatSidebar component (`code::src/components/ChatSidebar.tsx::ChatSidebar`)

### External Dependencies

- MongoDB (via Mongoose) — DailyUsage collection
- Auth0 (via `isAuthenticated`) — API route protection

---

## Technical Considerations

### Performance

- DailyUsage uses upsert pattern — single atomic operation for get-or-create + increment
- Frontend usage fetch is a lightweight GET; fails gracefully (sets usage to null, allows new sessions)

### Security

- Backend enforcement is mandatory — frontend gating is UX only
- Usage check happens after auth and profile validation
- `sessionId` from client is only used as a boolean signal (present = continuation, absent = new session), never trusted for authorization

### Backward Compatibility

- New model (DailyUsage), new services (plan-service, usage-service), new API route (chat/usage) — no existing files deleted
- Chat API route adds optional `sessionId` field — existing clients that don't send it will be treated as new sessions (and thus subject to limits)
- ChatSidebar gains optional props with defaults — existing callers unchanged

---

## Glossary

| Location | Type | Description |
|----------|------|-------------|
| `code::src/models/DailyUsage.ts::DailyUsage` | source | Mongoose model for daily usage counters, compound unique index on (profileId, date) |
| `code::src/lib/plan-service.ts::getPlanLimits` | source | Returns plan limit config for a given Plan enum value |
| `code::src/lib/usage-service.ts::getTodayUsage` | source | Upserts and returns today's DailyUsage document |
| `code::src/lib/usage-service.ts::canStartChatSession` | source | Checks if user can start another chat session today |
| `code::src/lib/usage-service.ts::registerChatSession` | source | Increments sessionsStarted counter for today |
| `code::src/app/api/chat/usage/route.ts::GET` | source | API endpoint returning current usage state for frontend |
| `code::src/app/api/chat/route.ts::POST` | source | Chat API with session-limit enforcement |
| `code::src/lib/chat-api.ts::fetchChatUsage` | source | Frontend client for GET /api/chat/usage |
| `code::src/lib/chat-api.ts::ChatUsage` | source | Response type for usage endpoint |
| `code::src/app/profile/[profile_id]/chat/page.tsx::ChatPage` | source | Chat page with usage-aware new-session gating |
| `code::src/components/ChatSidebar.tsx::ChatSidebar` | source | Sidebar with canCreate/sessionsRemaining props |
