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

- **Enriquecimento agêntico aditivo (durante o insight)**: ao gerar um insight, uma requisição **paralela separada** (`enrichProfessionalProfile`) envia as respostas do questionário, a descrição manual, a persona e o perfil atual, e pergunta ao modelo quais dados relevantes ao perfil ainda não estão nele. A aplicação é **aditiva e protegida por flag**: `who`/`goals` são totalmente bloqueados contra sobrescrita quando `whoEditedByUser`/`goalsEditedByUser` = true (setados no save manual); com flag false o agente pode enriquecer retornando a **versão completa atualizada** (conteúdo atual + melhorias) que sobrescreve o campo, ou omitindo-o se não quiser mudar; itens de experiência só anexados se o título não existe (dedup). Tudo com os mesmos limites de edição + `validateUserInput`. Nunca falha o insight (best-effort).
- **Sem escrita agêntica interativa nesta versão**: botão "Gerar com IA" na página e tool-calling no chat não fazem parte desta iteração; o enriquecimento automático acima é o único ponto de escrita do agente, e é aditivo + flag-protected por design.
- **Meio = lista estruturada** (`experience`), pontas = texto corrido (`who`/`goals`): formato de edição segue o conteúdo — lista para experiências, texto para resumo/objetivos.
- **Contexto best-effort**: perfil esparso = bloco vazio no prompt (mesma política do persona — sem ruído de tokens).
- **Edição manual validada**: `validateUserInput` + limites de tamanho antes de persistir; itens sem título são descartados; edição manual seta a flag de bloqueio.

## Open Questions

- Mostrar ao usuário o que o agente adicionou (ex.: notificação após o insight)? Por ora o enriquecimento é silencioso — o usuário vê os dados novos na própria página de perfil.

## Evidence

- `src/models/ProfessionalProfile.ts` — schema who/experience/goals
- `src/lib/professional-profile.ts` + `src/lib/professional-profile.test.ts` — formatter e testes
- `src/app/actions/professional_profile.ts` — action de edição manual
- `src/app/profile/[profile_id]/perfil-profissional/` — página + componente cliente
- `src/components/sideBar.tsx` — item de menu na sidebar
- `src/app/api/insight/route.ts` — injeção de contexto + `Promise.all` com o enriquecimento
- `src/lib/profile-enrichment.ts` — passo paralelo de enriquecimento (extração + escrita aditiva)
- `src/lib/prompt-builder.ts`, `src/resume/prompts.ts`, `src/lib/prompts.ts` — templates com a seção de perfil
