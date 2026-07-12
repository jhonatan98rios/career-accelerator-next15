"use client";

export interface ChatMessageData {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface ChatMessageProps {
  message: ChatMessageData;
}

export default function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-4`}>
      <div
        className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
          isUser
            ? "bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-br-md"
            : "bg-white border border-gray-200 text-gray-800 rounded-bl-md shadow-sm"
        }`}
      >
        {message.content}
      </div>
    </div>
  );
}
