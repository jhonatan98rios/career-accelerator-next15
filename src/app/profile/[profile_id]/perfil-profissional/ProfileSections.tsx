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
        <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-indigo-500">
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
      <section className="bg-white shadow-lg rounded-2xl p-6 border">
        <Header title="Quem sou eu" subtitle="Resumo da sua trajetória, em texto corrido." />
        {editing === "who" ? (
          <>
            <textarea
              value={who}
              onChange={(e) => setWho(e.target.value)}
              rows={6}
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <SaveRow
              saving={isPending}
              onCancel={() => setEditing(null)}
              onSave={() => save({ who })}
            />
          </>
        ) : (
          <>
            <p className="text-gray-700 leading-relaxed whitespace-pre-line mt-4">
              {who || <span className="italic text-gray-400">Nada preenchido ainda.</span>}
            </p>
            <EditButton onClick={() => setEditing("who")} />
          </>
        )}
      </section>

      {/* O que eu fiz */}
      <section className="bg-white shadow-lg rounded-2xl p-6 border">
        <Header
          title="O que eu fiz"
          subtitle="Suas experiências profissionais — cada item com título, período e descrição."
        />
        {editing === "experience" ? (
          <>
            <div className="mt-4 space-y-4">
              {experience.map((item, i) => (
                <div key={i} className="border border-gray-200 rounded-xl p-4 space-y-3">
                  <div className="flex gap-3">
                    <input
                      value={item.title}
                      onChange={(e) => setItem(i, "title", e.target.value)}
                      placeholder="Título (ex: Desenvolvedor na Acme)"
                      className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                    <input
                      value={item.period}
                      onChange={(e) => setItem(i, "period", e.target.value)}
                      placeholder="Período (ex: 2020-2022)"
                      className="w-40 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                    <button
                      type="button"
                      onClick={() => setExperience((prev) => prev.filter((_, idx) => idx !== i))}
                      className="px-3 rounded-lg border border-red-200 text-red-500 text-sm hover:bg-red-50 transition"
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
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              ))}
              <button
                type="button"
                onClick={() => setExperience((prev) => [...prev, emptyItem()])}
                className="px-4 py-2 rounded-xl border border-purple-300 text-purple-600 text-sm font-semibold hover:bg-purple-50 transition"
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
          <ul className="mt-4 space-y-4">
            {experience.map((item, i) => (
              <li key={i} className="border-l-4 border-purple-500 pl-4">
                <p className="font-semibold text-gray-800">
                  {item.title}
                  {item.period && (
                    <span className="font-normal text-sm text-gray-500"> · {item.period}</span>
                  )}
                </p>
                {item.description && (
                  <p className="text-gray-600 text-sm leading-relaxed mt-1">{item.description}</p>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="italic text-gray-400 mt-4">Nenhuma experiência cadastrada.</p>
        )}
        {editing !== "experience" && <EditButton onClick={() => setEditing("experience")} />}
      </section>

      {/* O que eu pretendo fazer */}
      <section className="bg-white shadow-lg rounded-2xl p-6 border">
        <Header
          title="O que eu pretendo fazer"
          subtitle="Seus objetivos de carreira, em texto corrido."
        />
        {editing === "goals" ? (
          <>
            <textarea
              value={goals}
              onChange={(e) => setGoals(e.target.value)}
              rows={6}
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <SaveRow
              saving={isPending}
              onCancel={() => setEditing(null)}
              onSave={() => save({ goals })}
            />
          </>
        ) : (
          <>
            <p className="text-gray-700 leading-relaxed whitespace-pre-line mt-4">
              {goals || <span className="italic text-gray-400">Nada preenchido ainda.</span>}
            </p>
            <EditButton onClick={() => setEditing("goals")} />
          </>
        )}
      </section>
    </div>
  );
}

function Header({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div>
      <h2 className="text-xl font-bold text-gray-800">{title}</h2>
      <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
    </div>
  );
}

function EditButton({ onClick }: { onClick: () => void }) {
  return (
    <div className="mt-4 flex justify-end">
      <button
        type="button"
        onClick={onClick}
        className="text-sm font-semibold text-purple-600 hover:text-purple-800 transition"
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
    <div className="mt-3 flex justify-end gap-3">
      <button
        type="button"
        onClick={onCancel}
        className="px-4 py-2 rounded-xl border border-gray-300 text-gray-600 hover:bg-gray-100 transition"
      >
        Cancelar
      </button>
      <button
        type="button"
        onClick={onSave}
        disabled={saving}
        className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-semibold hover:opacity-90 transition disabled:opacity-50"
      >
        {saving ? "Salvando..." : "Salvar"}
      </button>
    </div>
  );
}
