"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import ChatSidebar, { type ChatSession } from "@/components/ChatSidebar";
import ChatMessage, { type ChatMessageData } from "@/components/ChatMessage";
import ChatComposer from "@/components/ChatComposer";
import { streamChatMessage, type ChatMessage as ApiChatMessage } from "@/lib/chat-api";

let nextId = 100;

function newId(): string {
  return `m${nextId++}`;
}

// ── Page component ─────────────────────────────────────────

export default function ChatPage() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessageData[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // ponytail: plain object ref — Map overkill for in-memory session messages
  const sessionMessagesRef = useRef<Record<string, ChatMessageData[]>>({});

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSelectSession = useCallback((id: string) => {
    setSelectedId(id);
    setMessages(sessionMessagesRef.current[id] ?? []);
    setError(null);
  }, []);

  const handleNewSession = useCallback(() => {
    const id = `s${nextId}`;
    const session: ChatSession = { id, title: "Nova conversa" };
    setSessions((prev) => [session, ...prev]);
    setSelectedId(id);
    setMessages([]);
    setInput("");
    setError(null);
  }, []);

  // ponytail: extract stream call to keep callback nesting within lint limit
  const runStream = async (apiMessages: ApiChatMessage[], assistantId: string) => {
    await streamChatMessage(
      apiMessages,
      (token) => {
        setMessages((prev) => {
          const next = [...prev];
          const idx = next.findIndex((m) => m.id === assistantId);
          if (idx !== -1) next[idx] = { ...next[idx], content: next[idx].content + token };
          return next;
        });
      },
      (err) => {
        setError(err);
        setLoading(false);
      },
      () => {
        setMessages((prev) => {
          sessionMessagesRef.current[selectedId!] = prev;
          return prev;
        });
        setLoading(false);
      }
    );
  };

  const handleSend = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    const userMsg: ChatMessageData = {
      id: newId(),
      role: "user",
      content: trimmed,
    };

    const conversationMessages = [...messages, userMsg];
    const assistantId = newId();

    setMessages([
      ...conversationMessages,
      { id: assistantId, role: "assistant" as const, content: "" },
    ]);
    setInput("");
    setError(null);
    setLoading(true);

    // Update session title if it's the first message
    if (selectedId && messages.length === 0) {
      setSessions((prev) =>
        prev.map((s) =>
          s.id === selectedId
            ? { ...s, title: trimmed.slice(0, 40) + (trimmed.length > 40 ? "…" : "") }
            : s
        )
      );
    }

    const apiMessages: ApiChatMessage[] = conversationMessages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    try {
      await runStream(apiMessages, assistantId);
    } catch (err) {
      console.error("[chat-page] stream failed", err);
      setLoading(false);
      setError("Não foi possível obter uma resposta. Tente novamente em instantes.");
    }
  }, [input, loading, selectedId, messages]);

  const selectedSession = sessions.find((s) => s.id === selectedId) ?? null;

  return (
    <div className="max-w-3xl mx-auto flex min-h-[75vh] rounded-xl overflow-hidden border border-gray-200 bg-white shadow-sm">
      {/* Sidebar */}
      <ChatSidebar
        sessions={sessions}
        selectedId={selectedId}
        onSelect={handleSelectSession}
        onNew={handleNewSession}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main chat area */}
      <div className="flex-1 flex flex-col min-w-0 bg-gray-50">
        {/* Header bar */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 bg-white">
          {/* Mobile hamburger */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="md:hidden p-1.5 rounded-lg hover:bg-gray-100 text-gray-600"
            aria-label="Abrir conversas"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 6h18M3 12h18M3 18h18" />
            </svg>
          </button>

          <h2 className="text-sm font-semibold text-gray-700 truncate">
            {selectedSession ? selectedSession.title : "Coach de Carreira"}
          </h2>
        </div>

        {/* Messages or empty state */}
        {selectedSession ? (
          <div className="flex-1 overflow-y-auto px-4 py-4">
            {messages.length === 0 && !loading && (
              <div className="flex items-center justify-center h-full">
                <p className="text-gray-400 text-sm">Envie sua primeira mensagem.</p>
              </div>
            )}

            {messages.map((m) => (
              <ChatMessage key={m.id} message={m} />
            ))}

            {error && (
              <div className="flex justify-center my-3">
                <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm text-center max-w-md">
                  <p>{error}</p>
                  <button
                    onClick={() => setError(null)}
                    className="mt-1.5 text-xs underline text-red-600 hover:text-red-800"
                  >
                    Dispensar
                  </button>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        ) : (
          /* Empty state — no session selected */
          <div className="flex-1 flex items-center justify-center px-4">
            <div className="text-center">
              <h2 className="text-xl font-bold text-gray-700 mb-2">
                Comece uma nova conversa.
              </h2>
              <p className="text-gray-500 text-sm leading-relaxed">
                Pergunte sobre carreira, currículo,
                <br />
                entrevistas ou planejamento profissional.
              </p>
              <button
                onClick={handleNewSession}
                className="mt-6 px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-500 text-white text-sm font-semibold hover:opacity-90 transition"
              >
                + Nova conversa
              </button>
            </div>
          </div>
        )}

        {/* Composer — only when a session is selected */}
        {selectedSession && (
          <ChatComposer
            value={input}
            onChange={setInput}
            onSend={handleSend}
            disabled={loading}
          />
        )}
      </div>
    </div>
  );
}
