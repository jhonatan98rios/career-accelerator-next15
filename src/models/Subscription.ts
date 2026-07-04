import { Plan } from '@/lib/enums';
import mongoose, { Document, Schema } from 'mongoose';

export enum SubscriptionStatus {
  INCOMPLETE = "incomplete",
  INCOMPLETE_EXPIRED = "incomplete_expired",
  TRIALING = "trialing",
  ACTIVE = "active",
  PAST_DUE = "past_due",
  CANCELED = "canceled",
  UNPAID = "unpaid",
  PAUSED = "paused",
}

export interface ISubscription extends Document {
  email: string;
  profileId?: string;
  plan: Plan;
  status: SubscriptionStatus | string;
  stripeCustomerId: string;
  stripeSubscriptionId: string;
  stripeCheckoutSessionId?: string;
  stripePriceId?: string;
  currentPeriodStart?: Date;
  currentPeriodEnd?: Date;
  cancelAtPeriodEnd?: boolean;
  canceledAt?: Date;
  trialStart?: Date;
  trialEnd?: Date;
  latestInvoiceId?: string;
  lastStripeEventId?: string;
  processedStripeEventIds: string[];
  raw?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const SubscriptionSchema = new Schema<ISubscription>({
  email: { type: String, required: true, index: true },
  profileId: { type: String, required: false, default: null, index: true },
  plan: { type: String, required: true, default: Plan.BASIC },
  status: { type: String, required: true, index: true },
  stripeCustomerId: { type: String, required: true, index: true },
  stripeSubscriptionId: { type: String, required: true, unique: true, index: true },
  stripeCheckoutSessionId: { type: String, required: false, default: null, index: true },
  stripePriceId: { type: String, required: false, default: null },
  currentPeriodStart: { type: Date, required: false, default: null },
  currentPeriodEnd: { type: Date, required: false, default: null },
  cancelAtPeriodEnd: { type: Boolean, required: false, default: false },
  canceledAt: { type: Date, required: false, default: null },
  trialStart: { type: Date, required: false, default: null },
  trialEnd: { type: Date, required: false, default: null },
  latestInvoiceId: { type: String, required: false, default: null },
  lastStripeEventId: { type: String, required: false, default: null, index: true },
  processedStripeEventIds: { type: [String], required: false, default: [] },
  raw: { type: Schema.Types.Mixed, required: false, default: null },
}, { timestamps: true });

export const Subscription = mongoose.models.Subscription || mongoose.model<ISubscription>('Subscription', SubscriptionSchema);
