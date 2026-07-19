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

// ponytail: shared 401 handler — same pattern as roadmap.tsx, insightForm.tsx, ResumeGenerator.tsx
function redirectOnExpiredToken(res: Response): void {
  if (res.status === 401) {
    window.location.href = "/auth/logout";
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
    redirectOnExpiredToken(res);
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

export interface ChatUsage {
  sessionsStarted: number;
  sessionsLimit: number;
  canStartSession: boolean;
  tokenLimit: number;
}

export interface ChatSessionData {
  sessionId: string;
  tokenLimit: number;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  notes?: string;
}

export async function fetchSessionTokens(sessionId: string): Promise<ChatSessionData> {
  const token = await getAccessToken();

  const res = await fetch(`/api/chat/session?sessionId=${encodeURIComponent(sessionId)}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    redirectOnExpiredToken(res);
    throw new Error("Failed to fetch session tokens");
  }
  return res.json();
}

export async function fetchChatUsage(): Promise<ChatUsage> {
  const token = await getAccessToken();

  const res = await fetch("/api/chat/usage", {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    redirectOnExpiredToken(res);
    throw new Error("Failed to fetch usage");
  }
  return res.json();
}

export async function streamChatMessage(
  messages: ChatMessage[],
  sessionId: string | undefined,
  onToken: (token: string) => void,
  onError: (error: string) => void,
  onDone: (sessionData: ChatSessionData | null) => void,
): Promise<void> {
  // [DIAGNOSTIC] mark connection start
  const t0 = Date.now();
  console.log("[chat-api] opening stream connection", { time: t0, messageCount: messages.length });

  const token = await getAccessToken();

  const res = await fetch("/api/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ messages, sessionId }),
  });

  if (!res.ok) {
    redirectOnExpiredToken(res);
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

    if (payload === "[DONE]") { onDone(sessionData); return true; }

    try {
      const parsed = JSON.parse(payload);
      if (parsed.error) { onError(parsed.error); return true; }
      if (parsed.token) {
        console.log("[chat-api] parsed token", {
          time: Date.now(),
          length: parsed.token.length,
          content: parsed.token.slice(0, 60),
        });
        onToken(parsed.token);
      }
      if (parsed.session) {
        sessionData = parsed.session;
      }
    } catch { /* malformed SSE line, skip */ }

    return false;
  };

  let sessionData: ChatSessionData | null = null;

  const decoder = new TextDecoder();
  let buffer = "";
  let firstChunk = true;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      // [DIAGNOSTIC] track first chunk latency
      if (firstChunk) {
        firstChunk = false;
        console.log("[chat-api] first chunk received", {
          time: Date.now(),
          latencyMs: Date.now() - t0,
          chunkSize: value?.length ?? 0,
        });
      }

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        if (processSSELine(line)) return;
      }
    }

    // Stream closed without [DONE]
    console.log("[chat-api] stream closed (no [DONE])", { time: Date.now(), elapsedMs: Date.now() - t0 });
    onDone(sessionData);
  } catch (err) {
    console.error("[chat-api] stream error", { time: Date.now(), err });
    onError(err instanceof Error ? err.message : "Erro no stream.");
  }
}
