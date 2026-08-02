# Feature: Plan Tiers — Multi-Plan Monetization

> **Status**: `draft`

Ativar 3 planos (Básico, Intermediário, Premium) com diferenciação real de features e limites. Hoje só Básico existe; Intermediário e Premium estão comentados no enum. Sem tier gratuito.

## What

Descomentar os planos `INTERMEDIARY` e `PREMIUM` do enum, definir limites escalonados por plano (chat, currículos, insights, roadmaps), criar 3 Price IDs no Stripe, adaptar o fluxo de registro para oferecer os 3 planos, implementar upgrade/downgrade, e exibir o plano atual + limites no dashboard do usuário.

## Acceptance Criteria

- [ ] AC-1: `Plan` enum tem 3 valores ativos: `BASIC`, `INTERMEDIARY`, `PREMIUM`.
      Verify: `grep -c "BASIC\|INTERMEDIARY\|PREMIUM" src/lib/enums.ts | grep -q "3" && ! grep "//.*INTERMEDIARY\|//.*PREMIUM" src/lib/enums.ts`
- [ ] AC-2: `PLAN_LIMITS` em `plan-service.ts` define limites para os 3 planos com progressão clara.
      Verify: `grep "Plan.INTERMEDIARY\|Plan.PREMIUM" src/lib/plan-service.ts`
- [ ] AC-3: `getStripePriceId()` em `subscription.ts` aceita os 3 planos, cada um com sua env var (`STRIPE_BASIC_MONTHLY_PRICE_ID`, `STRIPE_INTERMEDIARY_MONTHLY_PRICE_ID`, `STRIPE_PREMIUM_MONTHLY_PRICE_ID`).
      Verify: `grep "INTERMEDIARY\|PREMIUM" src/lib/subscription.ts`
- [ ] AC-4: Formulário de registro (`gateway/form.tsx`) mostra 3 opções de plano com nome, preço e benefícios resumidos.
      Verify: `grep "Intermediario\|Premium\|R\\$" src/app/gateway/form.tsx`
- [ ] AC-5: API de registro (`POST /api/auth/register`) aceita qualquer um dos 3 planos.
      Verify: `grep "Plan.INTERMEDIARY\|Plan.PREMIUM" src/app/api/auth/register/route.ts || true` — validação `Object.values(Plan).includes(plan)` já cobre novos planos
- [ ] AC-6: Usuário vê plano atual e limites no dashboard/profile.
      Verify: `grep "plano\|Plano\|plan\b" src/app/profile/ --include="*.tsx" -l | head -5`
- [ ] AC-7: Upgrade de plano é possível via página de configuração (novo Stripe Checkout para o plano superior, cancela assinatura antiga).
      Verify: `grep "upgrade\|changePlan\|mudar.*plano\|alterar.*plano" src/app/profile/ --include="*.tsx" src/lib/ --include="*.ts" -l`
- [ ] AC-8: Downgrade efetivo acontece só ao final do período pago (cancel_at_period_end no Stripe), com UI informando data de transição.
      Verify: `grep "cancel_at_period_end\|period_end\|transition\|transicao" src/lib/subscription.ts src/app/profile/ --include="*.tsx" -l`
- [ ] AC-9: Webhook do Stripe processa mudanças de plano (`customer.subscription.updated` com price_id diferente) e atualiza `Subscription.plan` + `Profile.plan`.
      Verify: `grep "stripePriceId\|price\.id" src/app/api/webhook/payment/stripe/route.ts`
- [ ] AC-10: Features são desabilitadas no frontend e backend conforme o plano (ex: chat só a partir do Intermediário, currículos com limite diário).
      Verify: `grep "plan.*BASIC\|plan.*INTERMEDIARY\|plan.*PREMIUM\|featureEnabled\|isFeatureAvailable" src/lib/plan-service.ts` — função de feature-gating

## TDD

Executar cada critério como Red → Green → Anchor, per `wiki::red-green-tdd::mental-model`.

Os testes existentes em `plan-service.test.ts` e `usage-service.test.ts` devem ser atualizados para cobrir os 3 planos. Novos testes para feature-gating devem ser adicionados.

## Details

### Estratégia de Planos (Foco em Vendas e Retenção)

| Feature | Básico (R$29,99/mês) | Intermediário (R$59,99/mês) | Premium (R$99,99/mês) |
|---|---|---|---|
| **Insights de carreira** | 1 a cada 7 dias | 1 a cada 48h | Ilimitado (1/dia) |
| **Roadmap** | Sim (com extensão) | Sim (com extensão) | Sim (com extensão) |
| **Chat Coach** | ❌ | 3 sessões/dia | Ilimitado (10/dia) |
| **Currículos** | 3/dia | 10/dia | 30/dia |
| **Persona profile** | Sim | Sim | Sim |
| **NFS-e tax profile** | Sim | Sim | Sim |
| **Suporte** | Email (48h) | Email (24h) | Prioritário (chat/email 4h) |
| **Trial** | 7 dias | 7 dias | 7 dias |

