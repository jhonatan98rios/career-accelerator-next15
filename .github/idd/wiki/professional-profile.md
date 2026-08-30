# Professional Profile

## Summary

**Fonte única de verdade dos dados do usuário** (`ProfessionalProfile`, MongoDB, coleção `professionalprofiles`): a seção "Perfil Profissional" editável manualmente (3 sub-seções — "Quem sou eu" em texto corrido, "O que eu fiz" como lista de itens e "O que eu pretendo fazer" em texto corrido) **+** todos os dados estruturados de carreira que antes viviam no modelo `Persona` (removido em 2026-08-30) **+** telemetria (`completedRoadmaps`, `insightsGenerated`, `skillsGained`) **+** o artefato `resume`/`resumeGeneratedAt` gerado pela IA. Um doc por usuário (`profile_id` único), lido/escrito por todas as rotas de geração (insight, currículo, chat), pela página de perfil, vagas e download de DOCX. Sem texto de prompt alterado pela unificação — só a origem dos dados.

## Mental Model

```
┌──────────────────────────────────────────────────────────────────┐
│  professionalprofiles (1 doc por usuário, profile_id único)      │
│                                                                  │
│  Prosa editável pelo usuário (flags whoEditedByUser/goals...)    │
│    1. Quem sou eu            who        texto corrido            │
│    2. O que eu fiz           experience lista: título, período,  │
│                               descrição                          │
│    3. O que eu pretendo fazer goals      texto corrido           │
│  Estruturado (ex-Persona, populado deterministicamente pelo      │
│  CP-2 no insight) — currentRole, targetRole, yearsOfExperience,  │
│  skills, educação, objetivos, jobSearchKeyword, etc.             │
│  Telemetria — completedRoadmaps, insightsGenerated, skillsGained │
│  Artefato IA — resume, resumeGeneratedAt (reusado no preview e   │
│  no DOCX)                                                        │
└──────────────────────────────────────────────────────────────────┘
         │
         ▼  contexto (leitura, best-effort) — 1 fetch por rota
┌──────────────────────────────────────────────────────────────────┐
│  POST /api/insight → generateInsight: {personaContext} (bloco     │
│    estruturado via formatPersonaForPrompt) + {profileContext}     │
│    (prosa via formatProfessionalProfileForPrompt) + dispara o     │
│    enriquecimento paralelo; CP-2 escreve estruturado + contadores │
│  POST /api/resume  → UserData (estruturado) + profileContext;     │
│    grava o resume gerado no mesmo doc                             │
│  POST /api/chat    → PromptBuilder: "Perfil do Usuário"           │
│    (PersonaSnapshot) + "Perfil Profissional (escrito pelo         │
│    usuário)"                                                      │
│  /vagas → jobSearchKeyword · /perfil → preview resume ·           │
│  /resume/download → DOCX                                          │
└──────────────────────────────────────────────────────────────────┘
```

O perfil é **dado do usuário**: entra nos prompts como contexto ("use como contexto", "NÃO citar literalmente" no currículo), nunca como instrução. `PROMPT_SECURITY_GUARD` protege todos os system prompts. As rotas de geração fazem fetch best-effort (falha silenciosa logada, geração continua sem o contexto) — mesmo padrão das notas de chat. **Dupla representação no mesmo doc**: estruturado = fatos (mapas de tradução do chat, comparações numéricas), prosa = narrativa editável protegida por flags; nada é "tudo em texto corrido".

## Anchors

- `code::src/models/ProfessionalProfile.ts::ProfessionalProfile` — modelo Mongoose unificado (coleção `professionalprofiles`)
- `code::src/models/ProfessionalProfile.ts::IProfessionalProfile` — interface do doc unificado (prosa + estruturado + telemetria + resume)
- `code::src/models/ProfessionalProfile.ts::IExperienceItem` — item da lista do meio (title/period/description)
- `code::src/lib/professional-profile.ts::formatProfessionalProfileForPrompt` — formatter de prosa para contexto LLM
- `code::src/lib/llm.ts::formatPersonaForPrompt` — formatter do bloco estruturado ("User Profile"), agora lê o doc unificado
- `code::src/app/actions/professional_profile.ts::saveProfessionalProfile` — edição manual (limites + prompt injection + upsert)
- `code::src/app/profile/[profile_id]/perfil-profissional/page.tsx::Page` — página servidora
- `code::src/app/profile/[profile_id]/perfil-profissional/ProfileSections.tsx::ProfileSections` — UI das 3 seções
- `code::src/app/api/insight/route.ts::POST` — 1 fetch; injeta os dois blocos de contexto, dispara o enriquecimento paralelo e escreve CP-2
- `code::src/lib/profile-enrichment.ts::enrichProfessionalProfile` — requisição paralela: extrai dados faltantes, aplica update aditivo
- `code::src/app/api/roadmap/route.ts::POST` — CP-4: `$inc completedRoadmaps`
- `code::src/app/actions/career_roadmap.ts::toggleStepStatus` — CP-3: `$addToSet skillsGained`
- `code::src/app/api/resume/route.ts::POST` — UserData + profileContext; grava `resume`/`resumeGeneratedAt`
- `code::src/app/api/chat/route.ts::POST` — snapshot + contexto do doc unificado
- `code::src/app/profile/[profile_id]/vagas/page.tsx::Page` — `jobSearchKeyword` para busca de vagas
- `code::src/app/profile/[profile_id]/page.tsx::Page` — preview do resume
- `code::src/lib/resume-download.ts::getResumeDocxBuffer` — DOCX a partir do `resume` do doc unificado
- `code::src/lib/prompt-builder.ts::PromptBuilder.buildCareerCoachSystemPrompt` — system prompt do chat com seções de perfil
- `code::src/lib/chat-service.ts::PersonaSnapshot` — subset plano usado no prompt do coach

