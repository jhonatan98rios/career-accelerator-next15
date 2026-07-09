"use client";

import { useState, useTransition } from "react";

interface Props {
  jwtToken: string;
}

export default function ResumeGenerator({ jwtToken }: Props) {
  const [input, setInput] = useState("");
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

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
          body: JSON.stringify({ input }),
        });

        const payload = await res.json();

        if (!res.ok) {
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
          onChange={(e) => setInput(e.target.value)}
        />

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
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Currículo Gerado</h2>
          <pre className="text-sm text-gray-700 whitespace-pre-wrap font-mono bg-gray-50 p-4 rounded-lg overflow-auto max-h-96">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
