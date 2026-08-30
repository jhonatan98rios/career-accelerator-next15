# Feature: Plan Tiers — Multi-Plan Monetization

> **Status**: `implemented`

3 planos ativos (Básico, Acelera.ai Plus, Acelera.ai Ultra) com diferenciação real de features e limites. Nomes e preços alinhados aos produtos reais da Stripe (2026-08-02): Básico R$29,90, Plus R$49,90, Ultra R$99,90. Os antigos `INTERMEDIARY`/`PREMIUM` (R$59,99/R$99,99) nunca tiveram Price ID na Stripe e foram substituídos por `PLUS`/`ULTRA`.

## What

3 planos ativos no enum (`BASIC`, `PLUS`, `ULTRA`), limites escalonados por plano (chat, currículos, insights, roadmaps), 3 Price IDs na Stripe, registro com 3 opções de plano, upgrade/downgrade via Stripe Checkout, e exibição do plano atual + limites no dashboard do usuário.

## Acceptance Criteria

- [x] AC-1: `Plan` enum tem 3 valores ativos: `BASIC`, `PLUS`, `ULTRA`.
      Verify: `grep -c "BASIC\|PLUS\|ULTRA" src/lib/enums.ts | grep -q "3" && ! grep "//.*PLUS\|//.*ULTRA" src/lib/enums.ts`
- [x] AC-2: `PLAN_LIMITS` em `plan-service.ts` define limites para os 3 planos com progressão clara.
      Verify: `grep "Plan.PLUS\|Plan.ULTRA" src/lib/plan-service.ts`
- [x] AC-3: `getStripePriceId()` em `subscription.ts` aceita os 3 planos, cada um com sua env var (`STRIPE_BASIC_MONTHLY_PRICE_ID`, `STRIPE_PLUS_MONTHLY_PRICE_ID`, `STRIPE_ULTRA_MONTHLY_PRICE_ID`).
      Verify: `grep "PLUS\|ULTRA" src/lib/subscription.ts`
- [x] AC-4: Formulário de registro (`gateway/form.tsx`) mostra 3 opções de plano com nome, preço e benefícios resumidos.
      Verify: `grep "Plus\|Ultra\|R\\$" src/app/gateway/form.tsx`
- [x] AC-5: API de registro (`POST /api/auth/register`) aceita qualquer um dos 3 planos.
      Verify: `grep "Object.values(Plan).includes(plan)" src/app/api/auth/register/route.ts` — validação cobre novos planos automaticamente
- [x] AC-6: Usuário vê plano atual e limites no dashboard/profile.
      Verify: `grep "plano\|Plano\|plan\b" src/app/profile/ --include="*.tsx" -l | head -5`
- [x] AC-7: Upgrade de plano é possível via página de configuração (novo Stripe Checkout para o plano superior, cancela assinatura antiga).
      Verify: `grep "upgrade\|changePlan\|mudar.*plano\|alterar.*plano" src/app/profile/ --include="*.tsx" src/lib/ --include="*.ts" -l`
- [x] AC-8: Downgrade efetivo acontece só ao final do período pago (cancel_at_period_end no Stripe), com UI informando data de transição.
      Verify: `grep "cancel_at_period_end\|period_end\|transition\|transicao" src/lib/subscription.ts src/app/profile/ --include="*.tsx" -l`
- [x] AC-9: Webhook do Stripe processa mudanças de plano (`customer.subscription.updated` com price_id diferente) e atualiza `Subscription.plan` + `Profile.plan`.
      Verify: `grep "stripePriceId\|price\.id" src/app/api/webhook/payment/stripe/route.ts src/lib/subscription.ts`
- [x] AC-10: Features são desabilitadas no frontend e backend conforme o plano (ex: chat só a partir do Plus, currículos com limite diário).
      Verify: `grep "plan.*BASIC\|plan.*PLUS\|plan.*ULTRA\|featureEnabled\|isFeatureAvailable" src/lib/plan-service.ts` — feature-gating via `isChatAvailable`

## TDD

Red / Green TDD suspenso para esta alteração (mesma decisão do `stripe-subscription-migration`). Verificação por `rg`/testes existentes: `plan-service.test.ts`, `usage-service.test.ts` e `ai-generation-guardrails.test.ts` cobrem os 3 planos (PLUS/ULTRA).

## Details

### Estratégia de Planos

