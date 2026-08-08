# Job Search (Encontrar Vagas)

## Summary

Screen where users search job openings by keyword. It is a **launchpad to LinkedIn searches**, not a job feed: the keyword is prefilled from the persona's `jobSearchKeyword`, and the screen renders curated LinkedIn deep links (posts today / this week / this month, optional international toggle) that open in a new tab. Pure client component, no backend call.

## Mental Model

**No feed, only deep links.** `buildVagaUrl()` composes a LinkedIn content-search URL with the keyword wrapped in quotes plus the hiring word (`"contratando"` for pt-BR, `"hiring"` when the international toggle is on) and a `datePosted` facet. The three result cards are those links; the "Recomendado" badge marks the 24h one. A fake 700ms loading state simulates the search.

**Layout model.** The screen is content, not a form, so it uses the same full-bleed desktop pattern as the chat: the container escapes the profile layout's padded `<main>` with mirrored negative margins that cancel only the gap beyond the fixed `SideBar` (`md:-ml-16 lg:-ml-32` — see `wiki::chat-coach::The escape-hatch constraint`) plus the right/mobile padding (`-mx-8 md:-mr-14 lg:-mr-20`), and the result cards render as a responsive grid (`1` column on mobile, `2` on md, `3` on lg) instead of a narrow `max-w-lg` single column. The search form stays compact (`max-w-md`), left-aligned.

**The escape-hatch constraint** (shared with `wiki::chat-coach::Layout model`): the negative margins mirror only the gap between the fixed `SideBar` (`w-64` = 256px) and the `<main>` content (`md:ml-80` → `md:-ml-16`, `lg:ml-96` → `lg:-ml-32`), never the full margin — cancelling the full margin slides content under the sidebar.

## Anchors

- `code::src/components/vagaSearch.tsx::VagaSearch` — client component: keyword state, international toggle, results grid
- `code::src/components/vagaSearch.tsx::buildVagaUrl` — builds LinkedIn search URL (keyword + hiring word + datePosted facet)
- `code::src/components/vagaSearch.tsx::buildVagaLinks` — the three curated result cards (today/week/month)
- `code::src/app/profile/[profile_id]/vagas/page.tsx::Page` — route that seeds `initialKeyword` from persona
- `code::src/app/profile/[profile_id]/layout.tsx::ProfileLayout` — profile shell whose `<main>` padding the screen escapes (read-only constraint)
- `feature::vagas-fullscreen-layout::ac-1` — full-bleed expansion

## Decisions

- **2026-08-07 — Full-bleed responsive grid.** The results previously rendered as a `max-w-lg` (512px) single column inside a `max-w-3xl` container — the same "iframe" problem the chat had. Container now escapes the layout padding (gap-only, respecting the `w-64` sidebar); results use a 1/2/3-column responsive grid.

## Open Questions

- None. The screen is intentionally link-only; a real job feed would be a new feature.

## Evidence

- `src/components/vagaSearch.tsx` — container classes, grid, URL builders
- `src/app/profile/[profile_id]/vagas/page.tsx` — keyword seeding from persona
- `src/lib/job-search-keyword.ts` — keyword extraction (persona input source)
