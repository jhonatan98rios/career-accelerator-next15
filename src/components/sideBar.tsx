"use client";

import Link from "next/link";
import { InsightGuardrailState } from "@/lib/ai-generation-guardrails";

interface SideBarProps {
  id: string
  insightGuardrail: InsightGuardrailState
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

export default function SideBar({ id, insightGuardrail }: SideBarProps) {
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
    <aside className={
      `fixed z-40 left-0 h-38 md:h-full w-full overflow-scroll md:overflow-hidden md:w-64 
      bg-gradient-to-b from-purple-500 to-indigo-500 text-white flex md:flex-col justify-between`
    }>
      {/* Top menu */}
      <div>
        <nav className="mt-24 flex md:flex-col whitespace-nowrap space-y-4 px-4">
          <Link href={`/profile/${id}`} className="hover:bg-purple-600 p-2 rounded-lg">
            Início
          </Link>
          <Link
            href={`/profile/${id}/input`}
            className="hover:bg-purple-600 p-2 rounded-lg"
          >
            Novo Plano de Carreira
          </Link>
          <Link
            href={`/profile/${id}/roadmaps`}
            className="hover:bg-purple-600 p-2 rounded-lg"
          >
            Acompanhe seu Progresso
          </Link>
          <Link
            href={`/profile/${id}/config`}
            className="hover:bg-purple-600 p-2 rounded-lg"
          >
            Configurações
          </Link>
        </nav>
      </div>

      <div className="p-4 bg-purple-600/40 m-4 rounded-lg shadow-inner min-h-10 mt-auto flex md:flex-col items-center md:items-start gap-1">
        <p className="text-sm opacity-80 whitespace-nowrap mr-2 md:mr-0">{statusTitle}</p>
        <p className="text-sm font-semibold leading-snug">{statusBody}</p>
      </div>
    </aside>
  )
}
