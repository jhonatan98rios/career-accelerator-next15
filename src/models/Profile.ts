import { Plan, UserStatus } from '@/lib/enums';
import mongoose, { Schema, Document } from 'mongoose';

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
  externalAuthId?: string;
  subscriptionId?: string;
  createdAt: Date;
}

const ProfileSchema = new Schema<IProfile>({
  email: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true },
  cpf: { type: String, required: false, default: null },
  cep: { type: String, required: false, default: null },
  address: { type: String, required: false, default: null },
  address2: { type: String, required: false, default: null },
  plan: { type: String, required: true },
  externalAuthId: { type: String, required: true, unique: true },
  subscriptionId: { type: String, required: false, default: null },
  status: { type: String, required: false, default: UserStatus.INACTIVE },
  picture: { type: String, required: false, default: null },
  createdAt: { type: Date, required: false, default: Date.now },
});

export const Profile = mongoose.models.Profile || mongoose.model<IProfile>('Profile', ProfileSchema);