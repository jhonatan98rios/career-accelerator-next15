# Feature: Unificação Persona → ProfessionalProfile (fonte única de verdade)

> **Status**: `implemented`

Elimina a duplicação de dados do usuário entre `Persona` e `ProfessionalProfile`. Sem usuários reais, não há migração: o modelo `Persona` é **removido do código**, todos os campos (estruturados + prosa + telemetria + artefato `resume`) passam a viver em `ProfessionalProfile`, e o operador dropa as collections `personas`/`professionalprofiles` no Mongo para o app recriar do zero via upsert. Nenhum texto de prompt muda — apenas a origem dos dados que alimentam os placeholders.

## What

Mover todos os campos do modelo `Persona` para dentro de `ProfessionalProfile` (mesmos nomes e tipos), deletar `src/models/Persona.ts` e todos os imports, e reposicionar leituras/escritas — rotas de geração, páginas, formatters e input de enriquecimento — para o documento unificado. Sem script de migração: dados descartáveis, collections dropadas manualmente, app recria via `upsert: true`. Base de dados única para a futura transparência LGPD ("Meus dados", proveniência por campo).

## Why

- Hoje `Persona` e `ProfessionalProfile` são duas fontes da verdade derivadas do mesmo input (questionário do insight): `who` ≈ prosa de `currentRole`/`yearsOfExperience`/`hardSkills`/`softSkills`/`educationLevel`; `goals` ≈ prosa de `shortTermGoal`/`mediumTermGoal`/`longTermGoal`. Cada geração faz **dois** fetches e **dois** blocos de contexto do mesmo dado.
- Sem usuários reais, a remoção total da Persona é mais barata que mantê-la como backup: o próprio `tsc`/`next build` prova que nada mais a usa.
- Uma única coleção = uma única declaração no termo de uso + base para a futura página "Meus dados" (LGPD arts. 18/19).

## Field Map

### Campos: destino por campo

| Campo Persona                                                                                                                  | Destino             | Justificativa                                                                          |
| ------------------------------------------------------------------------------------------------------------------------------ | ------------------- | -------------------------------------------------------------------------------------- |
| `currentRole`, `targetRole`, `yearsOfExperience`, `careerStage`, `industries`, `employmentStatus`                              | ProfessionalProfile | identidade de carreira                                                                 |
| `educationLevel`, `fieldOfStudy`, `certifications`, `currentlyStudying`, `preferredLearningStyle`                              | ProfessionalProfile | educação                                                                               |
| `hardSkills`, `softSkills`, `languages`, `tools`                                                                               | ProfessionalProfile | skills                                                                                 |
| `weeklyStudyHours`, `studySchedule`, `preferredContentFormat`                                                                  | ProfessionalProfile | rotina                                                                                 |
| `shortTermGoal`, `mediumTermGoal`, `longTermGoal`, `careerMotivation`, `targetSalary`, `willingToRelocate`, `remotePreference` | ProfessionalProfile | objetivos                                                                              |
| `jobSearchKeyword`                                                                                                             | ProfessionalProfile | busca de vagas (lido pela página vagas)                                                |
| `completedRoadmaps`, `insightsGenerated`, `skillsGained`                                                                       | ProfessionalProfile | telemetria lida por `formatPersonaForPrompt` (bloco "User Profile")                    |
| `resume`, `resumeGeneratedAt`                                                                                                  | ProfessionalProfile | artefato gerado pela IA, reusado em preview (`page.tsx`) e DOCX (`resume-download.ts`) |
| `lastRoleChange`                                                                                                               | **descartado**      | nunca escrito nem lido em lugar nenhum                                                 |

Após a mudança, **não existe mais coleção `personas`**: o modelo é deletado e o operador dropa a collection no Mongo. O app recria `professionalprofiles` do zero no primeiro `findOneAndUpdate` + upsert (CP-2 do insight, save manual, CP-3/CP-4).