| Feature                           | Básico (R$29,90/mês) | Acelera.ai Plus (R$49,90/mês) | Acelera.ai Ultra (R$99,90/mês) |
| --------------------------------- | -------------------- | ----------------------------- | ------------------------------ |
| **Insights de carreira**          | 1 a cada 7 dias      | 1 a cada 48h                  | 1/dia                          |
| **Roadmap**                       | Sim (com extensão)   | Sim (com extensão)            | Sim (com extensão)             |
| **Chat Coach**                    | ❌                   | 3 sessões/dia                 | 10 sessões/dia                 |
| **Currículos**                    | 3/dia                | 10/dia                        | 30/dia                         |
| **Perfil profissional unificado** | Sim                  | Sim                           | Sim                            |
| **NFS-e tax profile**             | Sim                  | Sim                           | Sim                            |
| **Suporte**                       | Email (48h)          | Email (24h)                   | Prioritário (chat/email 4h)    |
| **Trial**                         | 7 dias               | 7 dias                        | 7 dias                         |

**Por que Chat só a partir do Plus**: Chat com IA é o maior diferencial competitivo e o maior custo de API. Reservá-lo para planos acima do básico cria incentivo de upgrade. O Básico entrega valor real (insight + roadmap + 3 currículos/dia) sem frustrar.

**Por que Roadmap igual para todos**: A extensão de roadmap é a jornada core do produto — mutilar no Básico quebraria o loop de engajamento.

**Por que currículos com limite diário**: Currículo é barato de gerar, mas o futuro é uma extensão de browser por vaga — cada candidatura = 1 geração. Limite diário faz mais sentido que mensal.

**Por que Insight no Básico com cooldown maior (7 dias)**: O insight de carreira é o "aha moment" — acesso lento mantém ativação e retenção de topo de funil. Plus reduz para 48h como incentivo.

### Nomes e Preços (fonte da verdade: Stripe, 2026-08-02)

| Plano app | Produto Stripe      | Price ID                         | Preço   |
| --------- | ------------------- | -------------------------------- | ------- |
| `BASIC`   | Acelera.ai Standard | `price_1TpVkqAqYxZT24KBoX8egy4N` | R$29,90 |
| `PLUS`    | Acelera.ai Plus     | `price_1U099rAqYxZT24KBkucS64GR` | R$49,90 |
| `ULTRA`   | Acelera.ai Ultra    | `price_1U09AEAqYxZT24KBgVOLT6uN` | R$99,90 |

Nota: produto BASIC na Stripe chama-se "Acelera.ai Standard"; o label de UI mantém "Básico". Preço do Básico corrigido de R$29,99 → R$29,90 para bater com o charge real da Stripe.

### Constraints

- Sem tier gratuito — todo acesso requer assinatura ativa.
- Trial de 7 dias mantido para todos os planos.
- Migração de plano via Stripe Checkout (nova sessão), não via API de subscription direta.
- Preços em BRL, cartão de crédito apenas.
- Webhook do Stripe persiste `stripePriceId` — usado para detectar mudança de plano (`planFromPriceId`).

### Out of Scope

- Plano anual ou semestral.
- Pagamento via PIX, boleto, débito.
- Customer Portal do Stripe (Billing Portal).
- Desconto por indicação / cupons.
- Faturamento NFSe automatizado (manual).
- Analytics de conversão de plano.

---

## Dependencies

### Feature Dependencies

- `wiki::subscription-payment::mental-model` — fluxo de pagamento existente
- `code::src/lib/enums.ts::Plan` — enum com BASIC, PLUS, ULTRA
- `code::src/lib/plan-service.ts::PLAN_LIMITS` — limites por plano
- `code::src/lib/subscription.ts::getStripePriceId` — mapeamento plano → Price ID
- `code::src/lib/subscription.ts::createSubscription` — criação de Checkout Session
- `code::src/lib/subscription.ts::planFromPriceId` — reverse lookup Price ID → plano
- `code::src/app/gateway/form.tsx::GatewayForm` — formulário de registro
- `code::src/app/api/auth/register/route.ts::POST` — endpoint de registro
- `code::src/app/api/webhook/payment/stripe/route.ts::POST` — webhook de reconciliação
- `code::src/models/Subscription.ts::Subscription` — modelo de assinatura
- `code::src/models/Profile.ts::Profile` — perfil com campo `plan`
- `code::src/lib/usage-service.ts` — limites diários de uso
- `code::src/lib/ai-generation-guardrails.ts` — cooldown de insight por plano

### External Dependencies

- Stripe: 3 Products + 3 monthly Prices em BRL (Standard, Plus, Ultra)
- Stripe: 3 env vars (`STRIPE_BASIC_MONTHLY_PRICE_ID`, `STRIPE_PLUS_MONTHLY_PRICE_ID`, `STRIPE_ULTRA_MONTHLY_PRICE_ID`)
- MongoDB: sem novas collections
- Auth0: sem alterações

---

## Technical Considerations

### Performance

- `getPlanLimits()` é O(1) — lookup em Record estático.
- Feature-gating consulta o mesmo `getPlanLimits()` — sem query extra.
- Upgrade/downgrade é ação infrequente — sem cache.

### Security

- Validação de plano no backend é obrigatória — nunca confiar no client.
- Webhook do Stripe é a única fonte de verdade para mudança de plano paga.
- Feature-gating aplicado no backend; frontend gating é UX apenas.

