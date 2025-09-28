import mongoose, { Schema, Document } from 'mongoose';

export interface ITerm extends Document {
  createdAt: Date
  version: string
  link: string
}

const TermSchema = new Schema<ITerm>({
    createdAt: { type: Date, required: false, default: Date.now, unique: true },
    version: { type: String, required: true, unique: true },
    link: { type: String, required: true, unique: true },
});

export const Term = mongoose.models.Term || mongoose.model<ITerm>('Term', TermSchema);