"use client";

import { useState, useEffect, useTransition } from "react";
import type { Resume } from "@/resume";
import ResumePreview from "./ResumePreview";

const MAX_CHARS = 10_000;

interface UsageInfo {
  resumeGenerations: number;
  resumeGenerationsLimit: number;
}

async function downloadDocx(resume: Resume, jwtToken: string) {
  const res = await fetch("/api/resume/docx", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${jwtToken}`,
    },
    body: JSON.stringify({ resume }),
  });

  if (!res.ok) throw new Error("Falha ao gerar DOCX");

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "curriculo.docx";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

interface Props {
  jwtToken: string;
}

export default function ResumeGenerator({ jwtToken }: Props) {
  const [input, setInput] = useState("");
  const [result, setResult] = useState<Resume | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [downloading, setDownloading] = useState(false);
  const [international, setInternational] = useState(false);
  const [usage, setUsage] = useState<UsageInfo | null>(null);

  useEffect(() => {
    fetch("/api/chat/usage", { headers: { Authorization: `Bearer ${jwtToken}` } })
      .then((r) => r.json())
      .then((d) => {
        if (d.resumeGenerations != null) {
          setUsage({ resumeGenerations: d.resumeGenerations, resumeGenerationsLimit: d.resumeGenerationsLimit });
        }
      })
      .catch(() => {});
  }, [jwtToken]);

  const handleGenerate = () => {
    if (!input.trim()) return;

    setError(null);
    setResult(null);

    startTransition(async () => {
      try {
        const res = await fetch("/api/resume", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${jwtToken}`,
          },
          body: JSON.stringify({ input, language: international ? "en" : "pt" }),
        });

        const payload = await res.json();

        if (!res.ok) {
          if (res.status === 401) {
            window.location.href = "/auth/logout";
            return;
          }
          setError(payload.error || "Erro ao gerar currículo.");
          return;
        }

        setResult(payload.data);
        // Refresh usage counter after successful generation
        setUsage((prev) =>
          prev ? { ...prev, resumeGenerations: prev.resumeGenerations + 1 } : null
        );
      } catch {
        setError("Erro de rede. Tente novamente.");
      }
    });
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Gerar Currículo</h1>
        <p className="text-gray-500 mt-2">
          Descreva sua experiência profissional em texto livre e a IA irá estruturar seu currículo.
        </p>
      </div>

      {usage && (
        <div className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 shadow-sm flex items-center justify-between">
          <span>
            {usage.resumeGenerations >= usage.resumeGenerationsLimit
              ? "Limite diário de currículos atingido."
              : `Você gerou ${usage.resumeGenerations} de ${usage.resumeGenerationsLimit} currículos hoje.`}
          </span>
          <div className="flex-1 max-w-[120px] mx-4 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, (usage.resumeGenerations / usage.resumeGenerationsLimit) * 100)}%` }}
            />
          </div>
        </div>
      )}

      <div className="space-y-4">
        <textarea
          className="w-full h-48 px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition resize-y"
          placeholder="Ex.: Sou desenvolvedor full-stack com 5 anos de experiência em React e Node.js. Trabalhei na TechCorp como sênior liderando um time de 4 devs..."
          value={input}
          onChange={(e) => {
            if (e.target.value.length <= MAX_CHARS) {
              setInput(e.target.value);
            }
          }}
          maxLength={MAX_CHARS}
        />

        <div className="text-right">
          <span className={`text-xs ${input.length >= MAX_CHARS ? "text-red-500 font-semibold" : "text-gray-400"}`}>
            {input.length.toLocaleString("pt-BR")} / {MAX_CHARS.toLocaleString("pt-BR")}
          </span>
        </div>

        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={international}
            onChange={(e) => setInternational(e.target.checked)}
            className="w-4 h-4 accent-purple-500"
          />
          <span className="text-gray-700 text-sm">Vaga internacional? (currículo em inglês)</span>
        </label>

        <div className="text-right">
          <button
            type="button"
            disabled={isPending || !input.trim() || (usage != null && usage.resumeGenerations >= usage.resumeGenerationsLimit)}
            onClick={handleGenerate}
            className={`px-6 py-3 rounded-xl font-bold text-white transition ${
              isPending || !input.trim() || (usage != null && usage.resumeGenerations >= usage.resumeGenerationsLimit)
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-gradient-to-r from-purple-500 to-indigo-500 hover:scale-105"
            }`}
          >
            {usage != null && usage.resumeGenerations >= usage.resumeGenerationsLimit
              ? "Limite diário atingido"
              : isPending
                ? "Gerando..."
                : "Gerar Currículo"}
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {result && (
        <>
          <ResumePreview resume={result} />
          <div className="flex justify-center">
            <button
              type="button"
              disabled={downloading}
              onClick={async () => {
                setDownloading(true);
                try {
                  await downloadDocx(result, jwtToken);
                } catch {
                  setError("Erro ao baixar DOCX.");
                } finally {
                  setDownloading(false);
                }
              }}
              className="px-6 py-3 rounded-xl font-bold text-white bg-green-600 hover:bg-green-700 transition disabled:opacity-50"
            >
              {downloading ? "Baixando..." : "Baixar DOCX"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
