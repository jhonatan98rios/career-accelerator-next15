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

export async function streamChatMessage(
  messages: ChatMessage[],
  onToken: (token: string) => void,
  onError: (error: string) => void,
  onDone: () => void,
): Promise<void> {
  const token = await getAccessToken();

  const res = await fetch("/api/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ messages }),
  });

  if (!res.ok) {
    let msg = "Não foi possível obter uma resposta.";
    try {
      const body = await res.json();
      if (body.error) msg = body.error;
    } catch { /* body parse failed, use default */ }
    onError(msg);
    return;
  }

  const reader = res.body?.getReader();
  if (!reader) {
    onError("Stream não disponível.");
    return;
  }

  // ponytail: extract SSE line processing to stay within max-depth (4)
  const processSSELine = (line: string): boolean => {
    if (!line.startsWith("data: ")) return false;
    const payload = line.slice(6);

    if (payload === "[DONE]") { onDone(); return true; }

    try {
      const parsed = JSON.parse(payload);
      if (parsed.error) { onError(parsed.error); return true; }
      if (parsed.token) onToken(parsed.token);
    } catch { /* malformed SSE line, skip */ }

    return false;
  };

  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        if (processSSELine(line)) return;
      }
    }

    // Stream closed without [DONE]
    onDone();
  } catch (err) {
    onError(err instanceof Error ? err.message : "Erro no stream.");
  }
}
