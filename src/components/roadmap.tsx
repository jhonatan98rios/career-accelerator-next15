"use client";

import { toggleStepStatus } from "@/app/actions/career_roadmap";
import { RoadmapGuardrailState } from "@/lib/ai-generation-guardrails";
import { useState, useTransition } from "react";

export function RoadmapStepCheckbox({
  roadmapId,
  stepId,
  done,
}: {
  roadmapId: string;
  stepId: string;
  done: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  const handleChange = (checked: boolean) => {
    startTransition(async () => {
      await toggleStepStatus(roadmapId, stepId, checked);
    });
  };

  return (
    <input
      id={stepId}
      type="checkbox"
      defaultChecked={done}
      onChange={(e) => handleChange(e.target.checked)}
      disabled={isPending}
      className="min-h-4 min-w-4 accent-blue-600 rounded mt-auto mb-auto mr-2 cursor-pointer "
    />
  );
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

export function RoadmapUpdateButton({
  roadmapId,
  jwtToken,
  guardrail,
}: {
  roadmapId: string;
  jwtToken: string;
  guardrail: RoadmapGuardrailState;
}) {
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const submit = async () => {
    try {
      setErrorMessage(null);

      const res = await fetch("/api/roadmap", {
        method: "POST",
        body: JSON.stringify({ roadmapId }),
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${jwtToken}`,
        },
      });

      const data = await res.json();

      if (!res.ok) {
        const retryWindowEndsAt = formatDateTime(data.retryWindowEndsAt ?? null);
        setErrorMessage(
          retryWindowEndsAt
            ? `Esse ajuste ficou disponivel ate ${retryWindowEndsAt}.`
            : data.error || "Nao foi possivel gerar novos passos agora."
        );
        return;
      }

      if (!data) {
        throw new Error("No data returned from API");
      }

      window.location.reload();
    } catch (err) {
      console.error("Error while generating the roadmap:", err);
      setErrorMessage("Nao foi possivel gerar novos passos agora. Tente novamente em instantes.");
    }
  };

  const handleSubmit = () => {
    if (isPending || !guardrail.canGenerate) return;

    startTransition(async () => {
      await submit();
    });
  };

  const buttonLabel = guardrail.bypassed
    ? "Gerar novos passos"
    : guardrail.reason === "retry"
      ? "Ajustar roadmap"
      : "Solicitar proximos passos";

  const helperMessage = guardrail.bypassed
    ? "Sua conta ignora os limites de geracao."
    : guardrail.reason === "retry"
      ? `Voce pode pedir um ajuste unico ate ${formatDateTime(guardrail.retryWindowEndsAt)}.`
      : guardrail.canGenerate
        ? "Concluir este roadmap libera os proximos passos."
        : guardrail.reason === "retry_used"
          ? "O ajuste unico deste roadmap ja foi usado."
          : "Conclua todas as etapas para liberar novos passos.";

  return (
    <div className="mt-10 flex flex-col items-center gap-3">
      <p className="text-sm text-gray-600 text-center">{helperMessage}</p>

      {errorMessage && (
        <div className="w-full max-w-xl rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 text-center">
          {errorMessage}
        </div>
      )}

      <button
        disabled={isPending || !guardrail.canGenerate}
        onClick={() => handleSubmit()}
        className={`px-8 py-3 rounded-xl text-white font-bold transition-transform shadow-lg ${
          isPending || !guardrail.canGenerate
            ? "bg-gray-400 opacity-70 cursor-not-allowed"
            : "bg-gradient-to-r from-purple-500 to-indigo-500 hover:scale-105"
        }`}
      >
        {isPending ? "Carregando..." : buttonLabel}
      </button>
    </div>
  );
}
