"use client";

import React, { useEffect, useState, useTransition } from "react";
import { useFormContext } from "@/store/FormContext";
import { useParams, useRouter } from "next/navigation";
import { InsightGuardrailState } from "@/lib/ai-generation-guardrails";

interface PageProps {
  output_id: string;
  profile_id: string;
}

interface Props {
  jwtToken: string;
  insightGuardrail: InsightGuardrailState;
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

export default function InsightForm({ jwtToken, insightGuardrail }: Props) {
  const params = useParams();
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { profile_id } = params as unknown as PageProps;
  const [isPending, startTransition] = useTransition();

  const { manualDescription, answers, setManualDescription, setAnswers, resetForm } =
    useFormContext();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setAnswers({ ...answers, [name]: value });
  };

  const submit = async () => {
    try {
      setErrorMessage(null);

      const res = await fetch("/api/insight", {
        method: "POST",
        body: JSON.stringify({ answers, manualDescription, profile_id }),
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${jwtToken}`,
        },
      });

      const payload = await res.json();

      if (!res.ok) {
        const unlockAt = formatDateTime(payload.unlockAt ?? null);
        setErrorMessage(
          unlockAt
            ? `Seu proximo insight sera liberado em ${unlockAt}.`
            : payload.error || "Nao foi possivel gerar o insight agora."
        );
        return;
      }

      const { data } = payload;

      if (!data._id) {
        throw new Error("No data returned from API");
      }

      router.push(`/profile/${profile_id}/output/${data._id}`);
    } catch (err) {
      console.error("Error while generating the insight:", err);
      setErrorMessage("Nao foi possivel gerar o insight agora. Tente novamente em instantes.");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isPending || !insightGuardrail.canGenerate) return;

    startTransition(async () => {
      await submit();
    });
  };

  useEffect(() => {
    resetForm();
  }, []);

  const helperMessage = insightGuardrail.bypassed
    ? "Sua conta ignora os limites de geracao."
    : insightGuardrail.canGenerate
      ? "Seu proximo plano pode ser gerado agora."
      : `Seu proximo insight sera liberado em ${formatDateTime(insightGuardrail.unlockAt)}.`;

  return (
    <form className="max-w-3xl mx-auto px-6 py-12 space-y-12" onSubmit={handleSubmit}>
      <h1 className="text-3xl sm:text-4xl font-bold text-center text-gray-900 mb-20 block">
        Comece falando um pouco sobre você
      </h1>

      {/* Perguntas guiadas */}
      <section className="space-y-8">
        <div>
          <label className="block font-medium mb-2 text-gray-700">Qual é o seu cargo atual?</label>
          <input
            name="currentRole"
            type="text"
            className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
            value={answers.currentRole}
            onChange={handleChange}
          />
        </div>

        <div>
          <label className="block font-medium mb-2 text-gray-700">
            Quanto tempo de experiência você tem?
          </label>
          <input
            name="experience"
            type="text"
            className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
            value={answers.experience}
            onChange={handleChange}
          />
        </div>

        <div>
          <label className="block font-medium mb-2 text-gray-700">
            Você tem formação superior? Se sim, qual?
          </label>
          <input
            name="education"
            type="text"
            className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
            value={answers.education}
            onChange={handleChange}
          />
        </div>

        <div>
          <label className="block font-medium mb-2 text-gray-700">
            Qual emprego você gostaria de ter?
          </label>
          <input
            name="dreamJob"
            type="text"
            className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
            placeholder="ex.: Especialista em inteligência artificial."
            value={answers.dreamJob}
            onChange={handleChange}
          />
        </div>

        <div>
          <label className="block font-medium mb-2 text-gray-700">
            Quais são suas principais soft skills?
          </label>
          <input
            name="softSkills"
            type="text"
            className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
            placeholder="ex.: Comunicação, liderança, adaptabilidade."
            value={answers.softSkills}
            onChange={handleChange}
          />
        </div>

        <div>
          <label className="block font-medium mb-2 text-gray-700">
            Quais são suas principais hard skills?
          </label>
          <input
            name="hardSkills"
            type="text"
            className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
            placeholder="ex.: JavaScript, SQL, computação em nuvem."
            value={answers.hardSkills}
            onChange={handleChange}
          />
        </div>

        <div>
          <label className="block font-medium mb-2 text-gray-700">
            Na sua percepção, quais são os maiores desafios que bloqueiam seu crescimento?
          </label>
          <textarea
            name="blockers"
            rows={3}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
            placeholder="ex.: Tenho dificuldade em encontrar vagas remotas na minha área."
            value={answers.blockers}
            onChange={handleChange}
          />
        </div>

        <div>
          <label className="block font-medium mb-2 text-gray-700">
            O que você espera alcançar nos próximos 12 meses?
          </label>
          <textarea
            name="1-year-goals"
            rows={3}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
            placeholder="ex.: Começar uma faculdade."
            value={answers["1-year-goals"]}
            onChange={handleChange}
          />
        </div>

        <div>
          <label className="block font-medium mb-2 text-gray-700">
            O que você espera alcançar nos próximos 5 anos?
          </label>
          <textarea
            name="5-years-goals"
            rows={3}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
            placeholder="ex.: Aprender uma segunda lingua e conseguir um emprego remoto para o exterior."
            value={answers["5-years-goals"]}
            onChange={handleChange}
          />
        </div>

        <div>
          <label className="block font-medium mb-2 text-gray-700">
            O que você espera alcançar nos próximos 10 anos?
          </label>
          <textarea
            name="10-years-goals"
            rows={3}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
            placeholder="ex.: Me tornar um especialista com carreira internacional."
            value={answers["10-years-goals"]}
            onChange={handleChange}
          />
        </div>
      </section>

      {/* Observação */}
      <section className="space-y-4">
        <label className="block font-medium text-gray-700">
          Deseja adicionar alguma informação extra? (Opcional)
        </label>
        <textarea
          rows={6}
          className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
          placeholder="Adicione algo que considera importante como seu histórico profissional, projetos pessoais e interesses."
          value={manualDescription}
          onChange={(e) => setManualDescription(e.target.value)}
        />
      </section>

      <div className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 shadow-sm">
        {helperMessage}
      </div>

      {errorMessage && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMessage}
        </div>
      )}

      {/* Botão de envio */}
      <div className="text-center">
        <Button isPending={isPending} disabled={!insightGuardrail.canGenerate} />
      </div>
    </form>
  );
}

const Button = ({ isPending, disabled }: { isPending: boolean; disabled: boolean }) => {
  if (isPending) {
    return (
      <button
        disabled
        className="px-6 py-3 bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-medium rounded-xl shadow-md hover:opacity-90 transition cursor-not-allowed opacity-50"
      >
        Gerando...
      </button>
    );
  }

  return (
    <button
      type="submit"
      disabled={disabled}
      className={`px-6 py-3 text-white font-medium rounded-xl shadow-md transition ${
        disabled
          ? "bg-gray-400 cursor-not-allowed opacity-70"
          : "bg-gradient-to-r from-purple-500 to-indigo-500 hover:opacity-90 cursor-pointer"
      }`}
    >
      Gerar meu roadmap
    </button>
  );
};