**Por que Chat só a partir do Intermediário**: Chat com IA é o maior diferencial competitivo e o maior custo de API. Reservá-lo para planos pagos acima do básico cria um incentivo forte de upgrade. O Básico entrega valor real (insight + roadmap + 3 currículos/dia) para não frustrar, mas o usuário sente que está perdendo o "coach pessoal".

**Por que Roadmap igual para todos**: A extensão de roadmap ("próximos passos") é a jornada core do produto — o usuário conclui passos e o sistema gera novos. Mutilar isso no Básico quebraria o loop de engajamento. A diferenciação fica onde faz sentido comercial: chat (custo alto de API), currículos (uso em massa), e cooldown de insight (urgência).

**Por que currículos com limite diário**: Currículo é barato de gerar, mas o futuro da feature é uma extensão de browser que lê a descrição da vaga e gera currículo otimizado por vaga — cada candidatura = 1 geração. Limite diário faz mais sentido que mensal porque o uso é concentrado em sessões de candidatura. Básico (3/dia) cobre algumas vagas por dia; Premium (30/dia) atende power users que disparam candidaturas em massa.

**Por que Insight no Básico com cooldown maior (7 dias)**: O insight de carreira é o "aha moment" do produto — a peça que convence o usuário do valor. Dar acesso mesmo que lento mantém ativação e retenção de topo de funil. Intermediário reduz cooldown para 48h como incentivo de upgrade.

### Constraints

- Sem tier gratuito — todo acesso requer assinatura ativa.
- Trial de 7 dias mantido para todos os planos.
- Migração de plano via Stripe Checkout (nova sessão), não via API de subscription direta — simplifica PCI e mantém consistência.
- Preços em BRL, cartão de crédito apenas.
- Webhook do Stripe já persiste `stripePriceId` — usar isso para detectar mudança de plano.

### Out of Scope

- Plano anual ou semestral.
- Pagamento via PIX, boleto, débito.
- Customer Portal do Stripe (Billing Portal).
- Desconto por indicação.
- Cupons de desconto.
- Faturamento NFSe automatizado (já é manual).
- Analytics de conversão de plano.

---

## Dependencies

### Feature Dependencies

- `wiki::subscription-payment::mental-model` — fluxo de pagamento existente
- `code::src/lib/enums.ts::Plan` — enum a ser expandido
- `code::src/lib/plan-service.ts::PLAN_LIMITS` — limites que precisam dos 3 planos
- `code::src/lib/subscription.ts::getStripePriceId` — mapeamento de plano → Price ID
- `code::src/lib/subscription.ts::createSubscription` — criação de Checkout Session
- `code::src/app/gateway/form.tsx::GatewayForm` — formulário de registro
- `code::src/app/api/auth/register/route.ts::POST` — endpoint de registro
- `code::src/app/api/webhook/payment/stripe/route.ts::POST` — webhook de reconciliação
- `code::src/models/Subscription.ts::Subscription` — modelo de assinatura
- `code::src/models/Profile.ts::Profile` — perfil com campo `plan`
- `code::src/lib/usage-service.ts` — limites diários de uso
- `code::src/models/DailyUsage.ts::DailyUsage` — contadores diários
- `code::src/lib/ai-generation-guardrails.ts` — regras de geração de insight/roadmap

### External Dependencies

- Stripe: 3 Products + 3 monthly Prices em BRL
- Stripe: 3 env vars (`STRIPE_BASIC_MONTHLY_PRICE_ID`, `STRIPE_INTERMEDIARY_MONTHLY_PRICE_ID`, `STRIPE_PREMIUM_MONTHLY_PRICE_ID`)
- MongoDB: sem novas collections necessárias (campos existentes bastam)
- Auth0: sem alterações

---

## Technical Considerations

### Performance

- `getPlanLimits()` já é O(1) — lookup em Record estático.
- Feature-gating consulta o mesmo `getPlanLimits()` — sem query extra.
- Upgrade/downgrade é ação infrequente — não precisa de cache.

### Security

- Validação de plano no backend é obrigatória — nunca confiar no client.
- Webhook do Stripe é a única fonte de verdade para mudança de plano paga.
- Feature-gating é aplicado no backend; frontend gating é UX apenas.

### Backward Compatibility

