# Feature: Vagas Full-Screen Desktop Layout

> **Status**: `partial` — AC-1 a AC-3 e AC-5 verdes; AC-4 aguarda verificação visual manual

Expand the "Encontrar Vagas" screen to use the full desktop width. Today the results render as a `max-w-lg` (512px) single column inside a `max-w-3xl` container — the worst "iframe" case after the chat. The screen becomes full-bleed on desktop (same mirrored-negative-margins pattern as the chat) and the result cards become a responsive 1/2/3-column grid.

## What

Rebuild the layout shell of `VagaSearch` so the search results use the full available width on desktop, per `wiki::job-search-vagas::Layout model`.

## Acceptance Criteria

- [ ] AC-1 — O container perde `max-w-3xl mx-auto` e ganha as margens negativas espelhadas do `<main>` do profile layout.
      Verify: `grep -q -- "-mx-8 md:-ml-80 md:-mr-14 lg:-ml-96 lg:-mr-20" "src/components/vagaSearch.tsx" && echo "FULL-BLEED" || echo "CAPPED"` — Red: `CAPPED`; Green: `FULL-BLEED`
- [ ] AC-2 — Resultados deixam de ser coluna única `max-w-lg` e viram grid responsivo (1 col mobile, 2 md, 3 lg).
      Verify: `grep -q "md:grid-cols-2" "src/components/vagaSearch.tsx" && grep -q "lg:grid-cols-3" "src/components/vagaSearch.tsx" && ! grep -q "max-w-lg" "src/components/vagaSearch.tsx" && echo "GRID" || echo "SINGLE-COLUMN"` — Red: `SINGLE-COLUMN`; Green: `GRID`
- [ ] AC-3 — O skeleton de carregamento também usa o grid (mesmas colunas), sem saltar layout quando a resposta chega.
      Verify: `grep -B4 "animate-pulse" "src/components/vagaSearch.tsx" | grep -q "grid" && echo "SKELETON-GRID" || echo "SKELETON-LIST"` — Red: `SKELETON-LIST`; Green: `SKELETON-GRID`
- [ ] AC-4 — Form de busca (`max-w-md`), toggle internacional e estado vazio permanecem legíveis e alinhados à esquerda.
      Verify: manual — em 1920px, form/toggle à esquerda; em <768px, full-bleed sem overflow horizontal
- [x] AC-5 — Sem regressão: testes passam.
      Verify: `npm test` — exit 0 — **verde em 2026-08-07 (232 tests, 0 fail)**; `npm run build` NÃO verificável neste ambiente (Android/ARM) por instrução explícita do usuário

## TDD

Red / Green / Anchor conforme `wiki::red-green-tdd::mental-model`.

Cada AC executa o `Verify` antes (deve falhar) e depois (deve passar) da implementação.

## Details

### Constraints

- Alterar apenas `src/components/vagaSearch.tsx` — página e layout são read-only
- Margens negativas espelham `code::src/app/profile/[profile_id]/layout.tsx::ProfileLayout` `<main>`: `mx-8 md:ml-80 md:mr-14 lg:ml-96 lg:mr-20` (padrão idêntico ao `chat-fullscreen-layout`, sem topo/altura — a tela segue no fluxo normal da página)
- Manter `min-h-96` e o fluxo vertical natural (não usar `100dvh` aqui — não é uma tela de app)
- UI strings em pt-BR; comentários em inglês (`code::.github/idd/learned.md` style rule)

### Out of Scope

- Alterações em `layout.tsx`, `vagas/page.tsx`, `job-search-keyword.ts`
- Feed real de vagas (a tela é link-only para LinkedIn — ver `wiki::job-search-vagas::Open Questions`)
- Largura do form de busca (`max-w-md`) — mantém
- Comportamento dos cards (URLs, badges) — mantém

---

## Dependencies

### Feature Dependencies

- `wiki::job-search-vagas::Layout model` — modelo full-bleed + constraint do escape-hatch
- `code::src/components/vagaSearch.tsx::VagaSearch` — componente alterado (único arquivo de fonte tocado)
- `wiki::chat-coach::Layout model` — padrão de margens espelhadas já aplicado no chat (referência)

### External Dependencies

- Nenhuma nova. Tailwind CSS v4 já instalado

---

## Technical Considerations

### Performance

- Mudança puramente de layout (classes CSS) — zero impacto de runtime

### Security

- Nenhuma mudança de superfície: os links continuam `target="_blank"` com `rel="noopener noreferrer"`

### Backward Compatibility

- Mobile (1 coluna) e comportamento de busca inalterados
- Se o padding do `<main>` do layout mudar, as classes espelhadas quebram visualmente — constraint documentada em `wiki::job-search-vagas`

---

## API Contract

Não aplicável — sem mudanças de contrato de API.

---

## Glossary

| Location                                                       | Type   | Description                                                                  |
| -------------------------------------------------------------- | ------ | ---------------------------------------------------------------------------- |
| `code::src/components/vagaSearch.tsx::VagaSearch`              | source | Componente da tela — container full-bleed + grid de resultados (AC-1 a AC-4) |
| `code::src/components/vagaSearch.tsx::buildVagaUrl`            | source | Builder de URL do LinkedIn (inalterado)                                      |
| `code::src/components/vagaSearch.tsx::buildVagaLinks`          | source | Cards curados hoje/semana/mês (inalterado)                                   |
| `code::src/app/profile/[profile_id]/vagas/page.tsx::Page`      | source | Rota que semeia `initialKeyword` da persona (read-only)                      |
| `code::src/app/profile/[profile_id]/layout.tsx::ProfileLayout` | source | Shell do perfil — padding que a tela espelha (read-only)                     |
| `wiki::job-search-vagas::Layout model`                         | wiki   | Modelo de layout full-bleed e constraint do escape-hatch                     |
