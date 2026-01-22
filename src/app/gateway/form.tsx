'use client';

import { Plan } from "@/lib/enums";
import { HttpStatus } from "@/types/httpStatus";
import { useState } from "react";

type GatewayFormProps = {
  email: string,
  sub: string,
  picture: string,
  jwtToken: string;
};

// TODO: Send only JWT token to the API
export function GatewayForm({ email, sub, picture, jwtToken }: GatewayFormProps) {

  const [fullName, setFullName] = useState('')
  const [cpf, setCpf] = useState('')
  const [cep, setCep] = useState('')
  const [address, setAddress] = useState('')
  const [address2, setAddress2] = useState('')


  const [message, setMessage] = useState('')
  const [plan, setPlan] = useState('')
  const [isLoading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (isLoading) return;
    setLoading(true);

    const res = await fetch('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: fullName,
        email,
        cpf,
        cep,
        address,
        address2,
        plan,
        sub,
        picture,
      }),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${jwtToken}`
      },
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

  async function handleCep(event: React.ChangeEvent<HTMLInputElement>) {
    const input = event.target;
    let cepValue = input.value;

    // Permite apenas números e o hífen
    cepValue = cepValue.replace(/[^\d-]/g, '');

    // Remove hífens extras
    const hyphenCount = (cepValue.match(/-/g) || []).length;
    if (hyphenCount > 1) {
      cepValue = cepValue.replace(/-/g, '');
    }

    // Aplica a máscara
    if (cepValue.length > 5 && !cepValue.includes('-')) {
      cepValue = cepValue.substring(0, 5) + '-' + cepValue.substring(5, 8);
    }

    // Limita o tamanho máximo (9 caracteres com máscara)
    if (cepValue.length > 9) {
      cepValue = cepValue.substring(0, 9);
    }

    // Atualiza o valor do input
    input.value = cepValue;
    setCep(cepValue);

    // Remove máscara para a consulta
    const cepDigitsOnly = cepValue.replace(/\D/g, '');

    if (cepDigitsOnly.length === 8) {
      try {
        const res = await fetch(`https://viacep.com.br/ws/${cepDigitsOnly}/json/`);

        if (!res.ok) {
          throw new Error('Erro na requisição');
        }

        const data = await res.json();

        if (data.erro) {
          setAddress('CEP não encontrado');
          // Pode adicionar um estado de erro aqui
        } else {
          const fullAddress = `${data.logradouro}, ${data.bairro}, ${data.localidade} - ${data.uf}`;
          setAddress(fullAddress);
        }
      } catch (error) {
        console.error('Erro ao buscar endereço pelo CEP:', error);
      }
    }
  }

  async function handleCpf(event: React.ChangeEvent<HTMLInputElement>) {
    let cpfValue = event.target.value;

    // Remove tudo que não é número
    cpfValue = cpfValue.replace(/\D/g, '');

    // Limita a 11 dígitos (tamanho máximo do CPF)
    if (cpfValue.length > 11) {
      cpfValue = cpfValue.substring(0, 11);
    }

    // Aplica a máscara progressivamente
    if (cpfValue.length > 10) {
      // Formato completo: XXX.XXX.XXX-XX
      cpfValue = cpfValue.substring(0, 11);
      cpfValue = cpfValue.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    } else if (cpfValue.length == 10) {
      // Formato parcial: XXX.XXX.XXX-X
      cpfValue = cpfValue.replace(/(\d{3})(\d{3})(\d{0,3})(\d{1})/, '$1.$2.$3-$4');
    } else if (cpfValue.length > 6) {
      // Formato parcial: XXX.XXX.XXX
      cpfValue = cpfValue.replace(/(\d{3})(\d{3})(\d{0,3})/, '$1.$2.$3');
    } else if (cpfValue.length > 3) {
      // Formato parcial: XXX.XXX
      cpfValue = cpfValue.replace(/(\d{3})(\d{0,3})/, '$1.$2');
    }

    setCpf(cpfValue);
  }

  return (
    <div className="max-w-2xl mx-auto p-8 justify-center items-center text-center mt-32">
      <div className="mb-8">
        <img src={picture} alt="Foto do usuário" className="mx-auto mb-8 rounded-full" />
      </div>

      <h2 className="text-2xl font-bold mb-4">Crie sua conta</h2>

      {
        (!isLoading && !message) && (
          <p className="mb-8 text-gray-600">
            Antes de prosseguir, por favor, preencha o formulário abaixo para criar sua conta e escolher seu plano de assinatura.
          </p>
        )
      }

      {
        (!isLoading && !message) && (
          <form onSubmit={handleSubmit} className="space-y-6">

            {/* Email */}
            <div>
              <label className="block text-gray-700 font-semibold mb-2 text-left">E-mail (preenchimento automático)</label>
              <input
                className="w-full p-3 text-gray-400 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-400"
                disabled
                value={email}
                type="email"
              />
            </div>

            {/* Nome */}
            <div>
              <label className="block text-gray-700 font-semibold mb-2 text-left">Nome Completo</label>
              <input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                type="text"
                placeholder="Digite o nome"
                className="w-full p-3 text-gray-700 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-400"
              />
            </div>

            {/* CPF */}
            <div>
              <label className="block text-gray-700 font-semibold mb-2 text-left">CPF</label>
              <input
                value={cpf}
                onChange={handleCpf}
                type="text"
                placeholder="Digite o CPF"
                className="w-full p-3 text-gray-700 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-400"
              />
            </div>

            {/* CEP pra NF */}
            <div>
              <label className="block text-gray-700 font-semibold mb-2 text-left">CEP</label>
              <input
                value={cep}
                onChange={handleCep}
                type="text"
                placeholder="Digite o CEP para NF"
                className="w-full p-3 text-gray-700 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-400"
              />
            </div>

            {/* Endereço pra NF */}
            <div>
              <label className="block text-gray-700 font-semibold mb-2 text-left">Endereço</label>
              <input
                value={address}
                disabled
                type="text"
                placeholder="Digite o endereço para NF"
                className="w-full p-3 text-gray-700 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-400"
              />
            </div>

            {/* Complemento */}
            <div>
              <label className="block text-gray-700 font-semibold mb-2 text-left">Complemento</label>
              <input
                value={address2}
                onChange={(e) => setAddress2(e.target.value)}
                type="text"
                placeholder="Digite o complemento"
                className="w-full p-3 text-gray-700 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-400"
              />
            </div>

            {/* Plano */}
            <div>
              <label className="block text-gray-700 font-semibold mb-2 text-left">Escolha seu plano</label>
              <select
                value={plan}
                onChange={(e) => setPlan(e.target.value)}
                className="w-full p-3 text-gray-700 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-400"
              >
                <option value="">Selecione um plano</option>
                <option value={Plan.BASIC}>Básico - R$29,99/mês - 7 dias grátis</option>
                <option disabled>Intermediário (em breve)</option>
                <option disabled>Premium (em breve)</option>
              </select>

            </div>
            <button
              type="submit"
              disabled={!plan || !fullName || !cpf || !cep || !address || !address2 || isLoading}
              className={
                `w-full py-3 rounded-lg bg-gradient-to-r text-white font-bold transition-transform
                ${!!plan ? " from-purple-500 to-indigo-500 hover:scale-105 cursor-pointer" : "from-gray-400 to-gray-500"}
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