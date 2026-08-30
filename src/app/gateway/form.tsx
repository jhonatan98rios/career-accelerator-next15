"use client";

import Image from "next/image";
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
  country: "BR",
};

// ponytail: shared field wrapper — 11 near-identical inputs, keeps GatewayForm under max-lines-per-function
const Field = ({
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  disabled = false,
  hint,
}: {
  label: string;
  type?: string;
  value: string;
  onChange?: (event: ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  disabled?: boolean;
  hint?: string;
}) => (
  <div>
    <label className="block text-gray-700 font-semibold mb-2 text-left">{label}</label>
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
      className={`w-full p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-400 ${
        disabled ? "text-gray-400" : "text-gray-700"
      }`}
    />
    {hint && <p className="mt-2 text-left text-sm text-gray-500">{hint}</p>}
  </div>
);

type ViaCepResponse = {
  erro?: boolean;
  logradouro?: string;
  bairro?: string;
  localidade?: string;
  uf?: string;
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
      const fieldLabels: Record<string, string> = {
        name: "nome",
        billingEmail: "email de faturamento",
        taxDocument: "cpf",
        "billingAddress.cep": "cep",
        "billingAddress.street": "logradouro",
        "billingAddress.number": "numero",
        "billingAddress.neighborhood": "bairro",
        "billingAddress.city": "cidade",
        "billingAddress.state": "uf",
        "billingAddress.country": "pais",
      };
      const labels = data.fields.map((field: string) => fieldLabels[field] ?? field);
      const missing = labels.join(", ").replace(/, ([^,]*)$/, " e $1");
      setMessage(`Revise os dados fiscais obrigatorios (${missing}) antes de continuar.`);
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

      const data = (await res.json()) as ViaCepResponse;

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
    !isLoading
  );

  return (
    <div className="max-w-2xl mx-auto p-8 justify-center items-center text-center mt-32">
      <div className="mb-8">
        <Image
          src={picture}
          alt="Foto do usuario"
          className="mx-auto mb-8 rounded-full"
          width={128}
          height={128}
        />
      </div>

      <h2 className="text-2xl font-bold mb-4">Crie sua conta</h2>

      {!isLoading && (
        <p className="mb-8 text-gray-600">
          Antes de prosseguir, preencha os dados da assinatura e os dados fiscais que vao para a
          nota emitida manualmente.
        </p>
      )}

      {!isLoading && (
        <form onSubmit={handleSubmit} className="space-y-6">
          <Field label="E-mail da conta" type="email" value={email} disabled />

          <Field
            label="Nome completo"
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            placeholder="Digite o nome completo"
          />

          <Field
            label="E-mail para faturamento"
            type="email"
            value={billingEmail}
            onChange={(event) => setBillingEmail(event.target.value)}
            placeholder="Digite o e-mail para receber a nota"
          />

          <Field label="CPF" value={taxDocument} onChange={handleCpf} placeholder="Digite o CPF" />

          <Field
            label="CEP"
            value={billingAddress.cep}
            onChange={handleCep}
            placeholder="Digite o CEP"
            hint={isLookingUpCep ? "Consultando CEP..." : undefined}
          />

          <div className="grid gap-6 md:grid-cols-2">
            <Field
              label="Logradouro"
              value={billingAddress.street}
              onChange={(event) => updateBillingAddress("street", event.target.value)}
              placeholder="Rua, avenida, travessa..."
            />
            <Field
              label="Numero"
              value={billingAddress.number}
              onChange={(event) => updateBillingAddress("number", event.target.value)}
              placeholder="Numero"
            />
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Field
              label="Complemento (opcional)"
              value={billingAddress.complement}
              onChange={(event) => updateBillingAddress("complement", event.target.value)}
              placeholder="Apartamento, bloco, sala..."
            />
            <Field
              label="Bairro"
              value={billingAddress.neighborhood}
              onChange={(event) => updateBillingAddress("neighborhood", event.target.value)}
              placeholder="Bairro"
            />
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Field
              label="Cidade"
              value={billingAddress.city}
              onChange={(event) => updateBillingAddress("city", event.target.value)}
              placeholder="Cidade"
            />
            <Field
              label="UF"
              value={billingAddress.state}
              onChange={(event) =>
                updateBillingAddress("state", event.target.value.toUpperCase().slice(0, 2))
              }
              placeholder="UF"
            />
          </div>

          <div>
            <label className="block text-gray-700 font-semibold mb-2 text-left">
              Escolha seu plano
            </label>
            <select
              value={plan}
              onChange={(event) => setPlan(event.target.value)}
              className="w-full p-3 text-gray-700 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-400"
            >
              <option value="">Selecione um plano</option>
              <option value={Plan.BASIC}>Basico - R$29,90/mes - Insight e curriculo</option>
              <option value={Plan.PLUS}>
                Acelera.ai Plus - R$49,90/mes - Chat com IA + 10 curriculos/dia
              </option>
              <option value={Plan.ULTRA}>
                Acelera.ai Ultra - R$99,90/mes - Chat com IA (10 sessoes/dia) + 30 curriculos/dia
              </option>
            </select>
          </div>

          <button
            type="submit"
            disabled={!canSubmit}
            className={`w-full py-3 rounded-lg bg-gradient-to-r text-white font-bold transition-transform ${
              canSubmit
                ? "from-purple-500 to-indigo-500 hover:scale-105 cursor-pointer"
                : "from-gray-400 to-gray-500"
            }`}
          >
            Criar Conta
          </button>
        </form>
      )}

      {isLoading && !message && <p>Carregando...</p>}

      {!!message && (
        <p className={messageTone === "error" ? "mt-6 text-red-600" : "mt-6 text-green-700"}>
          {message}
        </p>
      )}
    </div>
  );
}
