import mongoose, { Schema, Document } from 'mongoose';

export enum SubscriptionStatus {
  PENDING = "pending",
  CANCELLED = "cancelled",
  AUTHORIZED = "authorized"
}

export interface ISubscription extends Document {
  id: string;
	payer_id: number;
	payer_email: string;
	back_url: string;
	collector_id: number;
	application_id: number;
	status: SubscriptionStatus;
	reason: string;
	external_reference: string;
	date_created: string;
	last_modified: string;
	init_point: string;
	auto_recurring: {
		frequency: number;
		frequency_type: string;
		transaction_amount: number;
		currency_id: string;
		start_date: string;
		end_date: string;
		free_trial: any;
	};
	summarized: {
		quotas: number;
		charged_quantity: number | null;
		pending_charge_quantity: number;
		charged_amount: number | null;
		pending_charge_amount: number;
		semaphore: any;
		last_charged_date: string | null;
		last_charged_amount: number | null;
	};
	next_payment_date: string;
	payment_method_id: string | null;
	payment_method_id_secondary: string | null;
	first_invoice_offset: number | null;
	subscription_id: string;
	owner: any;
}


const AutoRecurringSchema = new mongoose.Schema({
  frequency: Number,
  frequency_type: String,
  transaction_amount: Number,
  currency_id: String,
  start_date: Date,
  end_date: Date,
  free_trial: mongoose.Schema.Types.Mixed
}, { _id: false });

const SummarizedSchema = new mongoose.Schema({
  quotas: Number,
  charged_quantity: Number,
  pending_charge_quantity: Number,
  charged_amount: Number,
  pending_charge_amount: Number,
  semaphore: mongoose.Schema.Types.Mixed,
  last_charged_date: Date,
  last_charged_amount: Number
}, { _id: false });

const SubscriptionSchema = new mongoose.Schema({
  id: String,
  payer_id: Number,
  payer_email: String,
  back_url: String,
  collector_id: Number,
  application_id: Number,
  status: String,
  reason: String,
  external_reference: String,
  date_created: Date,
  last_modified: Date,
  init_point: String,
  auto_recurring: AutoRecurringSchema,
  summarized: SummarizedSchema,
  next_payment_date: Date,
  payment_method_id: mongoose.Schema.Types.Mixed,
  payment_method_id_secondary: mongoose.Schema.Types.Mixed,
  first_invoice_offset: mongoose.Schema.Types.Mixed,
  subscription_id: String,
  owner: mongoose.Schema.Types.Mixed
});

export const Subscription = mongoose.models.Subscription || mongoose.model<ISubscription>('Subscription', SubscriptionSchema);