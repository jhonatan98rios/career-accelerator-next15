import mongoose, { Schema, Document } from "mongoose";

export interface IChatNotes extends Document {
  profileId: string;
  sessionId: string;
  notes: string;
  createdAt: Date;
  updatedAt: Date;
}

const ChatNotesSchema = new Schema<IChatNotes>(
  {
    profileId: { type: String, required: true, index: true },
    sessionId: { type: String, required: true },
    notes: { type: String, required: true, default: "" },
  },
  { timestamps: true }
);

ChatNotesSchema.index({ profileId: 1, sessionId: 1 }, { unique: true });

export const ChatNotes =
  mongoose.models.ChatNotes || mongoose.model<IChatNotes>("ChatNotes", ChatNotesSchema);
