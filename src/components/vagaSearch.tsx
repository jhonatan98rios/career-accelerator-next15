"use client";

import { useState } from "react";

type VagaLink = {
  label: string;
  url: string;
  highlighted: boolean;
};

function buildVagaUrl(keyword: string, datePosted: "past-24h" | "past-week" | "past-month"): string {
  const encoded = `%22${encodeURIComponent(keyword)}%22%20and%20%22contratando%22`;
  return `https://www.linkedin.com/search/results/content/?keywords=${encoded}&origin=FACETED_SEARCH&datePosted=%5B%22${datePosted}%22%5D`;
}

function buildVagaLinks(keyword: string): VagaLink[] {
  return [
    {
      label: "Vagas postadas hoje",
      url: buildVagaUrl(keyword, "past-24h"),
      highlighted: true,
    },
    {
      label: "Vagas da semana",
      url: buildVagaUrl(keyword, "past-week"),
      highlighted: false,
    },
    {
      label: "Vagas do mês",
      url: buildVagaUrl(keyword, "past-month"),
      highlighted: false,
    },
  ];
}

interface Props {
  initialKeyword: string | null;
}

export default function VagaSearch({ initialKeyword }: Props) {
  const [manualKeyword, setManualKeyword] = useState("");
  const [activeKeyword, setActiveKeyword] = useState<string | null>(initialKeyword);

  const keyword = activeKeyword || null;
  const links = keyword ? buildVagaLinks(keyword) : null;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = manualKeyword.trim();
    if (trimmed) setActiveKeyword(trimmed);
  };

  return (
    <div className="max-w-3xl mx-auto w-full min-h-96">
      <h1 className="text-2xl mb-8 text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-indigo-500">
        Encontrar Vagas
      </h1>

      {!keyword && (
        <div className="w-full max-w-md">
          <p className="text-gray-700 text-center mb-4">Quais vagas deseja buscar?</p>
          <form onSubmit={handleSearch} className="flex gap-2">
            <input
              type="text"
              value={manualKeyword}
              onChange={(e) => setManualKeyword(e.target.value)}
              placeholder="ex.: python, react, data science"
              className="flex-1 px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
            />
            <button
              type="submit"
              className="px-4 py-3 bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-medium rounded-xl shadow-md hover:opacity-90 transition cursor-pointer whitespace-nowrap"
            >
              Buscar
            </button>
          </form>
        </div>
      )}

      {links && (
        <div className="w-full max-w-lg space-y-4 mt-4">
          {links.map((link) => (
            <a
              key={link.label}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`block p-5 rounded-xl border shadow-sm transition hover:shadow-md ${
                link.highlighted
                  ? "border-purple-400 bg-purple-50 ring-1 ring-purple-300"
                  : "border-gray-200 bg-white"
              }`}
            >
              <div className="flex items-center justify-between">
                <span
                  className={`font-semibold text-lg ${
                    link.highlighted ? "text-purple-700" : "text-gray-800"
                  }`}
                >
                  {link.label}
                </span>
                {link.highlighted && (
                  <span className="text-xs font-bold text-purple-600 bg-purple-100 px-2 py-1 rounded-full">
                    Recomendado
                  </span>
                )}
              </div>
              <p className="text-gray-500 text-sm mt-1 break-all">{link.url}</p>
            </a>
          ))}

          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-gray-600 text-sm mb-3 text-center">
              Não encontrou a vaga que estava procurando? Busque por outros tipos de vagas aqui
            </p>
            <form onSubmit={handleSearch} className="flex gap-2 max-w-md mx-auto">
              <input
                type="text"
                value={manualKeyword}
                onChange={(e) => setManualKeyword(e.target.value)}
                placeholder="ex.: python, react, data science"
                className="flex-1 px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
              />
              <button
                type="submit"
                className="px-4 py-3 bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-medium rounded-xl shadow-md hover:opacity-90 transition cursor-pointer whitespace-nowrap"
              >
                Buscar
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
