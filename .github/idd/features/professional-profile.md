# Feature: Perfil Profissional (Manual Profile Section + LLM Context)

> **Status**: `implemented`

Seção "Perfil Profissional" acessível por botão na navbar: 3 sub-seções editadas manualmente pelo usuário — "Quem sou eu" (texto corrido), "O que eu fiz" (lista de itens com título/período/descrição) e "O que eu pretendo fazer" (texto corrido). O perfil é injetado como contexto nas gerações de insight, currículo e chat. Sem escrita agêntica nesta versão.

## What

Página `/profile/[profile_id]/perfil-profissional` com edição manual de 3 campos persistidos em `ProfessionalProfile` (MongoDB):

1. **who — Quem sou eu**: string, texto corrido.
2. **experience — O que eu fiz**: array de `{ title, period, description }` (lista de experiências).
3. **goals — O que eu pretendo fazer**: string, texto corrido.

O conteúdo alimenta os fluxos de geração como contexto: `POST /api/insight`, `POST /api/resume` e `POST /api/chat`. Não há botão de gerar com IA nem guardrails de escrita agêntica nesta iteração (removidos por decisão do produto).

## Acceptance Criteria

- [x] AC-1: Modelo `ProfessionalProfile` em `src/models/ProfessionalProfile.ts` com `who: string`, `experience: IExperienceItem[]` (`title`/`period`/`description`) e `goals: string`, `profile_id` único ref `Profile`.
      Verify: `rg -n "who|experience|goals|profile_id" src/models/ProfessionalProfile.ts` ✓
- [x] AC-2: `formatProfessionalProfileForPrompt()` em `src/lib/professional-profile.ts` formata o perfil como texto natural para prompts, pulando seções vazias.
      Verify: `rg -n "export function formatProfessionalProfileForPrompt" src/lib/professional-profile.ts` ✓
- [x] AC-3: Testes do formatter em `src/lib/professional-profile.test.ts` cobrem texto corrido, itens de experiência (título/período/descrição), seções vazias e ordem das seções.
      Verify: `node --import tsx --require ./test-setup.ts --test src/lib/professional-profile.test.ts` — 6 testes passam ✓
- [x] AC-4: Server action `saveProfessionalProfile(patch)` em `src/app/actions/professional_profile.ts` valida limites e prompt injection e persiste via `$set` com upsert.
      Verify: `rg -n "saveProfessionalProfile|validateUserInput|findOneAndUpdate" src/app/actions/professional_profile.ts` ✓
- [x] AC-5: Página `perfil-profissional/page.tsx` renderiza as 3 seções; `ProfileSections.tsx` permite edição manual (textarea para who/goals, lista com add/remove para experience).
      Verify: `rg -n "Adicionar experiência|Editar" "src/app/profile/[profile_id]/perfil-profissional/ProfileSections.tsx"` ✓
- [x] AC-6: Botão na navbar (`src/components/header.tsx`) aponta para `/profile/:id/perfil-profissional`.
      Verify: `rg -n "perfil-profissional" src/components/header.tsx` ✓
- [x] AC-7: Rota `POST /api/insight` busca o perfil e passa `profileContext` para `generateInsight` → template `getUserPrompt` com `{profileContext}`.
      Verify: `rg -n "profileContext" src/app/api/insight/route.ts src/lib/llm.ts src/lib/prompts.ts` ✓
- [x] AC-8: Rota `POST /api/resume` busca o perfil e passa `profileContext` para `generate` → `getResumeSystemPrompt` → `buildContext`.
      Verify: `rg -n "profileContext" src/app/api/resume/route.ts src/resume/generator.ts src/resume/prompts.ts` ✓
- [x] AC-9: Rota `POST /api/chat` busca o perfil e passa `profileContext` para `generateChatResponse` → `buildCareerCoachSystemPrompt(persona, notes, profile)`.
      Verify: `rg -n "profileContext" src/app/api/chat/route.ts src/lib/chat-service.ts src/lib/prompt-builder.ts` ✓
- [x] AC-10: `next build` passa (gate real do repo; `tsc --noEmit` isolado falha pré-existente em testes por `expect` global).
      Verify: `next build` → `✓ Compiled successfully` + rota ƒ /profile/[profile_id]/perfil-profissional ✓

## TDD

- AC-3 tem teste automatizado (Red: arquivo inexistente → Green: 6 testes passam).
- AC-7 a AC-9: verificação estrutural `rg` — o contexto flui rota → lib → prompt.
- AC-10: `next build` é o gate de tipo do repo (testes usam `expect` global do `test-setup.ts`).

## Details

### Constraints

- Perfil é **dado do usuário** nos prompts: labels em pt-BR, injetado como contexto ("use como contexto"), nunca como instrução. `PROMPT_SECURITY_GUARD` permanece em todos os system prompts.
- Nenhuma escrita agêntica: rota `/api/profile-section` e guardrails `canAgentEdit`/`applyAgentWrite` foram **removidos** nesta iteração.
- Limites de edição: `MAX_SECTION_CHARS=10_000` (who/goals), `MAX_EXPERIENCE_ITEMS=30`, título ≤ 200, período ≤ 100, descrição ≤ 2 000; itens vazios são descartados no save.
- Edição manual passa por `validateUserInput` (OWASP LLM01) antes de persistir.

### Out of Scope

- Escrita agêntica (botão "Gerar com IA", tool-calling no chat) — removida por decisão do produto; reabrir via `git history` se voltar
- Histórico de versões por seção
- Limites de uso para edições (edição manual não custa LLM)

