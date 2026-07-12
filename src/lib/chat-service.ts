import { ChatOpenAI } from "@langchain/openai";
import { SystemMessage, HumanMessage, AIMessage } from "@langchain/core/messages";

const MAX_OUTPUT_CHARS = 500;

const model = new ChatOpenAI({
  model: "gpt-5-nano-2025-08-07",
  apiKey: process.env.OPENAI_API_KEY,
});

const SYSTEM_PROMPT = `Você é um coach de carreira especializado. Suas responsabilidades:

- Responder perguntas sobre carreira, currículo, entrevistas e desenvolvimento profissional.
- Dar respostas objetivas e diretas.
- Evitar respostas excessivamente longas — limite-se a aproximadamente ${MAX_OUTPUT_CHARS} caracteres.
- Focar exclusivamente no tema de carreira e mercado de trabalho.
- Responder sempre em português do Brasil.`;

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export async function generateChatResponse(messages: ChatMessage[]): Promise<string> {
  const response = await model.invoke([
    new SystemMessage(SYSTEM_PROMPT),
    ...messages.map((m) =>
      m.role === "user" ? new HumanMessage(m.content) : new AIMessage(m.content)
    ),
  ]);

  let content = (response.content as string) ?? "";

  if (content.length > MAX_OUTPUT_CHARS) {
    content = content.slice(0, MAX_OUTPUT_CHARS).trimEnd();
  }

  return content;
}
