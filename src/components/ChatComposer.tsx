"use client";

const MAX_CHARS = 500;

interface ChatComposerProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  disabled: boolean;
}

export default function ChatComposer({ value, onChange, onSend, disabled }: ChatComposerProps) {
  const canSend = value.trim().length > 0 && !disabled;

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (canSend) onSend();
    }
  };

  return (
    <div className="border-t border-gray-200 bg-white px-4 py-3">
      <div className="flex items-end gap-3 max-w-3xl mx-auto">
        <textarea
          value={value}
          onChange={(e) => {
            if (e.target.value.length <= MAX_CHARS) {
              onChange(e.target.value);
            }
          }}
          onKeyDown={handleKeyDown}
          placeholder="Digite sua mensagem..."
          rows={2}
          disabled={disabled}
          className="flex-1 resize-none rounded-xl border border-gray-300 px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent disabled:opacity-50"
        />
        <button
          onClick={onSend}
          disabled={!canSend}
          className="shrink-0 w-10 h-10 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-bold flex items-center justify-center disabled:opacity-40 transition-opacity"
          aria-label="Enviar mensagem"
        >
          →
        </button>
      </div>
      <div className="max-w-3xl mx-auto mt-1.5 text-right">
        <span className={`text-xs ${value.length >= MAX_CHARS ? "text-red-500 font-semibold" : "text-gray-400"}`}>
          {value.length} / {MAX_CHARS}
        </span>
      </div>
    </div>
  );
}