---

## Dependencies

### Feature Dependencies

- `code::src/models/Persona.ts::Persona` — modelo vizinho usado como contexto nas gerações
- `code::src/lib/chat-notes.ts::getRecentNotesContext` — padrão de contexto best-effort replicado para o perfil
- `code::src/lib/prompt-guard.ts::validateUserInput` — scan de prompt injection na edição manual
- `code::src/lib/prompt-guard.ts::PROMPT_SECURITY_GUARD` — guarda de segurança nos system prompts

### External Dependencies

- MongoDB/Mongoose (já no projeto) — coleção `professionalprofiles`
- Nenhum pacote npm novo

---

## Technical Considerations

### Performance

- Perfil é documento único por usuário (índice único em `profile_id`); leitura no servidor por página e nas rotas de geração
- Formatter só inclui seções não vazias — perfil esparso adiciona ~0 tokens de ruído

### Security

- Auth0 em todas as escritas/leituras (action usa `auth0.getSession`, rotas usam `isAuthenticated`)
- `validateUserInput` antes de persistir edição manual (OWASP LLM01)
- Conteúdo do usuário tratado como dado nos prompts, nunca como instrução

### Backward Compatibility

- Modelo novo sem impacto nos existentes; `upsert: true` + `setDefaultsOnInsert` cobre primeiro acesso
- `generateChatResponse`/`generate`/`generateInsight` ganham parâmetro opcional — call sites existentes compilam sem alteração
- Nenhuma rota existente alterada em contrato (só leitura adicional de contexto)

---

## API Contract

```text
Server action saveProfessionalProfile(patch: { who?, goals?, experience? })
  - who/goals: string ≤ 10_000 chars, não vazio quando fornecido
  - experience: array ≤ 30 de { title ≤ 200, period ≤ 100, description ≤ 2 000 }
  - itens sem título são descartados; tudo passa por validateUserInput
  - persiste com $set + upsert; erro em input inválido

Fluxos de contexto (leitura):
  - POST /api/insight  → generateInsight({ profileContext }) → getUserPrompt {profileContext}
  - POST /api/resume   → generate(..., profileContext)     → getResumeSystemPrompt → buildContext
  - POST /api/chat     → generateChatResponse(..., profile) → buildCareerCoachSystemPrompt(persona, notes, profile)

Modelo ProfessionalProfile (Mongoose)
  profile_id: ObjectId ref Profile, unique, required, indexed
  who: string (default "")
  experience: [{ title: string, period: string, description: string }] (default [])
  goals: string (default "")
  timestamps: true
```

---

## Glossary

| Location                                                                      | Type       | Description                                          |
| ----------------------------------------------------------------------------- | ---------- | ---------------------------------------------------- |
| `feature::professional-profile::ac-1`                                         | acceptance | Modelo ProfessionalProfile (who/experience/goals).   |
| `feature::professional-profile::ac-2`                                         | acceptance | Formatter para prompts.                              |
| `feature::professional-profile::ac-3`                                         | acceptance | Testes do formatter.                                 |
| `feature::professional-profile::ac-4`                                         | acceptance | Server action de edição manual.                      |
| `feature::professional-profile::ac-5`                                         | acceptance | Página + UI de edição (lista de experiências).       |
| `feature::professional-profile::ac-6`                                         | acceptance | Botão na navbar.                                     |
| `feature::professional-profile::ac-7`                                         | acceptance | Contexto injetado no insight.                        |
| `feature::professional-profile::ac-8`                                         | acceptance | Contexto injetado no currículo.                      |
| `feature::professional-profile::ac-9`                                         | acceptance | Contexto injetado no chat.                           |
| `feature::professional-profile::ac-10`                                        | acceptance | next build passa.                                    |
| `code::src/models/ProfessionalProfile.ts::IProfessionalProfile`               | source     | Interface do modelo.                                 |
| `code::src/models/ProfessionalProfile.ts::IExperienceItem`                    | source     | Item de experiência (title/period/description).      |
| `code::src/models/ProfessionalProfile.ts::ProfessionalProfile`                | source     | Modelo Mongoose exportado.                           |
| `code::src/lib/professional-profile.ts::formatProfessionalProfileForPrompt`   | source     | Formata perfil → contexto LLM.                       |
| `code::src/lib/professional-profile.ts::MAX_SECTION_CHARS`                    | source     | Limite de caracteres who/goals.                      |
| `code::src/app/actions/professional_profile.ts::saveProfessionalProfile`      | source     | Edição manual validada + persistida.                 |
| `code::src/app/api/insight/route.ts::POST`                                    | source     | Injeta profileContext na geração de insight.         |
| `code::src/app/api/resume/route.ts::POST`                                     | source     | Injeta profileContext na geração de currículo.       |
| `code::src/app/api/chat/route.ts::POST`                                       | source     | Injeta profileContext no chat coach.                 |
| `code::src/lib/prompt-builder.ts::PromptBuilder.buildCareerCoachSystemPrompt` | source     | System prompt do chat com seção de perfil.           |
| `code::src/resume/prompts.ts::getResumeSystemPrompt`                          | source     | System prompt do currículo com perfil como contexto. |
| `code::src/components/header.tsx::Header`                                     | source     | Navbar com botão para a seção.                       |
| `wiki::professional-profile::mental-model`                                    | wiki       | Modelo mental da seção e integração.                 |
