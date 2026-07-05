import type { BillingAddress, IProfile, TaxDocumentType } from "@/models/Profile";

export type BillingAddressInput = {
  cep?: string | null;
  street?: string | null;
  number?: string | null;
  complement?: string | null;
  neighborhood?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
};

export type TaxProfileInput = {
  name?: string | null;
  billingEmail?: string | null;
  taxDocument?: string | null;
  billingAddress?: BillingAddressInput | null;
};

export type NormalizedTaxProfile = {
  name: string;
  billingEmail: string;
  taxDocumentType: TaxDocumentType;
  taxDocument: string;
  billingAddress: BillingAddress;
  billingProfileCompletedAt: Date;
  legacy: {
    cpf: string;
    cep: string;
    address: string;
    address2: string | null;
  };
};

export function onlyDigits(value: string | null | undefined) {
  return (value || "").replace(/\D/g, "");
}

export function formatCpf(value: string | null | undefined) {
  const digits = onlyDigits(value).slice(0, 11);

  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return digits.replace(/(\d{3})(\d+)/, "$1.$2");
  if (digits.length <= 9) return digits.replace(/(\d{3})(\d{3})(\d+)/, "$1.$2.$3");

  return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2}).*/, "$1.$2.$3-$4");
}

export function formatCep(value: string | null | undefined) {
  const digits = onlyDigits(value).slice(0, 8);

  if (digits.length <= 5) return digits;

  return digits.replace(/(\d{5})(\d+)/, "$1-$2");
}

export function isValidCpf(value: string | null | undefined) {
  const cpf = onlyDigits(value);

  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) {
    return false;
  }

  let sum = 0;
  for (let index = 0; index < 9; index += 1) {
    sum += Number(cpf[index]) * (10 - index);
  }

  let firstDigit = (sum * 10) % 11;
  if (firstDigit === 10) firstDigit = 0;
  if (firstDigit !== Number(cpf[9])) {
    return false;
  }

  sum = 0;
  for (let index = 0; index < 10; index += 1) {
    sum += Number(cpf[index]) * (11 - index);
  }

  let secondDigit = (sum * 10) % 11;
  if (secondDigit === 10) secondDigit = 0;

  return secondDigit === Number(cpf[10]);
}

export function normalizeTaxProfile(input: TaxProfileInput): { data?: NormalizedTaxProfile; errors: string[] } {
  const errors: string[] = [];

  const name = input.name?.trim() || "";
  const billingEmail = input.billingEmail?.trim().toLowerCase() || "";
  const taxDocument = onlyDigits(input.taxDocument);
  const cep = onlyDigits(input.billingAddress?.cep);
  const street = input.billingAddress?.street?.trim() || "";
  const number = input.billingAddress?.number?.trim() || "";
  const complement = input.billingAddress?.complement?.trim() || null;
  const neighborhood = input.billingAddress?.neighborhood?.trim() || "";
  const city = input.billingAddress?.city?.trim() || "";
  const state = input.billingAddress?.state?.trim().toUpperCase() || "";
  const country = (input.billingAddress?.country?.trim().toUpperCase() || "BR");

  if (name.length < 2) errors.push("name");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(billingEmail)) errors.push("billingEmail");
  if (!isValidCpf(taxDocument)) errors.push("taxDocument");
  if (cep.length !== 8) errors.push("billingAddress.cep");
  if (!street) errors.push("billingAddress.street");
  if (!number) errors.push("billingAddress.number");
  if (!neighborhood) errors.push("billingAddress.neighborhood");
  if (!city) errors.push("billingAddress.city");
  if (!/^[A-Z]{2}$/.test(state)) errors.push("billingAddress.state");
  if (country !== "BR") errors.push("billingAddress.country");

  if (errors.length > 0) {
    return { errors };
  }

  const address = `${street}, ${number} - ${neighborhood}, ${city} - ${state}`;

  return {
    errors,
    data: {
      name,
      billingEmail,
      taxDocumentType: "CPF",
      taxDocument,
      billingAddress: {
        cep,
        street,
        number,
        complement,
        neighborhood,
        city,
        state,
        country,
      },
      billingProfileCompletedAt: new Date(),
      legacy: {
        cpf: taxDocument,
        cep,
        address,
        address2: complement,
      },
    },
  };
}

/** Fetch IBGE city code from public API. Returns null on failure. */
export async function fetchIbgeCityCode(state: string, city: string): Promise<string | null> {
  try {
    const res = await fetch(
      `https://servicodados.ibge.gov.br/api/v1/localidades/estados/${state}/municipios`,
    );
    if (!res.ok) return null;

    const municipios = (await res.json()) as { id: number; nome: string }[];
    const match = municipios.find(
      (m) => m.nome.localeCompare(city, "pt-BR", { sensitivity: "base" }) === 0,
    );
    return match ? String(match.id) : null;
  } catch {
    return null;
  }
}

export function isBillingProfileComplete(profile: Partial<IProfile> | null | undefined) {
  if (!profile?.billingProfileCompletedAt) {
    return false;
  }

  const normalized = normalizeTaxProfile({
    name: profile.name,
    billingEmail: profile.billingEmail || profile.email,
    taxDocument: profile.taxDocument || profile.cpf,
    billingAddress: profile.billingAddress || {
      cep: profile.cep,
    },
  });

  return normalized.errors.length === 0;
}