### Backward Compatibility

- Planos `BASIC` existentes continuam idênticos.
- `PLAN_LIMITS` fallback para BASIC cobre plano desconhecido/corrompido.
- Renomeação `INTERMEDIARY`→`PLUS`, `PREMIUM`→`ULTRA`: docs legadas com `plan: "intermediary"|"premium"` caem no fallback BASIC (produto sem usuários na migração, risco aceito). Ver `learned.md` Notes.

---

## Plano de Ação — Implementação em Fases

### Fase 1: Fundação (back-end)

1. **Enum + plan-service**: `enums.ts`: `PLUS = "plus"`, `ULTRA = "ultra"`. `plan-service.ts`: limites para os 3 planos conforme tabela.
2. **Stripe Price IDs**: `subscription.ts`: `getStripePriceId()` aceita 3 planos; 3 env vars.
3. **Testes**: `plan-service.test.ts`, `usage-service.test.ts`, `ai-generation-guardrails.test.ts` atualizados para PLUS/ULTRA.

### Fase 2: Registro multi-plano (visível no funil)

4. **Gateway form**: 3 opções de plano com nome, preço e benefícios.
5. **API register**: `Object.values(Plan).includes(plan)` cobre novos planos sem alteração.
6. **Email de ativação**: `sendPaymentEmail` usa `getPlanLabel` — copy atualizada automaticamente.

### Fase 3: Feature-gating (diferenciação real)

7. **plan-service feature flags**: `isChatAvailable(plan)` — chat só a partir do PLUS.
8. **Chat gating**: `canStartChatSession` retorna false quando limite = 0; UI mostra "Disponível a partir do plano Plus".
9. **Insight gating**: `ai-generation-guardrails.ts` — cooldown por plano (7d BASIC, 48h PLUS, 24h ULTRA).
10. **Currículo gating**: `canGenerateResume` com limites por plano.

### Fase 4: Upgrade/Downgrade (monetização)

11. **Página de configuração**: PlanCard mostra plano atual, limites, upgrade/downgrade.
12. **Fluxo de upgrade**: `changePlan` server action cria novo Checkout Session; webhook detecta price change.
13. **Fluxo de downgrade**: `cancel_at_period_end` + UI com data de transição.
14. **Webhook plan change**: `customer.subscription.updated` com price_id diferente → atualiza `Profile.plan` e `Subscription.plan` via `planFromPriceId`.

### Fase 5: Dashboard e retenção

15. **Dashboard**: uso atual vs limite.
16. **Upgrade prompts**: CTA de upgrade ao bater no limite.

---

## Glossary

| Location                                                  | Type       | Description                           |
| --------------------------------------------------------- | ---------- | ------------------------------------- |
| `code::src/lib/enums.ts::Plan`                            | source     | Enum com BASIC, PLUS, ULTRA           |
| `code::src/lib/plan-service.ts::PLAN_LIMITS`              | source     | Limites por plano                     |
| `code::src/lib/plan-service.ts::getPlanLimits`            | source     | Retorna limites do plano              |
| `code::src/lib/plan-service.ts::isChatAvailable`          | source     | Feature-gating por plano              |
| `code::src/lib/subscription.ts::getStripePriceId`         | source     | Mapeia plano → Stripe Price ID        |
| `code::src/lib/subscription.ts::planFromPriceId`          | source     | Mapeia Price ID → plano               |
| `code::src/app/gateway/form.tsx::GatewayForm`             | source     | Form com 3 opções de plano            |
| `code::src/app/api/auth/register/route.ts::POST`          | source     | Registro multi-plano                  |
| `code::src/app/api/webhook/payment/stripe/route.ts::POST` | source     | Webhook com detecção de plan change   |
| `code::src/lib/ai-generation-guardrails.ts`               | source     | Cooldown de insight/roadmap por plano |
| `feature::plan-tiers::ac-1`                               | acceptance | Enum com 3 planos                     |
| `feature::plan-tiers::ac-2`                               | acceptance | Limites definidos para 3 planos       |
| `feature::plan-tiers::ac-3`                               | acceptance | Stripe Price IDs para 3 planos        |
| `feature::plan-tiers::ac-4`                               | acceptance | Form com 3 planos                     |
| `feature::plan-tiers::ac-5`                               | acceptance | API aceita 3 planos                   |
| `feature::plan-tiers::ac-6`                               | acceptance | Dashboard mostra plano atual          |
| `feature::plan-tiers::ac-7`                               | acceptance | Upgrade flow                          |
| `feature::plan-tiers::ac-8`                               | acceptance | Downgrade flow                        |
| `feature::plan-tiers::ac-9`                               | acceptance | Webhook plan change                   |
| `feature::plan-tiers::ac-10`                              | acceptance | Feature gating por plano              |
