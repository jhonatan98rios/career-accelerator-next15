"use client";

import Link from "next/link";
import { InsightGuardrailState } from "@/lib/ai-generation-guardrails";

interface SideBarProps {
  id: string;
  insightGuardrail: InsightGuardrailState;
  hasInsight: boolean;
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

export default function SideBar({ id, insightGuardrail, hasInsight }: SideBarProps) {
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
    <aside
      className={`fixed z-40 left-0 h-38 md:h-full w-full overflow-scroll md:overflow-hidden md:w-64 
      bg-gradient-to-b from-purple-500 to-indigo-500 text-white flex md:flex-col justify-between`}
    >
      {/* Top menu */}
      <div>
        <nav className="mt-24 flex md:flex-col whitespace-nowrap space-y-4 px-4">
          <MenuItem
            href={`/profile/${id}`}
            label="Início"
            disabled={!hasInsight}
          />
          <Link href={`/profile/${id}/input`} className="hover:bg-purple-600 p-2 rounded-lg font-semibold">
            Novo Plano de Carreira
          </Link>
          <Link href={`/profile/${id}/resume`} className="hover:bg-purple-600 p-2 rounded-lg font-semibold">
            Gerar Currículo
          </Link>
          <MenuItem
            href={`/profile/${id}/vagas`}
            label="Encontrar Vagas"
            disabled={!hasInsight}
          />
          <MenuItem
            href={`/profile/${id}/roadmaps`}
            label="Acompanhe seu Progresso"
            disabled={!hasInsight}
          />
          <MenuItem
            href={`/profile/${id}/config`}
            label="Configurações"
            disabled={!hasInsight}
          />
          <Link href={`/profile/${id}/chat`} className="hover:bg-purple-600 p-2 rounded-lg font-semibold">
            Coach de Carreira
          </Link>
        </nav>
      </div>

      <div className="p-4 bg-purple-600/40 m-4 rounded-lg shadow-inner min-h-10 mt-auto flex md:flex-col items-center md:items-start gap-1">
        <p className="text-sm opacity-80 whitespace-nowrap mr-2 md:mr-0">{statusTitle}</p>
        <p className="text-sm font-semibold leading-snug">{statusBody}</p>
      </div>

      {!hasInsight && (
        <div className="p-3 bg-amber-100/90 m-4 rounded-lg text-sm text-center font-medium text-purple-800 border border-amber-200">
          👀 Suas vagas personalizadas estão a 1 insight de distância.
        </div>
      )}
    </aside>
  );
}

function MenuItem({
  href,
  label,
  disabled,
}: {
  href: string;
  label: string;
  disabled: boolean;
}) {
  if (disabled) {
    return (
      <span className="p-2 rounded-lg opacity-40 cursor-not-allowed select-none" title="Disponível após seu primeiro insight">
        {label}
      </span>
    );
  }

  return (
    <Link href={href} className="hover:bg-purple-600 p-2 rounded-lg">
      {label}
    </Link>
  );
}
