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
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages }),
  });

  if (!res.ok) {
    let errorMessage = "Não foi possível obter uma resposta. Tente novamente em instantes.";
    let code: string | undefined;

    try {
      const body: ChatError = await res.json();
      code = body.code;
      if (body.error) errorMessage = body.error;
    } catch {
      // Use default error message
    }

    throw new ChatApiError(errorMessage, res.status, code);
  }

  const data: ChatResponse = await res.json();
  return data.message;
}
