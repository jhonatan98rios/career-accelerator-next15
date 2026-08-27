# Professional Profile

## Summary

Seção "Perfil Profissional" do app: 3 sub-seções editadas manualmente pelo usuário, persistidas em `ProfessionalProfile` (MongoDB) — "Quem sou eu" (texto corrido), "O que eu fiz" (lista de itens com título/período/descrição) e "O que eu pretendo fazer" (texto corrido). O perfil é injetado como contexto nas gerações de insight, currículo e chat. Sem escrita agêntica nesta versão.

## Mental Model

```
┌──────────────────────────────────────────────────────────────┐
│  Navbar → /profile/:id/perfil-profissional                   │
│  Edição 100% manual (sem botão de IA nesta versão)           │
│                                                              │
│  1. Quem sou eu            who        texto corrido          │
│  2. O que eu fiz           experience lista: título,         │
│                                       período, descrição     │
│  3. O que eu pretendo fazer goals      texto corrido         │
└──────────────────────────────────────────────────────────────┘
         │
         ▼  context (leitura, best-effort)
┌──────────────────────────────────────────────────────────────┐
│  POST /api/insight  → generateInsight → {profileContext}     │
│  POST /api/resume   → generate → buildContext (perfil)       │
│  POST /api/chat     → PromptBuilder → seção "Perfil          │
│                        Profissional (escrito pelo usuário)"  │
└──────────────────────────────────────────────────────────────┘
```

O perfil é **dado do usuário**: entra nos prompts como contexto ("use como contexto", "NÃO citar literalmente" no currículo), nunca como instrução. `PROMPT_SECURITY_GUARD` protege todos os system prompts. As três rotas de geração fazem fetch best-effort (falha silenciosa logada, geração continua sem o contexto) — mesmo padrão das notas de chat.

## Anchors

- `code::src/models/ProfessionalProfile.ts::ProfessionalProfile` — modelo Mongoose (coleção `professionalprofiles`)
- `code::src/models/ProfessionalProfile.ts::IExperienceItem` — item da lista do meio (title/period/description)
- `code::src/lib/professional-profile.ts::formatProfessionalProfileForPrompt` — formatter para contexto LLM
- `code::src/app/actions/professional_profile.ts::saveProfessionalProfile` — edição manual (limites + prompt injection + upsert)
- `code::src/components/sideBar.tsx::SideBar` — item de menu na sidebar
- `code::src/app/profile/[profile_id]/perfil-profissional/page.tsx::Page` — página servidora
- `code::src/app/profile/[profile_id]/perfil-profissional/ProfileSections.tsx::ProfileSections` — UI das 3 seções
- `code::src/app/api/insight/route.ts::POST` — injeta profileContext no insight e dispara o enriquecimento paralelo
- `code::src/lib/profile-enrichment.ts::enrichProfessionalProfile` — requisição paralela: extrai dados faltantes, aplica update aditivo
- `code::src/app/api/resume/route.ts::POST` — injeta profileContext no currículo
- `code::src/app/api/chat/route.ts::POST` — injeta profileContext no chat
- `code::src/lib/prompt-builder.ts::PromptBuilder.buildCareerCoachSystemPrompt` — system prompt do chat com seção de perfil

## Decisions

- **Sem escrita agêntica nesta versão**: rota `/api/profile-section` e guardrails `canAgentEdit`/`applyAgentWrite` foram removidos. Se o produto quiser "Gerar com IA" de novo, o ponto de entrada deve reutilizar `formatProfessionalProfileForPrompt` + a action de save — e as guardrails de proteção de conteúdo do usuário voltam com ele.
- **Meio = lista estruturada** (`experience`), pontas = texto corrido (`who`/`goals`): formato de edição segue o conteúdo — lista para experiências, texto para resumo/objetivos.
- **Contexto best-effort**: perfil esparso = bloco vazio no prompt (mesma política do persona — sem ruído de tokens).
- **Edição manual validada**: `validateUserInput` + limites de tamanho antes de persistir; itens sem título são descartados.

## Open Questions

- Voltar a ter geração agêntica (botão ou tool-calling no chat coach)? Se sim, reativar guardrails de proteção do conteúdo editado pelo usuário.

## Evidence

- `src/models/ProfessionalProfile.ts` — schema who/experience/goals
- `src/lib/professional-profile.ts` + `src/lib/professional-profile.test.ts` — formatter e testes
- `src/app/actions/professional_profile.ts` — action de edição manual
- `src/app/profile/[profile_id]/perfil-profissional/` — página + componente cliente
- `src/components/sideBar.tsx` — item de menu na sidebar
- `src/app/api/insight/route.ts` — injeção de contexto + `Promise.all` com o enriquecimento
- `src/lib/profile-enrichment.ts` — passo paralelo de enriquecimento (extração + escrita aditiva)
- `src/lib/prompt-builder.ts`, `src/resume/prompts.ts`, `src/lib/prompts.ts` — templates com a seção de perfil