### Call sites: antes → depois

| Arquivo                                        | Hoje                                                                                     | Depois                                                                                                           |
| ---------------------------------------------- | ---------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `src/models/Persona.ts`                        | modelo ativo                                                                             | **deletado**                                                                                                     |
| `src/app/api/insight/route.ts`                 | 2 fetches (Persona + ProfessionalProfile); CP-2 escreve carreira + contadores na Persona | 1 fetch do documento unificado; CP-2 escreve tudo no ProfessionalProfile (mesmo `findOneAndUpdate` + upsert)     |
| `src/app/api/chat/route.ts`                    | 2 fetches; `PersonaSnapshot` montado da Persona                                          | 1 fetch; snapshot montado do documento unificado                                                                 |
| `src/app/api/resume/route.ts`                  | 2 fetches; `UserData` da Persona; escrita do `resume` na Persona                         | 1 fetch; `UserData` do documento unificado; escrita do `resume` no ProfessionalProfile                           |
| `src/app/api/roadmap/route.ts`                 | CP-4 `$inc completedRoadmaps` na Persona                                                 | `$inc` no ProfessionalProfile (upsert)                                                                           |
| `src/app/actions/career_roadmap.ts`            | CP-3 `$addToSet skillsGained` na Persona                                                 | `$addToSet` no ProfessionalProfile (upsert)                                                                      |
| `src/app/api/auth/register/route.ts`           | `Persona.create` ×2 (dev + prod)                                                         | `Persona.create` removido; ProfessionalProfile nasce por upsert (padrão `learned.md`: first-write auto-creation) |
| `src/app/profile/[profile_id]/vagas/page.tsx`  | `Persona.findOne` → `jobSearchKeyword`                                                   | `ProfessionalProfile.findOne` → `jobSearchKeyword`                                                               |
| `src/app/profile/[profile_id]/page.tsx`        | `Persona.findOne` → `resume`/`resumeGeneratedAt` (preview)                               | `ProfessionalProfile.findOne` → `resume`/`resumeGeneratedAt`                                                     |
| `src/lib/resume-download.ts`                   | `Persona.findOne` → `resume` (DOCX)                                                      | `ProfessionalProfile.findOne` → `resume`                                                                         |
| `src/lib/llm.ts`                               | `formatPersonaForPrompt(persona?: IPersona)`; `generateInsight({ persona })`             | tipos trocados para o documento unificado (`IProfessionalProfile`); **corpo do formatter inalterado**            |
| `src/lib/profile-enrichment.ts`                | `EnrichmentInput.persona?: IPersona`                                                     | tipo trocado para o documento unificado                                                                          |
| `src/lib/persona.test.ts`                      | fixtures `IPersona`                                                                      | fixtures no shape do documento unificado (mesmos nomes de campo)                                                 |
| `src/__tests__/dev-account-activation.test.ts` | asserta `"Persona.create"` no register                                                   | asserta **ausência** de `Persona` no register                                                                    |

### Sem mudança (intencional)

| Arquivo                                                                                               | Motivo                                                                                                                                                                                                                                                 |
| ----------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `src/app/actions/professional_profile.ts`, `perfil-profissional/page.tsx`, `ProfileSections.tsx`      | já escrevem/lêem ProfessionalProfile                                                                                                                                                                                                                   |
| `src/lib/professional-profile.ts` + testes                                                            | formatter de prosa já lê o documento unificado                                                                                                                                                                                                         |
| `src/lib/prompts.ts`, `src/lib/prompt-builder.ts`, `src/lib/chat-service.ts`, `src/resume/prompts.ts` | **nenhum texto de prompt muda** — só a origem do dado. Literais "persona" dentro de templates (ex.: seção "How to use the persona data" do currículo, placeholder `{personaContext}`) são **texto de prompt**, não referências de código, e permanecem |
| `src/models/Profile.ts`, demais modelos                                                               | intocados                                                                                                                                                                                                                                              |

