import mongoose, { Schema, Document } from "mongoose";

export interface IChatSession extends Document {
  profileId: string;
  sessionId: string;

  tokenLimit: number;

  promptTokens: number;
  completionTokens: number;
  totalTokens: number;

  createdAt: Date;
  updatedAt: Date;
}

const ChatSessionSchema = new Schema<IChatSession>(
  {
    profileId: { type: String, required: true, index: true },
    sessionId: { type: String, required: true },

    tokenLimit: { type: Number, required: true },

    promptTokens: { type: Number, required: true, default: 0 },
    completionTokens: { type: Number, required: true, default: 0 },
    totalTokens: { type: Number, required: true, default: 0 },
  },
  { timestamps: true }
);

ChatSessionSchema.index({ profileId: 1, sessionId: 1 }, { unique: true });

export const ChatSession =
  mongoose.models.ChatSession || mongoose.model<IChatSession>("ChatSession", ChatSessionSchema);
