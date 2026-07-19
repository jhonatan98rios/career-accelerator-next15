import { createModel } from "@/lib/llm-client";
import { SystemMessage, HumanMessage } from "@langchain/core/messages";
import { type ChatMessage } from "@/lib/chat-service";

// ponytail: skip LLM call for trivial conversations (greetings, empty)
export const MIN_CHARS_FOR_NOTES = 100;

// ponytail: notes must not exceed 30% of total conversation length
export const MAX_NOTES_RATIO = 0.3;

const SUMMARY_SYSTEM_PROMPT = `Você é um extrator de notas. Abaixo está o histórico de uma conversa entre
um usuário e um coach de carreira.

Gere um micro-resumo em português do Brasil com no máximo 3 frases curtas.
Use frases diretas e objetivas, sempre no formato:
- "o usuário quer saber X"
- "o usuário tem interesse em X"
- "o coach recomendou X"

NÃO repita saudações. NÃO inclua "oi", "olá" ou agradecimentos no resumo.
Se a conversa for apenas uma saudação sem conteúdo de carreira, responda
com string vazia.`;

export async function generateChatNotes(messages: ChatMessage[]): Promise<string> {
  const totalChars = messages.reduce((sum, m) => sum + m.content.length, 0);

  if (totalChars < MIN_CHARS_FOR_NOTES) {
    return "";
  }

  const maxNotesChars = Math.floor(totalChars * MAX_NOTES_RATIO);

  // ponytail: per-request model avoids stale connections
  const model = createModel({
    maxTokens: 200,
    temperature: 0.3,
  });

  const history = messages
    .map((m) => `${m.role === "user" ? "Usuário" : "Coach"}: ${m.content}`)
    .join("\n\n");

  const response = await model.invoke([
    new SystemMessage(SUMMARY_SYSTEM_PROMPT),
    new HumanMessage(`Histórico da conversa:\n\n${history}`),
  ]);

  const raw = (response.content as string) ?? "";

  // ponytail: enforce max ratio server-side, no point sending oversized notes
  if (raw.length > maxNotesChars) {
    return raw.slice(0, maxNotesChars);
  }

  return raw;
}
