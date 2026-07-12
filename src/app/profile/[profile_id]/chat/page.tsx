"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import ChatSidebar, { type ChatSession } from "@/components/ChatSidebar";
import ChatMessage, { type ChatMessageData } from "@/components/ChatMessage";
import ChatComposer from "@/components/ChatComposer";
import TypingIndicator from "@/components/TypingIndicator";

// ── Mock data ──────────────────────────────────────────────

const MOCK_SESSIONS: ChatSession[] = [
  { id: "1", title: "Plano para Big Tech" },
  { id: "2", title: "Currículo" },
  { id: "3", title: "Entrevista" },
];

const MOCK_MESSAGES: Record<string, ChatMessageData[]> = {
  "1": [
    {
      id: "m1",
      role: "user",
      content: "Quero montar um plano para entrar no Google como engenheiro sênior.",
    },
    {
      id: "m2",
      role: "assistant",
      content: "Ótimo! Vamos traçar um plano estruturado. Primeiro, me conte: qual sua experiência atual com system design e algoritmos?",
    },
  ],
  "2": [
    {
      id: "m3",
      role: "user",
      content: "Preciso melhorar meu currículo para vagas de tech lead.",
    },
    {
      id: "m4",
      role: "assistant",
      content: "Claro! Vou te ajudar a destacar as habilidades certas. Você pode compartilhar seu currículo atual ou me contar sobre suas experiências mais relevantes?",
    },
  ],
  "3": [
    {
      id: "m5",
      role: "user",
      content: "Tenho uma entrevista amanhã na AWS, me ajude a me preparar.",
    },
    {
      id: "m6",
      role: "assistant",
      content: "Excelente! A AWS valoriza muito os Leadership Principles. Vamos revisar os principais e preparar respostas no formato STAR. Qual é a posição?",
    },
  ],
};

const MOCK_RESPONSE =
  "Essa é uma resposta simulada.\nNa próxima etapa ela será gerada pela IA.";

let nextId = 100;

function newId(): string {
  return `m${nextId++}`;
}

// ── Page component ─────────────────────────────────────────

export default function ChatPage() {
  const [sessions, setSessions] = useState<ChatSession[]>(MOCK_SESSIONS);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessageData[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSelectSession = useCallback((id: string) => {
    setSelectedId(id);
    setMessages(MOCK_MESSAGES[id] ?? []);
  }, []);

  const handleNewSession = useCallback(() => {
    const id = `s${nextId}`;
    const session: ChatSession = { id, title: "Nova conversa" };
    setSessions((prev) => [session, ...prev]);
    setSelectedId(id);
    setMessages([]);
    setInput("");
  }, []);

  const handleSend = useCallback(() => {
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    const userMsg: ChatMessageData = {
      id: newId(),
      role: "user",
      content: trimmed,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    // Update session title if it's the first message
    if (selectedId && messages.length === 0) {
      setSessions((prev) =>
        prev.map((s) =>
          s.id === selectedId ? { ...s, title: trimmed.slice(0, 40) + (trimmed.length > 40 ? "…" : "") } : s
        )
      );
    }

    setTimeout(() => {
      const assistantMsg: ChatMessageData = {
        id: newId(),
        role: "assistant",
        content: MOCK_RESPONSE,
      };
      setMessages((prev) => [...prev, assistantMsg]);
      setLoading(false);
    }, 1000);
  }, [input, loading, selectedId, messages.length]);

  const selectedSession = sessions.find((s) => s.id === selectedId) ?? null;

  return (
    <div className="flex min-h-[75vh] rounded-xl overflow-hidden border border-gray-200 bg-white shadow-sm">
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

            {loading && <TypingIndicator />}

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
