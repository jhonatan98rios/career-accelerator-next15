"use client";

export interface ChatSession {
  id: string;
  title: string;
}

interface ChatSidebarProps {
  sessions: ChatSession[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  open: boolean;
  onClose: () => void;
  canCreate?: boolean;
  sessionsRemaining?: number | null;
}

export default function ChatSidebar({
  sessions,
  selectedId,
  onSelect,
  onNew,
  open,
  onClose,
  canCreate = true,
  sessionsRemaining = null,
}: ChatSidebarProps) {
  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/30 z-40 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar / Drawer */}
      <aside
        className={`fixed z-50 inset-y-0 left-0 w-72 bg-gradient-to-b from-purple-500 to-indigo-500 text-white flex flex-col transition-transform duration-300 md:relative md:translate-x-0 md:z-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="p-4 pt-14 md:pt-4">
          {canCreate ? (
            <button
              onClick={onNew}
              className="w-full py-2.5 rounded-xl border border-white/40 text-white text-sm font-semibold hover:bg-white/10 transition"
            >
              + Nova conversa
            </button>
          ) : (
            <p className="text-white/70 text-xs text-center">
              Limite diário atingido
            </p>
          )}
          {sessionsRemaining != null && sessionsRemaining > 0 && (
            <p className="text-white/60 text-xs text-center mt-1">
              {sessionsRemaining} restante{sessionsRemaining !== 1 ? "s" : ""}
            </p>
          )}
        </div>

        {/* Session list */}
        <nav className="flex-1 overflow-y-auto px-3 pb-4">
          {sessions.map((s) => (
            <button
              key={s.id}
              onClick={() => {
                onSelect(s.id);
                onClose();
              }}
              className={`w-full text-left px-3 py-2.5 rounded-lg text-sm mb-1 transition truncate ${
                s.id === selectedId
                  ? "bg-white/20 font-semibold"
                  : "hover:bg-white/10"
              }`}
            >
              {s.title}
            </button>
          ))}

          {sessions.length === 0 && (
            <p className="text-white/60 text-sm text-center mt-8">
              Nenhuma conversa ainda
            </p>
          )}
        </nav>
      </aside>
    </>
  );
}
