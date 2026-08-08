# Chat Coach

## Summary

Career Coach chat: a ChatGPT-like interface in pt-BR where users converse with an AI career coach. Sessions and messages live in client memory only (lost on refresh — no persistence). Streaming via SSE over `POST /api/chat`, token budget and daily session limits enforced server-side, and the LLM system prompt is enriched (read-only) from the user's Persona. The UI lives inside the profile shell (`src/app/profile/[profile_id]/chat/`).

## Mental Model

**State model.** The chat is a self-contained client component. `ChatPage` owns all state: the session list, the active session's messages, the composer input, and the streamed assistant response. A `sessionMessagesRef` map keeps per-session messages so switching sessions restores the conversation without persistence. Sessions get an in-memory id (`cs_...`) and are never stored.

**Streaming model.** `POST /api/chat` streams the response via SSE. Each chunk updates the active assistant bubble in place; React 18+ auto-batching makes each reader tick a single render. A final `sessionData` payload carries token consumption (`promptTokens`, `completionTokens`, `totalTokens`) and the plan's `tokenLimit`, rendered as a progress bar above the composer.

**Usage guardrails.** Availability is server truth: `GET /api/chat/usage` returns whether the user can start a new session (plan gate + daily session limit). The client mirrors it for the UI (buttons, empty state) but never enforces.

**Layout model.** The chat is one flex panel: conversation list (left) + message area (right, with pinned composer). On mobile the conversation list is a drawer toggled by a hamburger; on desktop it is a static column. The panel is _full-bleed on desktop_: it escapes the padded `<main>` of the profile layout with negative margins mirrored from `layout.tsx`, spans from the fixed app `SideBar` to the viewport right edge, and fills the viewport height below the fixed `Header`. Message bubbles keep a readable centered column (`max-w-3xl`) so wide screens don't stretch text edge-to-edge.

**The escape-hatch constraint.** `layout.tsx`'s `<main>` uses `mx-8 md:ml-80 md:mr-14 lg:ml-96 lg:mr-20 mt-24 md:mt-30 mb-20`. The chat cancels only the _gap beyond the fixed `SideBar`_ (`w-64` = 256px): `md:ml-80` = 256 + 64 gap → `md:-ml-16`; `lg:ml-96` = 256 + 128 gap → `lg:-ml-32`. Right side and mobile are cancelled fully (`-mr-14`/`-mr-20`, `-mx-8`), plus `-mb-20`, and height is set to `h-[calc(100dvh-6rem)] md:h-[calc(100dvh-7.5rem)]` to match the top margin. The top margin is NOT cancelled because the fixed `Header` floats above it. Cancelling the full left margin (`-ml-80`/`-ml-96`) would slide content under the sidebar — never do that.

## Anchors

- `code::src/app/profile/[profile_id]/chat/page.tsx::ChatPage` — main chat page, owns all state, full-bleed desktop panel
- `code::src/components/ChatSidebar.tsx::ChatSidebar` — conversation list; drawer on mobile, static column on desktop
- `code::src/components/ChatComposer.tsx::ChatComposer` — pinned composer with 500-char limit and token budget bar
- `code::src/components/ChatMessage.tsx::ChatMessage` — user/assistant bubbles
- `code::src/lib/chat-api.ts::streamChatMessage` — SSE streaming client
- `code::src/app/api/chat/route.ts::POST` — SSE endpoint: auth, persona enrichment, usage enforcement
- `code::src/app/profile/[profile_id]/layout.tsx::ProfileLayout` — profile shell whose `<main>` padding the chat escapes (read-only constraint)
- `feature::chat-fullscreen-layout::ac-1` — desktop full-bleed expansion
- `feature::chat-notes::ac-1` — in-memory-only persistence stance

## Decisions

- **2026-08-07 — Desktop layout: embedded box → full-bleed panel.** The chat previously rendered as a `max-w-3xl mx-auto min-h-[75vh]` card inside the padded `<main>`, reading as a small iframe on desktop. The container now escapes the layout padding with mirrored negative margins (gap-only, respecting the `w-64` sidebar) and fills the viewport height; message text stays in a centered `max-w-3xl` column for readability. Mobile (drawer) is unchanged. Constraint: the mirrored classes must track `layout.tsx`'s margins.

## Open Questions

- Should the chat eventually offer an immersive mode that hides the global `Header`/`SideBar` shell entirely? Not requested; the shell stays for product navigation.

## Evidence

- `src/app/profile/[profile_id]/chat/page.tsx` — container classes, in-memory session state, stream handling
- `src/app/profile/[profile_id]/layout.tsx` — `<main>` padding the chat escapes
- `src/components/ChatSidebar.tsx`, `src/components/ChatComposer.tsx`, `src/components/ChatMessage.tsx` — panel pieces
- `src/lib/chat-api.ts`, `src/app/api/chat/route.ts` — SSE streaming + usage contract