### Prompt blocks: origem antes → depois

| Bloco                                                                   | Hoje                          | Depois                                           |
| ----------------------------------------------------------------------- | ----------------------------- | ------------------------------------------------ |
| Insight `{personaContext}` ("User Profile" estruturado)                 | Persona                       | ProfessionalProfile (mesmos campos, mesmo texto) |
| Insight `{profileContext}` (Quem sou eu / Experiência / O que pretendo) | ProfessionalProfile           | ProfessionalProfile (inalterado)                 |
| Chat `## Perfil do Usuário` (`PersonaSnapshot`)                         | Persona                       | ProfessionalProfile                              |
| Chat `## Perfil Profissional (escrito pelo usuário)`                    | ProfessionalProfile           | ProfessionalProfile (inalterado)                 |
| Currículo `UserData` estruturado + `profileContext` prosa               | Persona + ProfessionalProfile | ProfessionalProfile                              |

**Restrição dura: zero mudança de texto de prompt.** Saída byte-idêntica → zero drift de comportamento do LLM. A fusão dos blocos `{personaContext}` + `{profileContext}` num só é otimização futura explícita (mudaria o prompt).

## Acceptance Criteria

Cada critério segue Red → Green. Red: o comando `Verify` falha no estado atual. Green: passa após a mudança.

### Fase 1 — Modelo unificado

- [x] AC-1: `IProfessionalProfile`/`ProfessionalProfileSchema` ganham os campos estruturados de carreira/educação/skills/rotina/objetivos/busca (mesmos nomes e tipos da Persona, todos opcionais).
      Verify: `rg -n "currentRole|targetRole|yearsOfExperience|careerStage|industries|employmentStatus|educationLevel|fieldOfStudy|certifications|currentlyStudying|preferredLearningStyle|hardSkills|softSkills|languages|tools|weeklyStudyHours|studySchedule|preferredContentFormat|shortTermGoal|mediumTermGoal|longTermGoal|careerMotivation|targetSalary|willingToRelocate|remotePreference|jobSearchKeyword" src/models/ProfessionalProfile.ts`
- [x] AC-2: O modelo unificado ganha telemetria (`completedRoadmaps`, `insightsGenerated`, `skillsGained`) e o artefato `resume`/`resumeGeneratedAt`.
      Verify: `rg -n "completedRoadmaps|insightsGenerated|skillsGained|resume|resumeGeneratedAt" src/models/ProfessionalProfile.ts`

### Fase 2 — Remoção da Persona

- [x] AC-3: `src/models/Persona.ts` deletado e **zero** referências a `models/Persona` ou `IPersona` em `src/`.
      Verify: `test ! -f src/models/Persona.ts` (Red: arquivo existe)
      Verify: `rg -rn "models/Persona|IPersona" src` retorna nada (Red: hoje há 12+ arquivos)
- [x] AC-4: Register sem `Persona.create`; `dev-account-activation.test.ts` atualizado para assertar ausência de `Persona` no register e passando.
      Verify: `rg -n "Persona" src/app/api/auth/register/route.ts` retorna nada
      Verify: `node --import tsx --require ./test-setup.ts --test src/__tests__/dev-account-activation.test.ts` — todos os testes passam

### Fase 3 — Cutover de leitura

- [x] AC-5: Rota de insight faz 1 fetch do documento unificado e o passa a `generateInsight` + `enrichProfessionalProfile`; import de Persona removido.
      Verify: `rg -n "Persona" src/app/api/insight/route.ts` retorna nada (Red: hoje retorna matches)
- [x] AC-6: Rota de chat monta `PersonaSnapshot` do documento unificado; import de Persona removido.
      Verify: `rg -n "models/Persona" src/app/api/chat/route.ts` retorna nada
