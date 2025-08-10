import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  plan: string;
  status: string;
  subscriptionId?: string;
  mercadoPagoSubscriptionId?: string;
  createdAt: Date;
}

const UserSchema = new Schema<IUser>({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  plan: { type: String, required: true },
  status: { type: String, default: 'inactive' },
  subscriptionId: { type: String, default: null },
  mercadoPagoSubscriptionId: { type: String, default: null },
  createdAt: { type: Date, default: Date.now },
});

export const User = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);