- Planos `BASIC` existentes continuam funcionando idênticos.
- Campos `plan` no Profile e Subscription já existem — sem migração de schema.
- `PLAN_LIMITS` fallback para BASIC cobre qualquer `undefined`/corrompido.
- Enum expandido mantém `BASIC = "basic"` inalterado.
- `Plan.INTERMEDIARY` e `Plan.PREMIUM` eram comentados — descomentar + adicionar string values.

---

## Plano de Ação — Implementação em Fases

### Fase 1: Fundação (back-end, sem impacto no usuário)

1. **Descomentar enum + plan-service**: `enums.ts`: `INTERMEDIARY = "intermediary"`, `PREMIUM = "premium"`. `plan-service.ts`: limites para os 3 planos conforme tabela.
2. **Stripe Price IDs**: `subscription.ts`: `getStripePriceId()` aceita 3 planos. 3 env vars necessárias.
3. **Testes**: Atualizar `plan-service.test.ts` e `usage-service.test.ts` para 3 planos.

### Fase 2: Registro multi-plano (visível no funil)

4. **Gateway form**: 3 opções de plano com nome, preço e 2-3 bullet points de benefícios.
5. **API register**: Confirmar que `Object.values(Plan).includes(plan)` já valida novos planos (sem alteração necessária além de garantir que Stripe Price ID existe).
6. **Email de ativação**: `sendPaymentEmail` já recebe `plan` — atualizar copy se necessário.

### Fase 3: Feature-gating (diferenciação real)

7. **plan-service feature flags**: `isFeatureEnabled(plan, feature)` ou limites que retornam 0 para features desabilitadas (ex: `chatSessionsPerDay: 0` para BASIC).
8. **Chat gating**: `canStartChatSession` retorna false quando limite = 0. Frontend mostra "Disponível a partir do plano Intermediário" em vez de "limite atingido".
9. **Insight gating**: Ajustar `ai-generation-guardrails.ts` para cooldown por plano (7 dias BASIC, 48h INTERMEDIARY, 24h PREMIUM).
10. **Currículo gating**: `canGenerateResume` com limites por plano.

### Fase 4: Upgrade/Downgrade (monetização)

11. **Página de configuração**: Seção "Plano" mostrando plano atual, limites, e botão de upgrade.
12. **Fluxo de upgrade**: Server action que cria novo Checkout Session para plano superior. Webhook detecta price change e atualiza.
13. **Fluxo de downgrade**: `cancel_at_period_end` + UI mostrando "seu plano será alterado em DD/MM/YYYY".
14. **Webhook plan change**: `customer.subscription.updated` com price_id diferente → atualiza `Profile.plan` e `Subscription.plan`.

### Fase 5: Dashboard e retenção

15. **Dashboard**: Mostrar uso atual vs limite ("3/5 currículos este mês", "2/3 chats hoje").
16. **Upgrade prompts**: Quando usuário bate no limite, mostrar CTA de upgrade em vez de apenas bloquear.

---

## Glossary

| Location | Type | Description |
|----------|------|-------------|
| `code::src/lib/enums.ts::Plan` | source | Enum expandido com BASIC, INTERMEDIARY, PREMIUM |
| `code::src/lib/plan-service.ts::PLAN_LIMITS` | source | Limites por plano |
| `code::src/lib/plan-service.ts::getPlanLimits` | source | Retorna limites do plano |
| `code::src/lib/plan-service.ts::isFeatureEnabled` | source | Feature-gating por plano (novo) |
| `code::src/lib/subscription.ts::getStripePriceId` | source | Mapeia plano → Stripe Price ID |
| `code::src/app/gateway/form.tsx::GatewayForm` | source | Form com 3 opções de plano |
| `code::src/app/api/auth/register/route.ts::POST` | source | Registro multi-plano |
| `code::src/app/api/webhook/payment/stripe/route.ts::POST` | source | Webhook com detecção de plan change |
| `code::src/lib/ai-generation-guardrails.ts` | source | Cooldown de insight/roadmap por plano |
| `feature::plan-tiers::ac-1` | acceptance | Enum com 3 planos |
| `feature::plan-tiers::ac-2` | acceptance | Limites definidos para 3 planos |
| `feature::plan-tiers::ac-3` | acceptance | Stripe Price IDs para 3 planos |
| `feature::plan-tiers::ac-4` | acceptance | Form com 3 planos |
| `feature::plan-tiers::ac-5` | acceptance | API aceita 3 planos |
| `feature::plan-tiers::ac-6` | acceptance | Dashboard mostra plano atual |
| `feature::plan-tiers::ac-7` | acceptance | Upgrade flow |
| `feature::plan-tiers::ac-8` | acceptance | Downgrade flow |
| `feature::plan-tiers::ac-9` | acceptance | Webhook plan change |
| `feature::plan-tiers::ac-10` | acceptance | Feature gating por plano |
