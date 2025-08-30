'use client';

import { Plan } from "@/lib/enums";
import { HttpStatus } from "@/types/httpStatus";
import { useEffect, useState } from "react";

type GatewayFormProps = {
  name: string,
  email: string,
  sub: string,
  picture: string,
};

export function GatewayForm({ name, email, sub, picture }: GatewayFormProps) {

  const [message, setMessage] = useState('')
  const [plan, setPlan] = useState('')
  const [isLoading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (isLoading) return;
    setLoading(true);

    const res = await fetch('/api/v2/auth/register', {
      method: 'POST',
      body: JSON.stringify({ 
        name, 
        email, 
        plan,
        sub,
        picture,
      }),
      headers: { 'Content-Type': 'application/json' },
    });

    const data = await res.json()

    setLoading(false);

    if (res.status === HttpStatus.CREATED) {
      setMessage('Conta criada com sucesso. Aguarde o link de ativação por e-mail.');
    } else {
      console.log(data)
      setMessage('Erro ao criar conta. Tente mais tarde.');
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-8 justify-center items-center text-center mt-32">
      <div className="mb-8">
        <img src={picture} alt="Foto do usuário" className="mx-auto mb-8 rounded-full" />
        <h1>Bem-vindo, {name || email}</h1>
        <p>Email: {email}</p>
        <p>Sub: {sub}</p>
      </div>

      {
        (!isLoading && !message) && (
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Plano */}
            <div>
              <label className="block text-gray-700 font-semibold mb-2">Escolha seu plano</label>
              <select
                value={plan}
                onChange={(e) => setPlan(e.target.value)}
                className="w-full p-3 text-gray-700 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-400"
              >
                <option value="">Selecione um plano</option>
                <option value={Plan.BASIC}>Básico - R$14,99/mês - 7 dias grátis</option>
                <option disabled>Intermediário (em breve)</option>
                <option disabled>Premium (em breve)</option>
              </select>

            </div>
            <button
              type="submit"
              disabled={!plan}
              className={
                `w-full py-3 rounded-lg bg-gradient-to-r text-white font-bold transition-transform
                ${!!plan ? " from-purple-500 to-indigo-500 hover:scale-105 cursor-pointer" : "from-gray-400 to-gray-500" }
                `
              }
            >
              Criar Conta  
            </button>
          </form>
        )
      }

      {
        (isLoading && !message) && (
          <p>Carregando...</p>
        )
      }

      {
        (!!message) && (
          <p>{message}</p>
        )
      }
    </div>
  )
}