import { describe, expect, it } from "vitest";
import {
  formatCep,
  formatCpf,
  isBillingProfileComplete,
  isValidCpf,
  normalizeTaxProfile,
  onlyDigits,
} from "@/lib/tax-profile";

describe("tax-profile helpers", () => {
  it("normalizes digits and display masks", () => {
    expect(onlyDigits("123.456.789-09")).toBe("12345678909");
    expect(formatCpf("12345678909")).toBe("123.456.789-09");
    expect(formatCep("69005100")).toBe("69005-100");
  });

  it("validates CPF check digits", () => {
    expect(isValidCpf("529.982.247-25")).toBe(true);
    expect(isValidCpf("111.111.111-11")).toBe(false);
    expect(isValidCpf("529.982.247-24")).toBe(false);
  });

  it("normalizes a valid Brazilian billing profile", () => {
    const result = normalizeTaxProfile({
      name: "Maria Silva",
      billingEmail: "maria@example.com",
      taxDocument: "529.982.247-25",
      billingAddress: {
        cep: "69005-100",
        street: "Rua A",
        number: "123",
        complement: "Apto 45",
        neighborhood: "Centro",
        city: "Manaus",
        state: "am",
      },
    });

    expect(result.errors).toEqual([]);
    expect(result.data?.taxDocument).toBe("52998224725");
    expect(result.data?.billingAddress.cep).toBe("69005100");
    expect(result.data?.billingAddress.state).toBe("AM");
    expect(result.data?.billingAddress.country).toBe("BR");
  });

  it("reports missing structured fields", () => {
    const result = normalizeTaxProfile({
      name: "M",
      billingEmail: "maria",
      taxDocument: "123",
      billingAddress: {
        cep: "1",
        street: "",
        number: "",
        neighborhood: "",
        city: "",
        state: "",
      },
    });

    expect(result.errors).toContain("name");
    expect(result.errors).toContain("billingEmail");
    expect(result.errors).toContain("taxDocument");
    expect(result.errors).toContain("billingAddress.cep");
    expect(result.errors).toContain("billingAddress.street");
    expect(result.errors).toContain("billingAddress.number");
    expect(result.errors).toContain("billingAddress.neighborhood");
    expect(result.errors).toContain("billingAddress.city");
    expect(result.errors).toContain("billingAddress.state");
  });

  it("requires a complete billing profile to be marked complete", () => {
    expect(isBillingProfileComplete(null)).toBe(false);
    expect(isBillingProfileComplete({
      name: "Maria Silva",
      email: "maria@example.com",
      taxDocument: "52998224725",
      billingProfileCompletedAt: new Date(),
      billingAddress: {
        cep: "69005100",
        street: "Rua A",
        number: "123",
        neighborhood: "Centro",
        city: "Manaus",
        state: "AM",
        country: "BR",
      },
    })).toBe(true);
  });
});