## Decisions

- **Unificação Persona → ProfessionalProfile (2026-08-30, `feature::professional-profile-unification`)**: sem usuários reais, o modelo `Persona` foi **removido** (sem migração). Todo dado de carreira, telemetria e o artefato `resume` vivem aqui; `lastRoleChange` foi descartado (nunca escrito/lido). O operador dropa `personas`/`professionalprofiles` no Mongo e o app recria por upsert. **Zero texto de prompt mudou** — os blocos `{personaContext}`/`{profileContext}`/`Perfil do Usuário` são alimentados do mesmo doc.
- **Enriquecimento agêntico aditivo (durante o insight)**: ao gerar um insight, uma requisição **paralela separada** (`enrichProfessionalProfile`) envia as respostas do questionário, a descrição manual, o perfil estruturado e o perfil atual, e pergunta ao modelo quais dados relevantes ao perfil ainda não estão nele. A aplicação é **aditiva e protegida por flag**: `who`/`goals` são totalmente bloqueados contra sobrescrita quando `whoEditedByUser`/`goalsEditedByUser` = true (setados no save manual); com flag false o agente pode enriquecer retornando a **versão completa atualizada** (conteúdo atual + melhorias) que sobrescreve o campo, ou omitindo-o se não quiser mudar; itens de experiência só anexados se o título não existe (dedup). Tudo com os mesmos limites de edição + `validateUserInput`. Nunca falha o insight (best-effort).
- **Sem escrita agêntica interativa nesta versão**: botão "Gerar com IA" na página e tool-calling no chat não fazem parte desta iteração; o enriquecimento automático acima é o único ponto de escrita do agente, e é aditivo + flag-protected por design.
- **Meio = lista estruturada** (`experience`), pontas = texto corrido (`who`/`goals`): formato de edição segue o conteúdo — lista para experiências, texto para resumo/objetivos.
- **Estruturado ≠ prosa (dupla representação)**: os campos movidos da Persona permanecem enums/arrays/números (fonte factual — mapas de tradução do chat, comparações numéricas); `who`/`goals` são prosa narrativa. O system prompt NÃO é instruído a despejar tudo em parágrafo; o `SYSTEM_PROMPT` do enriquecimento já define a prosa onde ela é devida.
- **Contexto best-effort**: perfil esparso = bloco vazio no prompt — sem ruído de tokens.
- **Edição manual validada**: `validateUserInput` + limites de tamanho antes de persistir; itens sem título são descartados; edição manual seta a flag de bloqueio.

## Open Questions

- Mostrar ao usuário o que o agente adicionou (ex.: notificação após o insight)? Por ora o enriquecimento é silencioso — o usuário vê os dados novos na própria página de perfil.
- Proveniência por campo (`source: user | questionnaire | ai_enriched`), página "Meus dados" e exportação/exclusão (LGPD arts. 18/19) — viabilizadas pela fonte única, ainda não implementadas.
- Redundância prosa × estruturado (`who` ≈ `currentRole`/`hardSkills`/etc.): reconciliação é decisão de produto futura.
- Fusão dos blocos `{personaContext}` + `{profileContext}` num único bloco de prompt — mudaria o comportamento do LLM; otimização deliberadamente adiada.

## Evidence

- `src/models/ProfessionalProfile.ts` — modelo unificado (prosa + estruturado + telemetria + resume)
- `src/models/Persona.ts` — **removido** (não existe mais)
- `src/lib/professional-profile.ts` + `src/lib/professional-profile.test.ts` — formatter de prosa e testes
- `src/lib/llm.ts::formatPersonaForPrompt` + `src/lib/persona.test.ts` — formatter estruturado (tipado contra o doc unificado) e testes
- `src/app/actions/professional_profile.ts` — action de edição manual
- `src/app/profile/[profile_id]/perfil-profissional/` — página + componente cliente
- `src/app/api/insight/route.ts` — 1 fetch, dois blocos de contexto, `Promise.all` com o enriquecimento, CP-2
- `src/lib/profile-enrichment.ts` — passo paralelo de enriquecimento (extração + escrita aditiva)
- `src/app/api/roadmap/route.ts`, `src/app/actions/career_roadmap.ts` — CP-4/CP-3 no doc unificado
- `src/lib/prompt-builder.ts`, `src/resume/prompts.ts`, `src/lib/prompts.ts` — templates com as seções de perfil