- [x] AC-7: Rota de currículo monta `UserData` do documento unificado (sem `persona?.`) e escreve o blob `resume` no ProfessionalProfile.
      Verify: `rg -n "persona\?\.|persona\." src/app/api/resume/route.ts` retorna nada
      Verify: `rg -n "ProfessionalProfile.findOneAndUpdate" src/app/api/resume/route.ts` retorna match
- [x] AC-8: Página de vagas lê `jobSearchKeyword` do documento unificado; import de Persona removido.
      Verify: `rg -n "models/Persona" "src/app/profile/[profile_id]/vagas/page.tsx"` retorna nada
- [x] AC-9: Página de perfil lê `resume`/`resumeGeneratedAt` do documento unificado (preview do currículo).
      Verify: `rg -n "models/Persona" "src/app/profile/[profile_id]/page.tsx"` retorna nada
- [x] AC-10: `resume-download.ts` lê `resume` do documento unificado (DOCX).
      Verify: `rg -n "models/Persona" src/lib/resume-download.ts` retorna nada

### Fase 4 — Cutover de escrita

- [x] AC-11: CP-2 (insight) escreve campos de carreira + contadores no ProfessionalProfile via `findOneAndUpdate` + upsert.
      Verify: `rg -n "ProfessionalProfile.findOneAndUpdate" src/app/api/insight/route.ts` retorna match
- [x] AC-12: CP-4 (extensão de roadmap) faz `$inc completedRoadmaps` no ProfessionalProfile; import de Persona removido.
      Verify: `rg -n "ProfessionalProfile" src/app/api/roadmap/route.ts` retorna match
      Verify: `rg -n "Persona" src/app/api/roadmap/route.ts` retorna nada
- [x] AC-13: CP-3 (step DONE) faz `$addToSet skillsGained` no ProfessionalProfile; import de Persona removido.
      Verify: `rg -n "ProfessionalProfile" src/app/actions/career_roadmap.ts` retorna match
      Verify: `rg -n "models/Persona" src/app/actions/career_roadmap.ts` retorna nada

### Fase 5 — Prompts (tipos, não texto)

- [x] AC-14: `formatPersonaForPrompt` e `generateInsight` passam a tipar com o documento unificado; corpo do formatter inalterado; testes de `persona.test.ts` atualizados para fixtures no shape unificado (mesmos nomes de campo).
      Verify: `node --import tsx --require ./test-setup.ts --test src/lib/persona.test.ts` — todos os testes passam
      Verify: `rg -n "IPersona" src/lib/llm.ts` retorna nada
- [x] AC-15: `EnrichmentInput.persona` tipa com o documento unificado.
      Verify: `rg -n "IPersona" src/lib/profile-enrichment.ts` retorna nada
- [x] AC-16: Templates de prompt intocados — placeholders `{personaContext}`/`{profileContext}` e seções do chat preservados.
      Verify: `rg -n "personaContext|profileContext" src/lib/prompts.ts` retorna match
      Verify: `rg -n "Perfil do Usuário|Perfil Profissional" src/lib/prompt-builder.ts` retorna match

### Fase 6 — Gate

- [x] AC-17: `next build` passa (gate real de tipos do repo — prova final de que nada referencia a Persona).
      Verify: `next build` → `✓ Compiled successfully`
- [x] AC-18: Suíte de testes existente passa (persona.test atualizado; professional-profile.test inalterado; dev-account-activation atualizado).
      Verify: `npm test` — todos passam

## TDD

- Fases 1–4: verificação estrutural `rg` (padrão do repo; Red → Green).
- AC-4/AC-14/AC-15/AC-18: testes `node --test` com `tsx` + `test-setup.ts` (padrão `professional-profile.md`).
- AC-17: `next build` como gate de tipo — com o modelo deletado, qualquer referência remanescente quebra o build.
- **Runbook (sem migração)**: (1) aplicar as mudanças de código; (2) `npm test` + `next build` verdes; (3) operador executa `db.personas.drop()` e `db.professionalprofiles.drop()` no Mongo; (4) o app recria `professionalprofiles` do zero no primeiro upsert (insight, save manual, roadmap). Não há rollback de dados — sem usuários reais, dados são descartáveis.

