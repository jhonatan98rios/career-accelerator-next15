"use client";

import { useState, useTransition } from "react";
import { saveProfessionalProfile } from "@/app/actions/professional_profile";
import type { IExperienceItem } from "@/models/ProfessionalProfile";

interface ProfileSectionsProps {
  initial: {
    who: string;
    experience: IExperienceItem[];
    goals: string;
  };
}

type Section = "who" | "experience" | "goals";

function emptyItem(): IExperienceItem {
  return { title: "", period: "", description: "" };
}

// ── Shared styles (match app language: dashboard cards, config form) ──

const inputClass =
  "w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition";
const primaryButtonClass =
  "px-6 py-2 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-bold hover:scale-105 transition-transform cursor-pointer";
const secondaryButtonClass =
  "px-6 py-2 rounded-xl border border-gray-300 text-gray-600 hover:bg-gray-100 transition cursor-pointer";

export default function ProfileSections({ initial }: ProfileSectionsProps) {
  const [who, setWho] = useState(initial.who);
  const [goals, setGoals] = useState(initial.goals);
  const [experience, setExperience] = useState<IExperienceItem[]>(initial.experience);
  const [editing, setEditing] = useState<Section | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const setItem = (index: number, field: keyof IExperienceItem, value: string) => {
    setExperience((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  };

  const save = (patch: { who?: string; goals?: string; experience?: IExperienceItem[] }) => {
    startTransition(async () => {
      try {
        await saveProfessionalProfile(patch);
        setEditing(null);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Não foi possível salvar.");
      }
    });
  };

  return (
    <div className="max-w-3xl mx-auto w-full space-y-8">
      <div>
        <h1 className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-indigo-500">
          Perfil Profissional
        </h1>
        <p className="text-gray-600 mt-2">
          Seu perfil alimenta as gerações de plano de carreira, currículo e chat com IA.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {/* Quem sou eu */}
      <SectionCard
        title="Quem sou eu"
        icon="👤"
        subtitle="Resumo da sua trajetória, em texto corrido."
      >
        {editing === "who" ? (
          <>
            <textarea
              value={who}
              onChange={(e) => setWho(e.target.value)}
              rows={6}
              className={inputClass}
            />
            <SaveRow
              saving={isPending}
              onCancel={() => setEditing(null)}
              onSave={() => save({ who })}
            />
          </>
        ) : (
          <>
            <p className="text-gray-700 leading-relaxed whitespace-pre-line">
              {who || <span className="italic text-gray-400">Nada preenchido ainda.</span>}
            </p>
            <EditLink onClick={() => setEditing("who")} />
          </>
        )}
      </SectionCard>

      {/* O que eu fiz */}
      <SectionCard
        title="O que eu fiz"
        icon="💼"
        subtitle="Suas experiências profissionais — cada item com título, período e descrição."
      >
        {editing === "experience" ? (
          <>
            <div className="space-y-4">
              {experience.map((item, i) => (
                <div key={i} className="border border-gray-200 rounded-xl p-4 space-y-3">
                  <div className="flex gap-3">
                    <input
                      value={item.title}
                      onChange={(e) => setItem(i, "title", e.target.value)}
                      placeholder="Título (ex: Desenvolvedor na Acme)"
                      className={`${inputClass} flex-1`}
                    />
                    <input
                      value={item.period}
                      onChange={(e) => setItem(i, "period", e.target.value)}
                      placeholder="Período (ex: 2020-2022)"
                      className={`${inputClass} w-44`}
                    />
                    <button
                      type="button"
                      onClick={() => setExperience((prev) => prev.filter((_, idx) => idx !== i))}
                      className="px-4 rounded-xl border border-red-200 text-red-500 text-sm font-semibold hover:bg-red-50 transition"
                      aria-label="Remover item"
                    >
                      Remover
                    </button>
                  </div>
                  <textarea
                    value={item.description}
                    onChange={(e) => setItem(i, "description", e.target.value)}
                    placeholder="Descrição do que você fez"
                    rows={2}
                    className={inputClass}
                  />
                </div>
              ))}
              <button
                type="button"
                onClick={() => setExperience((prev) => [...prev, emptyItem()])}
                className="w-full py-3 rounded-xl border-2 border-dashed border-purple-300 text-purple-600 text-sm font-semibold hover:bg-purple-50 transition"
              >
                + Adicionar experiência
              </button>
            </div>
            <SaveRow
              saving={isPending}
              onCancel={() => setEditing(null)}
              onSave={() => save({ experience })}
            />
          </>
        ) : experience.length ? (
          <ul className="space-y-4">
            {experience.map((item, i) => (
              <li
                key={i}
                className="border border-purple-500 rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow"
              >
                <p className="text-lg font-semibold text-purple-500">{item.title}</p>
                {item.period && <p className="text-sm text-gray-400 mt-1">{item.period}</p>}
                {item.description && (
                  <p className="text-gray-600 text-sm leading-relaxed mt-2">{item.description}</p>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="italic text-gray-400">Nenhuma experiência cadastrada.</p>
        )}
        {editing !== "experience" && <EditLink onClick={() => setEditing("experience")} />}
      </SectionCard>

      {/* O que eu pretendo fazer */}
      <SectionCard
        title="O que eu pretendo fazer"
        icon="🎯"
        subtitle="Seus objetivos de carreira, em texto corrido."
      >
        {editing === "goals" ? (
          <>
            <textarea
              value={goals}
              onChange={(e) => setGoals(e.target.value)}
              rows={6}
              className={inputClass}
            />
            <SaveRow
              saving={isPending}
              onCancel={() => setEditing(null)}
              onSave={() => save({ goals })}
            />
          </>
        ) : (
          <>
            <p className="text-gray-700 leading-relaxed whitespace-pre-line">
              {goals || <span className="italic text-gray-400">Nada preenchido ainda.</span>}
            </p>
            <EditLink onClick={() => setEditing("goals")} />
          </>
        )}
      </SectionCard>
    </div>
  );
}

function SectionCard({
  title,
  icon,
  subtitle,
  children,
}: {
  title: string;
  icon: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col">
      <h2 className="text-lg font-bold text-gray-800 mb-1 flex items-center gap-2">
        <span>{icon}</span>
        {title}
      </h2>
      <p className="text-sm text-gray-500 mb-4">{subtitle}</p>
      <div className="flex-1 flex flex-col">{children}</div>
    </section>
  );
}

function EditLink({ onClick }: { onClick: () => void }) {
  return (
    <div className="mt-4 flex justify-end">
      <button
        type="button"
        onClick={onClick}
        className="text-sm font-semibold text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-indigo-500 hover:opacity-80 transition"
      >
        Editar
      </button>
    </div>
  );
}

function SaveRow({
  saving,
  onCancel,
  onSave,
}: {
  saving: boolean;
  onCancel: () => void;
  onSave: () => void;
}) {
  return (
    <div className="mt-4 flex justify-end gap-3">
      <button type="button" onClick={onCancel} className={secondaryButtonClass}>
        Cancelar
      </button>
      <button
        type="button"
        onClick={onSave}
        disabled={saving}
        className={`${primaryButtonClass} disabled:opacity-50 disabled:hover:scale-100`}
      >
        {saving ? "Salvando..." : "Salvar"}
      </button>
    </div>
  );
}
