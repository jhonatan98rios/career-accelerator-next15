'use client';

import { Plan } from '@/lib/enums';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function SignupPage() {
  const searchParams = useSearchParams()
  const [plan, setPlan] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    const selectedPlan = searchParams ? searchParams.get('plan') : null;
    if (selectedPlan) {
      setPlan(selectedPlan);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const formData = new FormData(e.currentTarget as HTMLFormElement);
    const { name, email, password } = Object.fromEntries(formData.entries());
    
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password, plan }),
      headers: { 'Content-Type': 'application/json' },
    });

    const data = await res.json()

    if (res.ok) {
      setMessage('Conta criada com sucesso. Aguarde o link de ativação por e-mail.');
    } else {
      console.log(data)
      setMessage('Erro ao criar conta');
    }
  };

  return (
    <main className="bg-gray-50 min-h-screen flex items-center justify-center px-6">
      <div className="bg-white rounded-xl shadow-lg max-w-lg w-full p-8">
        <h1 className="text-3xl font-bold text-center text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-indigo-500">
          Crie sua conta
        </h1>
        <p className="text-center text-gray-500 mt-2">
          Comece agora sua jornada com IA para acelerar sua carreira
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          {/* Nome */}
          <label className="block text-gray-700 mb-4">
            <span className="block text-sm font-semibold mb-2">Nome</span>
            <input
              type="text"
              name="name"
              required
              className="w-full p-3 placeholder-gray-400 text-gray-700 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-400"
              placeholder="Seu nome"
            />
          </label>

          {/* Email */}
          <label className="block text-gray-700 mb-4">
            <span className="block text-sm font-semibold mb-2">Email</span>
            <input
              type="email"
              name="email"
              required
              className="w-full p-3 placeholder-gray-400 text-gray-700 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-400"
              placeholder="seu@email.com"
            />
          </label>

          {/* Senha */}
          <label className="block text-gray-700 mb-4">
            <span className="block text-sm font-semibold mb-2">Senha</span>
            <input
              type="password"
              name="password"
              required
              className="w-full p-3 placeholder-gray-400 text-gray-700 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-400"
              placeholder="••••••••"
            />
          </label>

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

          {/* Botão */}
          <button
            type="submit"
            disabled={!plan}
            className={
              `w-full py-3 rounded-lg bg-gradient-to-r text-white font-bold transition-transform
              ${!!plan ? " from-purple-500 to-indigo-500 hover:scale-105 cursor-pointer" : "from-gray-400 to-gray-500" }
              `
            }
          >
            Criar conta
          </button>

          <p className="text-sm text-gray-600">
            Já tem uma conta?{' '}
            <a href="/login" className="text-purple-500 hover:underline">
              Fazer login
            </a>
          </p>

          <div>
            <p className='block text-gray-700 font-semibold mb-2'>
              {message}
            </p>
          </div>
        </form>
      </div>
    </main>
  );
}
