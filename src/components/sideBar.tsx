"use client";

import { useState } from "react";
import Link from "next/link";
import { InsightGuardrailState } from "@/lib/ai-generation-guardrails";
import { trackNavClick } from "@/lib/analytics";

interface SideBarProps {
  id: string;
  insightGuardrail: InsightGuardrailState;
  hasInsight: boolean;
  chatEnabled: boolean;
}

function formatDateTime(value: string | null) {
  if (!value) return null;

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function SideBarContent({
  id,
  insightGuardrail,
  hasInsight,
  chatEnabled,
  onLinkClick,
}: SideBarProps & { onLinkClick?: () => void }) {
  const unlockAt = formatDateTime(insightGuardrail.unlockAt);
  const statusTitle = insightGuardrail.bypassed
    ? "Modo livre"
    : insightGuardrail.canGenerate
      ? "Novo insight disponivel"
      : "Proximo insight";

  const statusBody = insightGuardrail.bypassed
    ? "Sua conta ignora os limites de geracao."
    : insightGuardrail.canGenerate
      ? "Voce pode gerar um novo plano agora."
      : unlockAt
        ? `Liberado em ${unlockAt}.`
        : "Aguarde o fim do intervalo para gerar outro plano.";

  return (
    <>
      <nav className="flex flex-col space-y-4 px-4">
        <MenuItem
          href={`/profile/${id}`}
          label="Início"
          disabled={!hasInsight}
          onClick={onLinkClick}
        />
        {/* ponytail: progress kept next to insights (Início) per menu review */}
        <MenuItem
          href={`/profile/${id}/roadmaps`}
          label="Acompanhe seu Progresso"
          disabled={!hasInsight}
          onClick={onLinkClick}
        />
        <Link
          href={`/profile/${id}/input`}
          onClick={() => {
            trackNavClick({
              category: "sidebar",
              action: "click",
              label: "Novo Plano de Carreira",
            });
            onLinkClick?.();
          }}
          className="hover:bg-purple-600 p-2 rounded-lg font-semibold"
        >
          Novo Plano de Carreira
        </Link>
        <Link
          href={`/profile/${id}/resume`}
          onClick={() => {
            trackNavClick({ category: "sidebar", action: "click", label: "Gerar Currículo" });
            onLinkClick?.();
          }}
          className="hover:bg-purple-600 p-2 rounded-lg font-semibold"
        >
          Gerar Currículo
        </Link>
        <MenuItem
          href={`/profile/${id}/vagas`}
          label="Encontrar Vagas"
          disabled={!hasInsight}
          onClick={onLinkClick}
        />
        {chatEnabled ? (
          <Link
            href={`/profile/${id}/chat`}
            onClick={() => {
              trackNavClick({ category: "sidebar", action: "click", label: "Conversar com IA" });
              onLinkClick?.();
            }}
            className="hover:bg-purple-600 p-2 rounded-lg font-semibold"
          >
            Conversar com IA
          </Link>
        ) : (
          <Link
            href={`/profile/${id}/config`}
            onClick={() => {
              trackNavClick({
                category: "sidebar",
                action: "click",
                label: "Conversar com IA (bloqueado)",
              });
              onLinkClick?.();
            }}
            title="Disponível a partir do plano Intermediário"
            className="hover:bg-purple-600 p-2 rounded-lg font-semibold flex items-center gap-2"
          >
            Conversar com IA
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M12 2a6 6 0 0 0-6 6v4H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2h-1V8a6 6 0 0 0-6-6zm4 10H8V8a4 4 0 1 1 8 0v4z" />
            </svg>
          </Link>
        )}
        <MenuItem
          href={`/profile/${id}/config`}
          label="Configurações"
          disabled={!hasInsight}
          onClick={onLinkClick}
        />
      </nav>

      <div className="p-4 bg-purple-600/40 m-4 rounded-lg shadow-inner mt-auto flex flex-col items-start gap-1">
        <p className="text-sm opacity-80">{statusTitle}</p>
        <p className="text-sm font-semibold leading-snug">{statusBody}</p>
      </div>

      {!hasInsight && (
        <div className="p-3 bg-amber-100/90 m-4 rounded-lg text-sm text-center font-medium text-purple-800 border border-amber-200">
          👀 Suas vagas personalizadas estão a 1 insight de distância.
        </div>
      )}
    </>
  );
}

export default function SideBar(props: SideBarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Mobile: hamburger button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="md:hidden fixed z-50 top-4 left-4 p-2 rounded-lg bg-purple-600 text-white shadow-lg"
        aria-label="Abrir menu"
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M3 6h18M3 12h18M3 18h18" />
        </svg>
      </button>

      {/* Mobile: overlay */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/30 z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile: drawer */}
      <aside
        className={`md:hidden fixed z-50 inset-y-0 left-0 w-64 bg-gradient-to-b from-purple-500 to-indigo-500 text-white flex flex-col pt-16 pb-4 transition-transform duration-300 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <SideBarContent {...props} onLinkClick={() => setMobileOpen(false)} />
      </aside>

      {/* Desktop: fixed sidebar */}
      <aside className="hidden md:flex fixed z-40 left-0 h-full w-64 bg-gradient-to-b from-purple-500 to-indigo-500 text-white flex-col pt-24 pb-4">
        <SideBarContent {...props} />
      </aside>
    </>
  );
}

function MenuItem({
  href,
  label,
  disabled,
  onClick,
}: {
  href: string;
  label: string;
  disabled: boolean;
  onClick?: () => void;
}) {
  if (disabled) {
    return (
      <span
        className="p-2 rounded-lg opacity-40 cursor-not-allowed select-none"
        title="Disponível após seu primeiro insight"
      >
        {label}
      </span>
    );
  }

  return (
    <Link
      href={href}
      onClick={() => {
        trackNavClick({ category: "sidebar", action: "click", label });
        onClick?.();
      }}
      className="hover:bg-purple-600 p-2 rounded-lg"
    >
      {label}
    </Link>
  );
}