## Details

### Constraints

- **Dupla representação no mesmo doc, não tudo em prosa**: campos movidos da Persona permanecem estruturados (mesmos enums/arrays/números) e são a fonte factual (usada pelos mapas de tradução do chat, comparações numéricas, etc.); `who`/`goals`/`experience[]` permanecem prosa narrativa editável pelo usuário e protegida pelas flags. NÃO instruir o system prompt a despejar todos os dados em parágrafo — o `SYSTEM_PROMPT` do enriquecimento já define a prosa onde ela é devida (who/goals/experience) e não muda. O CP-2 continua populando os campos estruturados deterministicamente a partir do questionário.
- **Zero mudança de texto em prompts** (system e user). Só a origem do dado muda. `PROMPT_SECURITY_GUARD` e `validateUserInput` intocados.
- **Sem script/notebook de migração**: sem usuários reais, o operador dropa as collections manualmente.
- Mutations usam `findOneAndUpdate` + `upsert: true` + `setDefaultsOnInsert: true` (padrão `learned.md`).
- Comentários em inglês; logging via `import { log, LogLevel } from "@/lib/logger"`; `ObjectId` via `.toString()` quando precisar de string.
- Limites de edição existentes (`MAX_SECTION_CHARS`, `MAX_EXPERIENCE_ITEMS`, etc.) e flags `*EditedByUser` permanecem válidos — a prosa continua protegida contra sobrescrita agêntica.
- A redundância prosa × estruturado (`who` ≈ `currentRole`/`hardSkills`/etc.) é o desenho atual e permanece como questão em aberto — reconciliação é decisão de produto futura, fora desta feature.

### Out of Scope

- Script de migração/backup da coleção `personas` — explicitamente dispensado (sem usuários reais; operador dropa a collection).
- Proveniência por campo (`source: user | questionnaire | ai_enriched`), página "Meus dados" e notificação pós-enriquecimento — transparência LGPD; feature futura que esta unificação viabiliza.
- Fusão dos blocos `{personaContext}` + `{profileContext}` num único bloco de prompt — mudaria o prompt (comportamento LLM); otimização futura deliberada.
- Reconciliação da redundância prosa × estruturado (`who`/`goals` vs campos) — decisão de produto futura.
- Renomear modelo/coleção (`ProfessionalProfile` mantém o nome — menos churn).
- Seed de `ProfessionalProfile` no register — upsert cobre; sem necessidade.

---

## Dependencies

### Feature Dependencies

- `feature::persona-profile::ac-11` a `ac-15` — checkpoints CP-1 a CP-4 que esta feature re-hospeda (CP-1 seed da Persona é removido)
- `feature::professional-profile::ac-1` — modelo que recebe os campos
- `feature::professional-profile::ac-7` a `ac-9` — rotas cujos fetches são unificados
- `feature::professional-profile::ac-11` a `ac-13` — enriquecimento que recebe o documento unificado como input
- `wiki::professional-profile::mental-model` — conceito base que esta feature estende
- `wiki::career-insight-generation::mental-model` — pipeline que consome os dados unificados

### External Dependencies

- MongoDB/Mongoose (já no projeto)
- Nenhum pacote npm novo

---

## Technical Considerations

### Performance

- Rotas de insight/chat/currículo passam de **2 fetches → 1 fetch** por requisição (mesma latência de rede, metade das queries).
- Um único formatter alimenta os dois blocos de contexto a partir do mesmo doc em memória.

### Security

- Mesmas proteções: Auth0 em todas as leituras/escritas, `validateUserInput` na edição manual.
- A PII profissional (prosa + estruturado) passa a viver num único documento server-side — simplifica futura declaração no termo de uso. Acesso inalterado (já era server-side).

