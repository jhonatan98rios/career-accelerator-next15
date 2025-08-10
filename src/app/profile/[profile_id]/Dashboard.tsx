"use client";
import { useState } from "react";
import Link from "next/link";

export default function Dashboard() {

  return (
    <>
      <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-indigo-500">
        Bem-vindo(a) de volta!
      </h1>
      <p className="text-gray-600">
        Aqui você encontra um resumo das suas principais informações.
      </p>

      <div className="space-y-8">
        {/* Estatísticas */}
        <div className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition min-h-[200px] flex flex-col justify-between">
          <h2 className="text-2xl font-bold text-purple-500">Estatísticas</h2>
          <p className="text-gray-600">
            Entenda a situação atual do mercado e como você deve se posicionar. Utilize dados para tomar decisões acertivas para a sua carreira.
          </p>
        </div>

        {/* Plano de Carreira */}
        <div className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition min-h-[200px] flex flex-col justify-between">
          <h2 className="text-2xl font-bold text-purple-500">Novo Plano de Carreira</h2>
          <p className="text-gray-600">
            Utilize a mais moderna inteligência artificial para consultar dados do mercado de trabalho e gerar insights que te ajudarão a crescer na sua carreira.
          </p>
        </div>

        {/* Roadmap */}
        <div className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition min-h-[200px] flex flex-col justify-between">
          <h2 className="text-2xl font-bold text-purple-500">Roadmap</h2>
          <p className="text-gray-600">
            Acesse o plano de estudos criado especialmente para você e acompanhe seu progresso.
          </p>
        </div>

        {/* Currículo - bloqueado */}
        <div className="bg-gray-200 rounded-xl shadow-inner p-8 min-h-[200px] flex flex-col justify-between opacity-60 relative">
          <div className="absolute top-2 right-4 bg-yellow-400 text-gray-800 px-3 py-1 rounded-full text-xs font-bold">
            Em breve
          </div>
          <h2 className="text-2xl font-bold text-gray-500">
            Otimização de Currículo
          </h2>
          <p className="text-gray-500">
            Gere automaticamente um curriculo novo, otimizado para cada vaga e aumente suas chances.
          </p>
        </div>
      </div>
    </>
  );
}
