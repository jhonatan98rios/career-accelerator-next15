
import mongoose, { Schema, Document } from 'mongoose';

export enum ConsentEventStatus {
  DISAGREED = 'disagreed',
  AGREED = 'agreed',
}

type ConsentEvent = {
  createdAt: Date;
  status: ConsentEventStatus;
}

export interface IConsent extends Document {
  email: string;
  createdAt: Date;
  updatedAt: Date;
  currentVersion: string
  status: ConsentEventStatus
  events: ConsentEvent[]
}

const ConsentEventSchema = new Schema<ConsentEvent>({
  createdAt: { type: Date, required: true },
  status: { type: String, enum: Object.values(ConsentEventStatus), required: true }
})

const ConsentSchema = new Schema<IConsent>({
  email: { type: String, required: true, unique: true, index: true },
  currentVersion: { type: String, required: true },
  status: { type: String, enum: Object.values(ConsentEventStatus), required: true },
  events: {
    type: [ConsentEventSchema],
    default: []
  }
}, { timestamps: true });

export const Consent = mongoose.models.Consent || mongoose.model<IConsent>('Consent', ConsentSchema);