### Backward Compatibility

- Sem usuários reais: sem necessidade de compatibilidade retroativa; collections dropadas manualmente e recriadas por upsert.
- Nenhum contrato de rota/API muda; nenhum texto de prompt muda.
- A remoção do modelo `Persona` quebra o build se qualquer referência ficar para trás — isso é a prova de não-uso desejada (AC-17).

---

## API Contract

```text
Modelo unificado ProfessionalProfile (Mongoose) — coleção `professionalprofiles` (única fonte de verdade)
  profile_id: ObjectId ref Profile, unique, required, indexed        (existente)
  who: string (default ""), whoEditedByUser: boolean                 (existente)
  experience: [{ title, period, description }] (default [])          (existente)
  goals: string (default ""), goalsEditedByUser: boolean             (existente)
  # campos vindos da Persona (todos opcionais, mesmos tipos/enums):
  currentRole, targetRole: string
  yearsOfExperience: number
  careerStage: enum (entry|mid|senior|lead|executive)
  industries: string[]
  employmentStatus: enum (employed|unemployed|freelancer|student|retired)
  educationLevel: enum (high_school|bootcamp|bachelors|masters|phd|other)
  fieldOfStudy: string
  certifications: string[]
  currentlyStudying: boolean
  preferredLearningStyle: enum (self_paced|structured|project_based|mentorship)
  hardSkills, softSkills, tools: string[]
  languages: [{ language: string, proficiency: enum (basic|intermediate|fluent|native) }]
  weeklyStudyHours: number
  studySchedule: enum (mornings|afternoons|evenings|weekends|flexible)
  preferredContentFormat: enum (video|text|interactive|audio)
  shortTermGoal, mediumTermGoal, longTermGoal: string
  careerMotivation: enum (salary|growth|impact|stability|flexibility|passion)
  targetSalary: { currency: string, amount: number, period: enum (monthly|yearly) }
  willingToRelocate: boolean
  remotePreference: enum (remote|hybrid|onsite|flexible)
  jobSearchKeyword: string
  completedRoadmaps: number (default 0)
  insightsGenerated: number (default 0)
  skillsGained: string[]
  resume: Mixed (artefato gerado pela IA)
  resumeGeneratedAt: Date
  timestamps: true

# descartado: lastRoleChange (nunca escrito/lido)
# coleção `personas` deixa de existir no código; operador dropa no Mongo
```

---

## Glossary

