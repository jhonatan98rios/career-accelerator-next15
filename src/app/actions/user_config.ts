"use server";

import { connectDB } from "@/lib/db";
import { Profile } from "@/models/Profile";
import { auth0 } from "@/lib/auth0";
import { log, LogLevel } from "@/lib/logger";
import { normalizeTaxProfile, fetchIbgeCityCode } from "@/lib/tax-profile";

export async function updateUserData(formData: FormData) {
  const session = await auth0.getSession();
  if (!session) {
    await log(LogLevel.ERROR, "updateUserData: User authentication failed");
    throw new Error("User authentication failed");
  }

  const name = formData.get("name") as string;
  const billingEmail = formData.get("billingEmail") as string;
  const taxDocument = formData.get("taxDocument") as string;

  let ibgeCityCode = formData.get("billingAddress.ibgeCityCode") as string;
  const city = formData.get("billingAddress.city") as string;
  const state = formData.get("billingAddress.state") as string;

  // ponytail: fetch IBGE if city+state known but code missing
  if (!ibgeCityCode && city && state) {
    ibgeCityCode = (await fetchIbgeCityCode(state, city)) || "";
  }

  const normalizedTaxProfile = normalizeTaxProfile({
    name,
    billingEmail,
    taxDocument,
    billingAddress: {
      cep: formData.get("billingAddress.cep") as string,
      street: formData.get("billingAddress.street") as string,
      number: formData.get("billingAddress.number") as string,
      complement: formData.get("billingAddress.complement") as string,
      neighborhood: formData.get("billingAddress.neighborhood") as string,
      city,
      state,
      ibgeCityCode,
      country: formData.get("billingAddress.country") as string,
    },
  });

  if (normalizedTaxProfile.errors.length > 0 || !normalizedTaxProfile.data) {
    await log(LogLevel.WARN, "updateUserData: Invalid fiscal profile data", {
      email: session.user.email,
      invalidFields: normalizedTaxProfile.errors,
    });
    throw new Error("Invalid fiscal profile data");
  }

  await connectDB();
  await Profile.findOneAndUpdate(
    { email: session.user.email },
    {
      $set: {
        name: normalizedTaxProfile.data.name,
        billingEmail: normalizedTaxProfile.data.billingEmail,
        taxDocumentType: normalizedTaxProfile.data.taxDocumentType,
        taxDocument: normalizedTaxProfile.data.taxDocument,
        billingAddress: normalizedTaxProfile.data.billingAddress,
        billingProfileCompletedAt: normalizedTaxProfile.data.billingProfileCompletedAt,
        cpf: normalizedTaxProfile.data.legacy.cpf,
        cep: normalizedTaxProfile.data.legacy.cep,
        address: normalizedTaxProfile.data.legacy.address,
        address2: normalizedTaxProfile.data.legacy.address2,
      },
    },
  );
}
