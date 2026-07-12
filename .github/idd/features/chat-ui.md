# Feature: Chat UI (Career Coach)

> **Status**: `etapa-2`

Chat interface for the Career Coach with real AI integration via LangChain/OpenAI. No persistence — all conversation history is in-memory only, lost on page refresh.

## What

Implement a ChatGPT-like chat interface adapted to the AcelerAi design system, with sidebar conversations, message history, composer with character limit, responsive mobile drawer, and a real backend AI integration through a POST /api/chat endpoint.

## Acceptance Criteria

- [x] Interface completa funcionando com backend.
      Verify: `grep -r "fetch\|langchain\|openai" src/app/profile/\[profile_id\]/chat/ src/lib/chat-api.ts 2>/dev/null` — chat-api.ts imports fetch, chat-service.ts imports @langchain
- [x] Resposta obtida via HTTP tradicional (POST /api/chat).
      Verify: `grep "method.*POST" src/lib/chat-api.ts` — uses fetch POST
- [x] Sem streaming/SSE/WebSocket.
      Verify: `grep -r "stream\|SSE\|WebSocket\|EventSource" src/lib/chat-api.ts src/lib/chat-service.ts src/app/api/chat/ 2>/dev/null` — no matches
- [x] Histórico em memória durante a sessão.
      Verify: `grep "sessionMessagesRef\|useRef" src/app/profile/\[profile_id\]/chat/page.tsx` — sessionMessagesRef stores messages per session
- [x] Atualizar página reinicia conversa.
      Verify: manual — all state is useState/useRef, no persistence
- [x] Backend utiliza LangChain para construir prompt.
      Verify: `grep "SystemMessage\|HumanMessage\|AIMessage\|ChatOpenAI\|prompt" src/lib/chat-service.ts` — uses LangChain messages + ChatOpenAI
- [x] System Prompt enviado em todas as requisições.
      Verify: `grep "SystemMessage" src/lib/chat-service.ts` — always first in invoke array
- [x] Histórico completo enviado ao modelo.
      Verify: `grep "\.\.\.messages\.map" src/lib/chat-service.ts` — all messages passed to model.invoke
- [x] Limite de 500 caracteres para entrada.
      Verify: `grep "maxLength\|MAX_CHARS\|MAX_INPUT_CHARS" src/components/ChatComposer.tsx src/app/api/chat/route.ts` — textarea maxLength + API validation
- [x] Respostas limitadas a ~500 caracteres.
      Verify: `grep "MAX_OUTPUT_CHARS\|500" src/lib/chat-service.ts` — truncation logic
- [x] Tratamento de erros no frontend e backend.
      Verify: `grep "try\|catch\|ChatApiError\|AuthError" src/lib/chat-api.ts src/app/api/chat/route.ts src/app/profile/\[profile_id\]/chat/page.tsx` — try/catch in all layers
- [x] Navegação entre conversas.
      Verify: manual — click sidebar items switches active conversation and message list
- [x] Criação de nova conversa.
      Verify: manual — "Nova conversa" button adds entry to sidebar and selects it
- [x] Lista de mensagens renderizada corretamente.
      Verify: manual — user messages right-aligned, assistant messages left-aligned
- [x] Envio adiciona mensagem localmente antes da resposta.
      Verify: manual — type text, click send, user message appears immediately
- [x] Indicador de carregamento exibido durante requisição.
      Verify: manual — TypingIndicator shows while waiting for API response
- [x] Contador de caracteres funciona.
      Verify: manual — typing updates "N / 500" counter in real time
- [x] Estado vazio implementado.
      Verify: manual — no session selected shows empty state message
- [x] Layout responsivo para desktop e mobile.
      Verify: manual — desktop shows fixed sidebar; mobile shows hamburger + drawer
- [x] Código organizado em componentes reutilizáveis.
      Verify: `ls src/components/Chat*.tsx src/components/TypingIndicator.tsx` — ChatComposer.tsx, ChatMessage.tsx, ChatSidebar.tsx, TypingIndicator.tsx exist
- [x] Sem persistência (MongoDB, sessões, histórico salvo).
      Verify: `grep -r "mongoose\|MongoDB\|connectDB\|CareerInsight\|CareerRoadmap\|Persona" src/lib/chat-service.ts src/app/api/chat/route.ts src/lib/chat-api.ts src/app/profile/\[profile_id\]/chat/page.tsx 2>/dev/null; echo "exit: $?"` — no matches (exit 1)
- [x] Arquitetura preparada para sessões persistidas.
      Verify: chat-api.ts is an abstraction layer; sessionMessagesRef is a drop-in target for future session store

## Details

### Constraints

- All chat state is local (useState + useRef), no Context or global stores
- No MongoDB, no persistence of any kind
- No streaming — full response returned at once via POST
- Must use existing Tailwind v4 design system (purple-to-indigo brand gradient)
- Components follow existing conventions: flat `src/components/`, PascalCase filenames
- Route lives under `src/app/profile/[profile_id]/chat/` within existing profile layout
- 500-character limit on input and output

### Out of Scope

- MongoDB / persistence
- Sessões persistidas
- Histórico salvo
- Persona persistente
- Notas da Persona
- Recuperação de conversas anteriores
- Sumarização
- Limite de número de mensagens
- Streaming de respostas
- WebSocket / SSE

---

## Dependencies

### Feature Dependencies

- Existing profile layout (`src/app/profile/[profile_id]/layout.tsx`) provides header + sidebar wrapper
- Existing Auth0 integration via `@/lib/auth0` for API route protection
- Existing OpenAI API key via `process.env.OPENAI_API_KEY`

### External Dependencies

- `@langchain/openai` (already installed) — ChatOpenAI model
- `@langchain/core/messages` (already installed) — SystemMessage, HumanMessage, AIMessage

---

## Technical Considerations

### Performance

- All state local, no unnecessary re-renders
- Sidebar conversation list uses simple `.map()` — will need virtualization only at 100+ items

### Security

- API route protected via `isAuthenticated()` — validates Auth0 JWT
- Input validation: message array required, each message validated for role/content
- Input length enforced at both client (textarea maxLength) and server (validation)

### Backward Compatibility

- New files only, no existing routes or components modified
- ChatComposer.tsx received a `maxLength` attribute (native HTML, backward compatible)

---

## Glossary

| Location | Type | Description |
|----------|------|-------------|
| `code::src/app/profile/[profile_id]/chat/page.tsx::ChatPage` | source | Main chat page with all local state, wired to real API |
| `code::src/components/ChatSidebar.tsx::ChatSidebar` | source | Conversation list sidebar with mobile drawer toggle |
| `code::src/components/ChatMessage.tsx::ChatMessage` | source | Reusable message bubble (user/assistant) |
| `code::src/components/ChatComposer.tsx::ChatComposer` | source | Textarea, character counter, send button with maxLength |
| `code::src/components/TypingIndicator.tsx::TypingIndicator` | source | Animated loading dots indicator |
| `code::src/lib/chat-api.ts::sendChatMessage` | source | Frontend API client — POST /api/chat |
| `code::src/lib/chat-api.ts::ChatApiError` | source | Custom error class for API failures |
| `code::src/lib/chat-service.ts::generateChatResponse` | source | LangChain chat service — builds prompt, invokes LLM, truncates output |
| `code::src/app/api/chat/route.ts::POST` | source | API endpoint — validates input, delegates to chat-service, returns { message: { role, content } } |