| Location                                                                        | Type       | Description                                                          |
| ------------------------------------------------------------------------------- | ---------- | -------------------------------------------------------------------- |
| `feature::professional-profile-unification::ac-1`                               | acceptance | Modelo unificado ganha campos estruturados de carreira.              |
| `feature::professional-profile-unification::ac-2`                               | acceptance | Modelo unificado ganha telemetria + resume.                          |
| `feature::professional-profile-unification::ac-3`                               | acceptance | Modelo Persona deletado, zero referências.                           |
| `feature::professional-profile-unification::ac-4`                               | acceptance | Register sem Persona.create; teste atualizado.                       |
| `feature::professional-profile-unification::ac-5`                               | acceptance | Insight: 1 fetch unificado.                                          |
| `feature::professional-profile-unification::ac-6`                               | acceptance | Chat: snapshot do doc unificado.                                     |
| `feature::professional-profile-unification::ac-7`                               | acceptance | Currículo: UserData + resume no doc unificado.                       |
| `feature::professional-profile-unification::ac-8`                               | acceptance | Vagas: jobSearchKeyword do doc unificado.                            |
| `feature::professional-profile-unification::ac-9`                               | acceptance | Página de perfil: resume do doc unificado.                           |
| `feature::professional-profile-unification::ac-10`                              | acceptance | resume-download: resume do doc unificado.                            |
| `feature::professional-profile-unification::ac-11`                              | acceptance | CP-2 escreve no ProfessionalProfile.                                 |
| `feature::professional-profile-unification::ac-12`                              | acceptance | CP-4 escreve no ProfessionalProfile.                                 |
| `feature::professional-profile-unification::ac-13`                              | acceptance | CP-3 escreve no ProfessionalProfile.                                 |
| `feature::professional-profile-unification::ac-14`                              | acceptance | Formatters tipam com doc unificado, texto preservado.                |
| `feature::professional-profile-unification::ac-15`                              | acceptance | Enrichment tipa com doc unificado.                                   |
| `feature::professional-profile-unification::ac-16`                              | acceptance | Templates de prompt intocados.                                       |
| `feature::professional-profile-unification::ac-17`                              | acceptance | next build passa (prova de não-uso da Persona).                      |
| `feature::professional-profile-unification::ac-18`                              | acceptance | Suíte de testes passa.                                               |
| `code::src/models/ProfessionalProfile.ts::IProfessionalProfile`                 | source     | Interface do modelo unificado (prosa + campos movidos + resume).     |
| `code::src/models/ProfessionalProfile.ts::ProfessionalProfile`                  | source     | Modelo Mongoose unificado (coleção `professionalprofiles`).          |
| `code::src/lib/llm.ts::formatPersonaForPrompt`                                  | source     | Formatter do bloco estruturado, agora lê o doc unificado.            |
| `code::src/lib/llm.ts::generateInsight`                                         | source     | Recebe o doc unificado como `persona`.                               |
| `code::src/app/api/insight/route.ts::POST`                                      | source     | 1 fetch; CP-2 → ProfessionalProfile.                                 |
| `code::src/app/api/chat/route.ts::POST`                                         | source     | Snapshot do doc unificado.                                           |
| `code::src/app/api/resume/route.ts::POST`                                       | source     | UserData + resume no doc unificado.                                  |
| `code::src/app/api/roadmap/route.ts::POST`                                      | source     | CP-4 → ProfessionalProfile.                                          |
| `code::src/app/actions/career_roadmap.ts::toggleStepStatus`                     | source     | CP-3 → ProfessionalProfile.                                          |
| `code::src/app/api/auth/register/route.ts::POST`                                | source     | Persona.create removido.                                             |
| `code::src/app/profile/[profile_id]/vagas/page.tsx::Page`                       | source     | jobSearchKeyword do doc unificado.                                   |
| `code::src/app/profile/[profile_id]/page.tsx::Page`                             | source     | Preview do resume do doc unificado.                                  |
| `code::src/lib/resume-download.ts::getResumeDocxBuffer`                         | source     | DOCX do resume do doc unificado.                                     |
| `code::src/lib/profile-enrichment.ts::EnrichmentInput`                          | source     | `persona` tipa com o doc unificado.                                  |
| `code::src/lib/profile-enrichment.ts::enrichProfessionalProfile`                | source     | Passo paralelo alimentado pelo doc unificado.                        |
| `code::src/lib/prompts.ts::getUserPrompt`                                       | source     | Placeholders `{personaContext}`/`{profileContext}` (texto intocado). |
| `code::src/lib/prompt-builder.ts::PromptBuilder.buildCareerCoachSystemPrompt`   | source     | Seções de perfil (texto intocado, origem unificada).                 |
| `code::src/lib/chat-service.ts::PersonaSnapshot`                                | source     | Tipo mantido; origem passa a ser o doc unificado.                    |
| `code::src/resume/prompts.ts::getResumeSystemPrompt`                            | source     | Contexto unificado (texto intocado).                                 |
| `code::src/__tests__/dev-account-activation.test.ts::POST /register — dev mode` | source     | Assertiva de `Persona.create` → assertiva de ausência.               |
| `wiki::professional-profile::mental-model`                                      | wiki       | Conceito base estendido por esta feature.                            |
