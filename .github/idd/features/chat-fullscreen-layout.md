# Feature: Chat Full-Screen Desktop Layout

> **Status**: `partial` — AC-1 a AC-4 verdes; AC-5/AC-6 aguardam verificação visual manual; AC-7 build não verificável neste ambiente (Android/ARM, instrução explícita do usuário)

Expand the Career Coach chat UI to use the full desktop screen. Today the chat renders as a small centered card (`max-w-3xl`, `min-h-[75vh]`) inside the padded profile layout, reading as an embedded iframe. The chat panel becomes full-bleed on desktop — from the app SideBar to the viewport right edge, filling the height below the Header — while keeping readable message width and unchanged mobile behavior.

## What

Rebuild the chat page's layout shell so the conversation list and message area use the full available viewport on desktop, per `wiki::chat-coach::Layout model`.

## Acceptance Criteria

- [x] AC-1 — O container do chat perde o cap de largura (`max-w-3xl mx-auto flex min-h-[75vh]`) e passa a preencher toda a largura disponível do `<main>` via margens negativas espelhadas do layout.
      Verify: `grep -q "max-w-3xl mx-auto flex" "src/app/profile/[profile_id]/chat/page.tsx" && echo "STILL-CAPPED" || echo "UNCAPPED"` — Red: `STILL-CAPPED`; Green: `UNCAPPED` — **verde em 2026-08-07**
- [x] AC-2 — O chat ocupa a altura total da viewport abaixo do header, sem gerar scroll vertical de página.
      Verify: `grep -q "100dvh" "src/app/profile/[profile_id]/chat/page.tsx" && grep -q -- "-mb-20" "src/app/profile/[profile_id]/chat/page.tsx" && echo "FULL-HEIGHT" || echo "NOT-FULL-HEIGHT"` — Red: `NOT-FULL-HEIGHT`; Green: `FULL-HEIGHT` — **verde em 2026-08-07**
- [x] AC-3 — As margens negativas espelham exatamente o padding do `<main>` do profile layout (mobile, md e lg) e o topo NÃO é cancelado (o Header fixo flutua acima).
      Verify: `grep -q -- "-mx-8 md:-ml-80 md:-mr-14 lg:-ml-96 lg:-mr-20" "src/app/profile/[profile_id]/chat/page.tsx" && echo "MIRRORED" || echo "NOT-MIRRORED"` — Red: `NOT-MIRRORED`; Green: `MIRRORED` — **verde em 2026-08-07**
- [x] AC-4 — As mensagens mantêm coluna de leitura confortável em telas largas (wrapper interno `max-w-3xl mx-auto` ao redor da lista de mensagens e do erro), em vez de esticar até as bordas.
      Verify: `grep -A7 'overflow-y-auto px-4 py-4' "src/app/profile/[profile_id]/chat/page.tsx" | grep -q "max-w-3xl mx-auto" && echo "READABLE-COLUMN" || echo "NO-COLUMN"` — Red: `NO-COLUMN`; Green: `READABLE-COLUMN`; confirmed visually at 1920px width (manual) — **verde (grep) em 2026-08-07**
- [ ] AC-5 — Composer permanece fixo no rodapé do chat em altura cheia, com textarea centralizado em `max-w-3xl`.
      Verify: manual — em tela 1920px, o composer fica colado à base do viewport e o textarea não estica
- [ ] AC-6 — Comportamento mobile inalterado: hamburger abre o drawer de conversas; sem overflow horizontal no container.
      Verify: manual — em viewport < 768px, hamburger + drawer funcionam e o chat fica full-bleed sem scroll horizontal
- [ ] AC-7 — Sem regressão: testes e build passam.
      Verify: `npm test` e `npm run build` — ambos exit 0 — **npm test verde (fail 0) em 2026-08-07; `npm run build` NÃO verificável neste ambiente (Android/ARM): falha em binários nativos e coleta de dados de rota sem env real — pulado por instrução explícita do usuário**

## TDD

Red / Green / Anchor conforme `wiki::red-green-tdd::mental-model`.

