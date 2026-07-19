# Feature: Chat Notes Persistence

> **Status**: `draft`

Micro-resumo por sessão de chat, gerado e sobrescrito a cada troca de mensagens. Salvo em coleção `chatNotes` no MongoDB. O resumo NÃO é enviado ao LLM do coach — apenas o histórico de mensagens é usado para gerar as notas. Conversas muito curtas são filtradas sem custo de LLM.

## What

A cada troca de mensagens (usuário envia + IA responde), o servidor gera um micro-resumo da conversa e persiste em `chatNotes`. Na próxima mensagem, o resumo é sobrescrito com a versão atualizada. O resumo é retornado no SSE junto com os dados da sessão para que o frontend possa exibi-lo futuramente, sem UI nova neste momento.

## Acceptance Criteria

- [ ] Modelo `ChatNotes` existe com `(profileId, sessionId)` como chave composta única e campo `notes: string`.
      Verify: `grep -r "ChatNotes" src/models/ChatNotes.ts` — modelo exportado com índice único composto
- [ ] `generateChatNotes(messages)` em `src/lib/chat-notes.ts` gera resumo via LLM com prompt específico, sem streaming.
      Verify: `grep "export async function generateChatNotes" src/lib/chat-notes.ts` — função exportada
- [ ] Conversas com total de caracteres < 100 não geram chamada LLM — notas salvas como string vazia.
      Verify: `grep "MIN_CHARS\|minChars\|< 100\|length < 100" src/lib/chat-notes.ts` — guard clause antes da chamada LLM
- [ ] Notas nunca excedem 30% do tamanho total da conversa (pós-geração, truncamento server-side).
      Verify: `grep "MAX_NOTES_RATIO\|0\.3\|30%" src/lib/chat-notes.ts` — truncamento aplicado após geração
- [ ] Prompt de sumarização NUNCA aparece no prompt do coach (chamadas separadas, prompts isolados).
      Verify: `grep -c "notes\|resumo\|summar" src/lib/prompt-builder.ts` — zero matches
- [ ] `POST /api/chat` gera notas após o stream do coach terminar e inclui `notes` no `sessionPayload` do SSE.
      Verify: `grep "notes" src/app/api/chat/route.ts` — campo `notes` presente no JSON do SSE
- [ ] `ChatSessionData` em `chat-api.ts` inclui campo `notes?: string`.
      Verify: `grep "notes" src/lib/chat-api.ts` — tipo ChatSessionData com notes opcional
- [ ] `ChatNotes.findOneAndUpdate` com `upsert: true` sobrescreve notas existentes.
      Verify: `grep "findOneAndUpdate\|upsert.*true" src/app/api/chat/route.ts` — upsert usado na rota

## TDD

Red / Green / Anchor conforme `wiki::red-green-tdd::mental-model`.

Cada AC executa o `Verify` antes (deve falhar) e depois (deve passar) da implementação.

## Details

### Constraints

- Notas são texto puro em português, frases curtas e diretas (ex: "o usuário quer saber como negociar salário", "o usuário tem interesse em certificações AWS")
- Tamanho máximo das notas: 30% da contagem total de caracteres da conversa `body.messages.map(m => m.content).join(" ").length * 0.3`
- Conversas muito curtas (soma de caracteres < 100) pulam a geração — nota salva como `""`
- Geração de notas usa o mesmo modelo `gpt-5-nano` mas em chamada separada, sem stream
- Notas NÃO entram no prompt do coach — responsabilidades isoladas
- Sem alteração de UI neste momento — notas apenas persistem e são retornadas no SSE
- Prompt de sumarização é fixo, não recebe persona nem contexto adicional

### Out of Scope

- Exibição de notas na UI (futuro: sidebar, card de resumo)
- Histórico de versões das notas
- Sumarização incremental (notas anteriores como input)
- Busca ou filtro por conteúdo das notas
- Exportação de notas

---

## Dependencies

### Feature Dependencies

- `code::src/app/api/chat/route.ts::POST` — rota que orquestra a geração de notas pós-stream
- `code::src/lib/chat-api.ts::ChatSessionData` — tipo que recebe o campo `notes`
- `code::src/lib/chat-service.ts::generateChatResponse` — serviço de chat (não alterado)
- `code::src/lib/prompt-builder.ts::PromptBuilder` — builder de prompt (não alterado)

### External Dependencies

- MongoDB/Mongoose — coleção `chatNotes`
- OpenAI (`gpt-5-nano-2025-08-07`) — chamada de sumarização separada

---

## Technical Considerations

### Performance

- Segunda chamada LLM é leve: sem stream, prompt curto (~300 tokens de sistema + ~N tokens de histórico), output ~100 tokens
- Filtro de 100 caracteres evita chamadas para "oi"/"olá" (~30-50% das primeiras interações)
- Truncamento pós-geração garante teto de 30% — custo previsível por sessão

### Security

- Autenticação herdada da rota POST /api/chat — notas atreladas ao `profileId` validado
- Nenhum dado novo exposto ao cliente além do que já trafega no SSE

### Backward Compatibility

- Campo `notes` adicionado ao `sessionPayload` do SSE — clientes que não leem o campo ignoram
- `ChatSessionData.notes` é opcional — código existente compila sem alteração
- Sem migração de dados — coleção nova, `upsert: true` cobre primeiro acesso

---

## API Contract

### SSE sessionPayload (campo novo)

```json
{
  "session": {
    "sessionId": "cs_...",
    "tokenLimit": 150000,
    "promptTokens": 350,
    "completionTokens": 200,
    "totalTokens": 550,
    "notes": "o usuário quer saber como negociar salário em uma promoção."
  }
}
```

### Modelo ChatNotes

```typescript
interface IChatNotes {
  profileId: string;
  sessionId: string;
  notes: string;         // "" quando conversa < 100 chars
  createdAt: Date;
  updatedAt: Date;
}
```

### Prompt de sumarização

```
Você é um extrator de notas. Abaixo está o histórico de uma conversa entre
um usuário e um coach de carreira.

Gere um micro-resumo em português do Brasil com no máximo 3 frases curtas.
Use frases diretas e objetivas, sempre no formato:
- "o usuário quer saber X"
- "o usuário tem interesse em X"
- "o coach recomendou X"

NÃO repita saudações. NÃO inclua "oi", "olá" ou agradecimentos no resumo.
Se a conversa for apenas uma saudação sem conteúdo de carreira, responda
com string vazia.
```

---

## Glossary

| Location | Type | Description |
|----------|------|-------------|
| `code::src/models/ChatNotes.ts::ChatNotes` | source | Mongoose model — notas por (profileId, sessionId), upsert |
| `code::src/lib/chat-notes.ts::generateChatNotes` | source | Gera notas via LLM separado, com filtro de conversas curtas e truncamento |
| `code::src/app/api/chat/route.ts::POST` | source | Rota alterada — gera notas pós-stream, inclui no SSE |
| `code::src/lib/chat-api.ts::ChatSessionData` | source | Tipo alterado — campo `notes?: string` adicionado |
| `code::src/lib/chat-notes.ts::MIN_CHARS_FOR_NOTES` | source | Constante = 100 — conversas abaixo disso não geram chamada LLM |
| `code::src/lib/chat-notes.ts::MAX_NOTES_RATIO` | source | Constante = 0.3 — notas truncadas se > 30% do tamanho da conversa |
