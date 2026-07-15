"use client";

import { useState, useTransition } from "react";

const MAX_CHARS = 10_000;

async function downloadDocx(resume: Record<string, unknown>, jwtToken: string) {
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
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [downloading, setDownloading] = useState(false);
  const [international, setInternational] = useState(false);

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
            disabled={isPending || !input.trim()}
            onClick={handleGenerate}
            className={`px-6 py-3 rounded-xl font-bold text-white transition ${
              isPending || !input.trim()
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-gradient-to-r from-purple-500 to-indigo-500 hover:scale-105"
            }`}
          >
            {isPending ? "Gerando..." : "Gerar Currículo"}
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {result && (
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">Currículo Gerado</h2>
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
              className="px-4 py-2 rounded-lg font-semibold text-white bg-green-600 hover:bg-green-700 transition disabled:opacity-50"
            >
              {downloading ? "Baixando..." : "Baixar DOCX"}
            </button>
          </div>
          <pre className="text-sm text-gray-700 whitespace-pre-wrap font-mono bg-gray-50 p-4 rounded-lg overflow-auto max-h-96">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