Cada AC executa o `Verify` antes (deve falhar) e depois (deve passar) da implementação.

## Details

### Constraints

- Alterar apenas `src/app/profile/[profile_id]/chat/page.tsx` — nenhum outro arquivo de fonte muda (layout, sidebar, composer, message são leitura-only)
- Margens negativas devem espelhar `code::src/app/profile/[profile_id]/layout.tsx::ProfileLayout` `<main>`: `mx-8 md:ml-80 md:mr-14 lg:ml-96 lg:mr-20 mt-24 md:mt-30 mb-20`
- Altura do container: `h-[calc(100dvh-6rem)] md:h-[calc(100dvh-7.5rem)]` casando com `mt-24`/`md:mt-30` — o topo não é cancelado porque o Header fixo (z-50) flutua acima
- `-mb-20` cancela a margem inferior do `<main>` para não gerar scroll vertical de página
- Bubbles (`ChatMessage`) permanecem `max-w-[80%]`; a coluna interna `max-w-3xl` já limita a largura útil
- Composer (`ChatComposer`) já usa `max-w-3xl mx-auto` internamente — sem mudanças
- UI strings em pt-BR; comentários em inglês (`code::.github/idd/learned.md` style rule)

### Out of Scope

- Alterações em `layout.tsx`, `ChatSidebar`, `ChatComposer`, `ChatMessage`, `chat-api.ts` ou `api/chat/route.ts`
- Imersividade total (esconder Header/SideBar globais) — ver `wiki::chat-coach::Open Questions`
- Persistência de conversas, streaming, limites de uso — já cobertos por outras features
- Mobile drawer redesign — mantém o comportamento atual
- Largura do sidebar de conversas (`w-72`) — mantém

---

## Dependencies

### Feature Dependencies

- `wiki::chat-coach::Layout model` — modelo de layout full-bleed + constraint do escape-hatch
- `code::src/app/profile/[profile_id]/chat/page.tsx::ChatPage` — página alterada (único arquivo de fonte tocado)
- `code::src/app/profile/[profile_id]/layout.tsx::ProfileLayout` — padding do `<main>` que as margens negativas espelham (não alterado)

### External Dependencies

- Nenhuma nova. Tailwind CSS v4 já instalado (classes arbitrárias `h-[calc(100dvh-6rem)]` suportadas)

---

## Technical Considerations

### Performance

- Mudança puramente de layout (classes CSS) — zero impacto de runtime, render ou rede

### Security

- Nenhuma mudança de superfície: mesmo fluxo de autenticação, SSE e limites de uso

### Backward Compatibility

- Mobile (drawer) e comportamento de streaming/uso inalterados
- Se o padding do `<main>` do layout mudar, as classes espelhadas nesta página quebram visualmente — mitigado pelo `wiki::chat-coach` que documenta a constraint; manter AC-3 como âncora de verificação

---

## API Contract

Não aplicável — sem mudanças de contrato de API.

---

## Glossary

| Location                                                       | Type   | Description                                                           |
| -------------------------------------------------------------- | ------ | --------------------------------------------------------------------- |
| `code::src/app/profile/[profile_id]/chat/page.tsx::ChatPage`   | source | Página do chat — container full-bleed desktop (AC-1 a AC-6)           |
| `code::src/app/profile/[profile_id]/layout.tsx::ProfileLayout` | source | Shell do perfil — `<main>` com padding que o chat espelha (read-only) |
| `code::src/components/ChatSidebar.tsx::ChatSidebar`            | source | Lista de conversas — coluna estática em desktop, drawer em mobile     |
| `code::src/components/ChatComposer.tsx::ChatComposer`          | source | Composer fixo no rodapé, textarea `max-w-3xl`                         |
| `code::src/components/ChatMessage.tsx::ChatMessage`            | source | Bubbles com `max-w-[80%]` dentro da coluna de leitura                 |
| `wiki::chat-coach::Layout model`                               | wiki   | Modelo de layout full-bleed e constraint do escape-hatch              |
