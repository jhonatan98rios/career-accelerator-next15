import { Plan, UserStatus } from "@/lib/enums";
import mongoose, { Schema, Document } from "mongoose";

export type TaxDocumentType = "CPF";

export type BillingAddress = {
  cep: string;
  street: string;
  number: string;
  complement?: string | null;
  neighborhood: string;
  city: string;
  state: string;
  country: string;
};

export interface IProfile extends Document {
  name: string;
  email: string;
  cpf?: string;
  cep?: string;
  address?: string;
  address2?: string;
  picture: string;
  plan: Plan;
  status: UserStatus;
  billingEmail?: string | null;
  taxDocumentType?: TaxDocumentType | null;
  taxDocument?: string | null;
  billingAddress?: BillingAddress | null;
  billingProfileCompletedAt?: Date | null;
  externalAuthId?: string;
  subscriptionId?: string;
  stripeCustomerId?: string;
  lastInsightGeneratedAt?: Date | null;
  skipAiGenerationGuardrails?: boolean;
  createdAt: Date;
}

const BillingAddressSchema = new Schema<BillingAddress>({
  cep: { type: String, required: true },
  street: { type: String, required: true },
  number: { type: String, required: true },
  complement: { type: String, required: false, default: null },
  neighborhood: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  country: { type: String, required: true, default: "BR" },
}, { _id: false });

const ProfileSchema = new Schema<IProfile>({
  email: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true },
  cpf: { type: String, required: false, default: null },
  cep: { type: String, required: false, default: null },
  address: { type: String, required: false, default: null },
  address2: { type: String, required: false, default: null },
  plan: { type: String, required: true },
  externalAuthId: { type: String, required: true, unique: true },
  billingEmail: { type: String, required: false, default: null },
  taxDocumentType: { type: String, required: false, default: null },
  taxDocument: { type: String, required: false, default: null },
  billingAddress: { type: BillingAddressSchema, required: false, default: null },
  billingProfileCompletedAt: { type: Date, required: false, default: null },
  subscriptionId: { type: String, required: false, default: null },
  stripeCustomerId: { type: String, required: false, default: null, index: true },
  status: { type: String, required: false, default: UserStatus.INACTIVE },
  picture: { type: String, required: false, default: null },
  lastInsightGeneratedAt: { type: Date, required: false, default: null },
  skipAiGenerationGuardrails: { type: Boolean, required: false, default: false },
  createdAt: { type: Date, required: false, default: Date.now },
});

export const Profile = mongoose.models.Profile || mongoose.model<IProfile>("Profile", ProfileSchema);
