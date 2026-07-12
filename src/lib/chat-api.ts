import { getAccessToken } from "@auth0/nextjs-auth0";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface ChatResponse {
  message: {
    role: "assistant";
    content: string;
  };
}

interface ChatError {
  error: string;
  code?: string;
}

export class ChatApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code?: string
  ) {
    super(message);
    this.name = "ChatApiError";
  }
}

export async function sendChatMessage(messages: ChatMessage[]): Promise<ChatMessage> {
  const token = await getAccessToken();

  console.log("[chat-api] sending request to /api/chat", { messageCount: messages.length });

  const res = await fetch("/api/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ messages }),
  });

  if (!res.ok) {
    console.error("[chat-api] request failed", { status: res.status, statusText: res.statusText });

    let errorMessage = "Não foi possível obter uma resposta. Tente novamente em instantes.";
    let code: string | undefined;

    try {
      const body: ChatError = await res.json();
      code = body.code;
      if (body.error) errorMessage = body.error;
      console.error("[chat-api] server error body", body);
    } catch (parseErr) {
      console.error("[chat-api] could not parse error response", parseErr);
    }

    throw new ChatApiError(errorMessage, res.status, code);
  }

  const data: ChatResponse = await res.json();
  console.log("[chat-api] received response", { contentLength: data.message.content.length });
  return data.message;
}
