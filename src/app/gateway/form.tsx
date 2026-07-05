'use client';

import { ChangeEvent, useState } from "react";
import { Plan } from "@/lib/enums";
import { formatCep, formatCpf, onlyDigits } from "@/lib/tax-profile";
import { HttpStatus } from "@/types/httpStatus";

type GatewayFormProps = {
  email: string;
  sub: string;
  picture: string;
  jwtToken: string;
};

type BillingAddressState = {
  cep: string;
  street: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
  ibgeCityCode: string;
  country: string;
};

const EMPTY_ADDRESS: BillingAddressState = {
  cep: "",
  street: "",
  number: "",
  complement: "",
  neighborhood: "",
  city: "",
  state: "",
  ibgeCityCode: "",
  country: "BR",
};

type ViaCepResponse = {
  erro?: boolean;
  logradouro?: string;
  bairro?: string;
  localidade?: string;
  uf?: string;
  ibge?: string;
};

// TODO: Send only JWT token to the API
export function GatewayForm({ email, sub, picture, jwtToken }: GatewayFormProps) {
  const [fullName, setFullName] = useState("");
  const [billingEmail, setBillingEmail] = useState(email);
  const [taxDocument, setTaxDocument] = useState("");
  const [billingAddress, setBillingAddress] = useState<BillingAddressState>(EMPTY_ADDRESS);
  const [message, setMessage] = useState("");
  const [messageTone, setMessageTone] = useState<"error" | "success" | null>(null);
  const [plan, setPlan] = useState("");
  const [isLoading, setLoading] = useState(false);
  const [isLookingUpCep, setIsLookingUpCep] = useState(false);

  function updateBillingAddress(field: keyof BillingAddressState, value: string) {
    setBillingAddress((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (isLoading) return;
    setLoading(true);
    setMessage("");
    setMessageTone(null);

    const res = await fetch("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({
        name: fullName,
        email,
        billingEmail,
        taxDocument,
        billingAddress,
        plan,
        sub,
        picture,
      }),
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${jwtToken}`,
      },
    });

    const data = await res.json().catch(() => null);

    setLoading(false);

    if (res.status === HttpStatus.CREATED) {
      setMessage("Conta criada com sucesso. Aguarde o link de ativacao por e-mail.");
      setMessageTone("success");
      return;
    }

    if (res.status === HttpStatus.BAD_REQUEST && Array.isArray(data?.fields)) {
      setMessage("Revise os dados fiscais obrigatorios antes de continuar.");
      setMessageTone("error");
      return;
    }

    setMessage("Erro ao criar conta. Tente mais tarde.");
    setMessageTone("error");
  }

  async function handleCep(event: ChangeEvent<HTMLInputElement>) {
    const nextCep = formatCep(event.target.value);
    updateBillingAddress("cep", nextCep);

    const cepDigitsOnly = onlyDigits(nextCep);
    if (cepDigitsOnly.length !== 8) {
      return;
    }

    try {
      setIsLookingUpCep(true);
      const res = await fetch(`https://viacep.com.br/ws/${cepDigitsOnly}/json/`);

      if (!res.ok) {
        throw new Error("Erro na requisicao");
      }

      const data = await res.json() as ViaCepResponse;

      if (data.erro) {
        setMessage("Nao encontramos esse CEP. Confira os dados do endereco.");
        setMessageTone("error");
        return;
      }

      setBillingAddress((current) => ({
        ...current,
        cep: nextCep,
        street: data.logradouro || current.street,
        neighborhood: data.bairro || current.neighborhood,
        city: data.localidade || current.city,
        state: data.uf || current.state,
        ibgeCityCode: data.ibge || current.ibgeCityCode,
        country: "BR",
      }));
    } catch (error) {
      console.error("Erro ao buscar endereco pelo CEP:", error);
      setMessage("Nao foi possivel consultar o CEP agora.");
      setMessageTone("error");
    } finally {
      setIsLookingUpCep(false);
    }
  }

  function handleCpf(event: ChangeEvent<HTMLInputElement>) {
    setTaxDocument(formatCpf(event.target.value));
  }

  const canSubmit = Boolean(
    plan &&
    fullName &&
    billingEmail &&
    taxDocument &&
    billingAddress.cep &&
    billingAddress.street &&
    billingAddress.number &&
    billingAddress.neighborhood &&
    billingAddress.city &&
    billingAddress.state &&
    !isLoading,
  );

  return (
    <div className="max-w-2xl mx-auto p-8 justify-center items-center text-center mt-32">
      <div className="mb-8">
        <img src={picture} alt="Foto do usuario" className="mx-auto mb-8 rounded-full" />
      </div>

      <h2 className="text-2xl font-bold mb-4">Crie sua conta</h2>

      {!isLoading && (
        <p className="mb-8 text-gray-600">
          Antes de prosseguir, preencha os dados da assinatura e os dados fiscais que vao para a nota emitida manualmente.
        </p>
      )}

      {!isLoading && (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-gray-700 font-semibold mb-2 text-left">E-mail da conta</label>
            <input
              className="w-full p-3 text-gray-400 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-400"
              disabled
              value={email}
              type="email"
            />
          </div>

          <div>
            <label className="block text-gray-700 font-semibold mb-2 text-left">Nome completo</label>
            <input
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              type="text"
              placeholder="Digite o nome completo"
              className="w-full p-3 text-gray-700 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-400"
            />
          </div>

          <div>
            <label className="block text-gray-700 font-semibold mb-2 text-left">E-mail para faturamento</label>
            <input
              value={billingEmail}
              onChange={(event) => setBillingEmail(event.target.value)}
              type="email"
              placeholder="Digite o e-mail para receber a nota"
              className="w-full p-3 text-gray-700 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-400"
            />
          </div>

          <div>
            <label className="block text-gray-700 font-semibold mb-2 text-left">CPF</label>
            <input
              value={taxDocument}
              onChange={handleCpf}
              type="text"
              placeholder="Digite o CPF"
              className="w-full p-3 text-gray-700 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-400"
            />
          </div>

          <div>
            <label className="block text-gray-700 font-semibold mb-2 text-left">CEP</label>
            <input
              value={billingAddress.cep}
              onChange={handleCep}
              type="text"
              placeholder="Digite o CEP"
              className="w-full p-3 text-gray-700 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-400"
            />
            {isLookingUpCep && (
              <p className="mt-2 text-left text-sm text-gray-500">Consultando CEP...</p>
            )}
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <label className="block text-gray-700 font-semibold mb-2 text-left">Logradouro</label>
              <input
                value={billingAddress.street}
                onChange={(event) => updateBillingAddress("street", event.target.value)}
                type="text"
                placeholder="Rua, avenida, travessa..."
                className="w-full p-3 text-gray-700 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-400"
              />
            </div>
            <div>
              <label className="block text-gray-700 font-semibold mb-2 text-left">Numero</label>
              <input
                value={billingAddress.number}
                onChange={(event) => updateBillingAddress("number", event.target.value)}
                type="text"
                placeholder="Numero"
                className="w-full p-3 text-gray-700 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-400"
              />
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <label className="block text-gray-700 font-semibold mb-2 text-left">Complemento</label>
              <input
                value={billingAddress.complement}
                onChange={(event) => updateBillingAddress("complement", event.target.value)}
                type="text"
                placeholder="Apartamento, bloco, sala..."
                className="w-full p-3 text-gray-700 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-400"
              />
            </div>
            <div>
              <label className="block text-gray-700 font-semibold mb-2 text-left">Bairro</label>
              <input
                value={billingAddress.neighborhood}
                onChange={(event) => updateBillingAddress("neighborhood", event.target.value)}
                type="text"
                placeholder="Bairro"
                className="w-full p-3 text-gray-700 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-400"
              />
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <div className="md:col-span-1">
              <label className="block text-gray-700 font-semibold mb-2 text-left">Cidade</label>
              <input
                value={billingAddress.city}
                onChange={(event) => updateBillingAddress("city", event.target.value)}
                type="text"
                placeholder="Cidade"
                className="w-full p-3 text-gray-700 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-400"
              />
            </div>
            <div>
              <label className="block text-gray-700 font-semibold mb-2 text-left">UF</label>
              <input
                value={billingAddress.state}
                onChange={(event) => updateBillingAddress("state", event.target.value.toUpperCase().slice(0, 2))}
                type="text"
                placeholder="UF"
                className="w-full p-3 text-gray-700 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-400"
              />
            </div>
            <div>
              <label className="block text-gray-700 font-semibold mb-2 text-left">Codigo IBGE</label>
              <input
                value={billingAddress.ibgeCityCode}
                readOnly
                type="text"
                placeholder="Codigo do municipio"
                className="w-full p-3 text-gray-400 rounded-lg border border-gray-200 bg-gray-100 cursor-not-allowed"
              />
            </div>
          </div>

          <div>
            <label className="block text-gray-700 font-semibold mb-2 text-left">Escolha seu plano</label>
            <select
              value={plan}
              onChange={(event) => setPlan(event.target.value)}
              className="w-full p-3 text-gray-700 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-400"
            >
              <option value="">Selecione um plano</option>
              <option value={Plan.BASIC}>Basico - R$29,99/mes - 7 dias gratis</option>
              <option disabled>Intermediario (em breve)</option>
              <option disabled>Premium (em breve)</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={!canSubmit}
            className={`w-full py-3 rounded-lg bg-gradient-to-r text-white font-bold transition-transform ${
              canSubmit ? "from-purple-500 to-indigo-500 hover:scale-105 cursor-pointer" : "from-gray-400 to-gray-500"
            }`}
          >
            Criar Conta
          </button>
        </form>
      )}

      {isLoading && !message && (
        <p>Carregando...</p>
      )}

      {!!message && (
        <p className={messageTone === "error" ? "mt-6 text-red-600" : "mt-6 text-green-700"}>{message}</p>
      )}
    </div>
  );
}
