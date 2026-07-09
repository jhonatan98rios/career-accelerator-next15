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
  compact?: boolean;
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

// ponytail: shared field wrappers to stay under max-lines-per-function
const FieldInput = ({
  label,
  name,
  value,
  placeholder,
  hint,
  onChange,
}: {
  label: string;
  name: string;
  value: string;
  placeholder?: string;
  hint?: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
}) => (
  <div>
    <label className="block font-medium mb-2 text-gray-700">{label}</label>
    <input
      name={name}
      type="text"
      className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
      placeholder={placeholder}
      value={value}
      onChange={onChange}
    />
    {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
  </div>
);

const FieldTextarea = ({
  label,
  name,
  value,
  placeholder,
  onChange,
}: {
  label: string;
  name: string;
  value: string;
  placeholder?: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
}) => (
  <div>
    <label className="block font-medium mb-2 text-gray-700">{label}</label>
    <textarea
      name={name}
      rows={3}
      className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
      placeholder={placeholder}
      value={value}
      onChange={onChange}
    />
  </div>
);

export default function InsightForm({ jwtToken, insightGuardrail, compact = false }: Props) {
  const params = useParams();
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showExtras, setShowExtras] = useState(false);

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

  // ponytail: count filled fields for progress bar
  const essentialFields = compact
    ? ["dreamJob", "experience", "hardSkills"]
    : ["dreamJob", "experience", "hardSkills", "currentRole", "education", "softSkills", "blockers", "1-year-goals"];
  const filledEssential = essentialFields.filter(
    (k) => answers[k as keyof typeof answers]?.trim()
  ).length;
  const totalSteps = compact ? (showExtras ? 8 : 3) : 8;
  const filledExtras = compact && showExtras
    ? ["currentRole", "education", "softSkills", "blockers", "1-year-goals"].filter(
        (k) => answers[k as keyof typeof answers]?.trim()
      ).length
    : 0;
  const progressPct = Math.round(((filledEssential + filledExtras) / totalSteps) * 100);

  return (
    <form className="max-w-3xl mx-auto px-6 py-12 space-y-12" onSubmit={handleSubmit}>
      {!compact && (
        <h1 className="text-3xl sm:text-4xl font-bold text-center text-gray-900 mb-20 block">
          Comece falando um pouco sobre você
        </h1>
      )}

      {/* Progress bar */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <span className="text-sm text-gray-400 font-medium tabular-nums min-w-[3ch] text-right">
          {progressPct}%
        </span>
      </div>

      {/* Perguntas guiadas */}
      <section className="space-y-8">
        {/* 1. Cargo desejado */}
        <FieldInput
          label={compact ? "Qual cargo você busca?" : "Qual emprego você gostaria de ter?"}
          name="dreamJob"
          value={answers.dreamJob}
          placeholder={compact ? "ex.: Desenvolvedor Frontend, Product Manager" : "ex.: Especialista em inteligência artificial."}
          onChange={handleChange}
        />

        {/* 2. Experiência */}
        <div>
          <label className="block font-medium mb-2 text-gray-700">
            {compact
              ? "Qual seu nível de experiência?"
              : "Quanto tempo de experiência você tem?"}
          </label>
          {compact ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { label: "Júnior (0-2 anos)", value: "2 anos" },
                { label: "Pleno (3-5 anos)", value: "4 anos" },
                { label: "Sênior (6+ anos)", value: "8 anos" },
              ].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setAnswers({ ...answers, experience: opt.value })}
                  className={`px-3 py-3 text-sm rounded-xl border-2 transition font-medium ${
                    answers.experience === opt.value
                      ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                      : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          ) : (
            <input
              name="experience"
              type="text"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
              value={answers.experience}
              onChange={handleChange}
            />
          )}
        </div>

        {/* 3. Hard skills */}
        <FieldInput
          label="Quais são suas principais habilidades técnicas?"
          name="hardSkills"
          value={answers.hardSkills}
          placeholder="ex.: JavaScript, SQL, Excel, Python"
          hint="Separe por vírgulas — quanto mais específico, melhores serão suas vagas."
          onChange={handleChange}
        />

        {/* Expandable extras (compact mode only) */}
        {compact && (
          <>
            {!showExtras ? (
              <button
                type="button"
                onClick={() => setShowExtras(true)}
                className="w-full py-3 text-sm font-medium text-purple-600 hover:text-purple-700 border-2 border-dashed border-purple-200 hover:border-purple-300 rounded-xl transition"
              >
                ✨ Quero um plano ainda mais personalizado (5 perguntas extras)
              </button>
            ) : (
              <div className="space-y-8 pt-4 border-t border-gray-100">
                <p className="text-sm text-gray-400">
                  Essas perguntas ajudam a deixar seu plano mais preciso para o seu momento.
                </p>

                <FieldInput label="Qual é o seu cargo atual?" name="currentRole" value={answers.currentRole} onChange={handleChange} />
                <FieldInput label="Você tem formação superior? Se sim, qual?" name="education" value={answers.education} onChange={handleChange} />
                <FieldInput label="Quais são suas principais soft skills?" name="softSkills" value={answers.softSkills} placeholder="ex.: Comunicação, liderança, adaptabilidade." onChange={handleChange} />
                <FieldTextarea label="O que está bloqueando seu crescimento hoje?" name="blockers" value={answers.blockers} placeholder="ex.: Dificuldade em encontrar vagas remotas na minha área." onChange={handleChange} />
                <FieldTextarea label="O que você espera alcançar nos próximos 12 meses?" name="1-year-goals" value={answers["1-year-goals"]} placeholder="ex.: Conseguir um aumento ou mudar de área." onChange={handleChange} />
              </div>
            )}
          </>
        )}

        {/* Full form (non-compact) — remaining fields */}
        {!compact && (
          <>
            <FieldInput label="Qual é o seu cargo atual?" name="currentRole" value={answers.currentRole} onChange={handleChange} />
            <FieldInput label="Você tem formação superior? Se sim, qual?" name="education" value={answers.education} onChange={handleChange} />
            <FieldInput label="Quais são suas principais soft skills?" name="softSkills" value={answers.softSkills} placeholder="ex.: Comunicação, liderança, adaptabilidade." onChange={handleChange} />
            <FieldTextarea label="Na sua percepção, quais são os maiores desafios que bloqueiam seu crescimento?" name="blockers" value={answers.blockers} placeholder="ex.: Tenho dificuldade em encontrar vagas remotas na minha área." onChange={handleChange} />
            <FieldTextarea label="O que você espera alcançar nos próximos 12 meses?" name="1-year-goals" value={answers["1-year-goals"]} placeholder="ex.: Começar uma faculdade." onChange={handleChange} />
            <FieldTextarea label="O que você espera alcançar nos próximos 5 anos?" name="5-years-goals" value={answers["5-years-goals"]} placeholder="ex.: Aprender uma segunda lingua e conseguir um emprego remoto para o exterior." onChange={handleChange} />
            <FieldTextarea label="O que você espera alcançar nos próximos 10 anos?" name="10-years-goals" value={answers["10-years-goals"]} placeholder="ex.: Me tornar um especialista com carreira internacional." onChange={handleChange} />
          </>
        )}
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
        <Button
          isPending={isPending}
          disabled={!insightGuardrail.canGenerate}
          compact={compact}
        />
      </div>
    </form>
  );
}

const Button = ({
  isPending,
  disabled,
  compact,
}: {
  isPending: boolean;
  disabled: boolean;
  compact?: boolean;
}) => {
  if (isPending) {
    return (
      <button
        disabled
        className="px-6 py-3 bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-medium rounded-xl shadow-md hover:opacity-90 transition cursor-not-allowed opacity-50"
      >
        Gerando seu plano...
      </button>
    );
  }

  return (
    <button
      type="submit"
      disabled={disabled}
      className={`px-8 py-4 text-white font-bold rounded-xl shadow-lg transition text-lg ${
        disabled
          ? "bg-gray-400 cursor-not-allowed opacity-70"
          : "bg-gradient-to-r from-purple-500 to-indigo-500 hover:scale-105 cursor-pointer"
      }`}
    >
      {compact ? "Gerar meu plano gratuito →" : "Gerar meu roadmap"}
    </button>
  );
};
