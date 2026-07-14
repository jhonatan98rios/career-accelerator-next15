import mongoose, { Schema, Document } from "mongoose";

// ponytail: nested chat block ready for future token/message counters, no migration needed
export interface IDailyUsage extends Document {
  profileId: string;
  date: string; // YYYY-MM-DD

  chat: {
    sessionsStarted: number;
  };

  createdAt: Date;
  updatedAt: Date;
}

const DailyUsageSchema = new Schema<IDailyUsage>(
  {
    profileId: { type: String, required: true, index: true },
    date: { type: String, required: true },

    chat: {
      sessionsStarted: { type: Number, required: true, default: 0 },
    },
  },
  { timestamps: true }
);

DailyUsageSchema.index({ profileId: 1, date: 1 }, { unique: true });

export const DailyUsage =
  mongoose.models.DailyUsage || mongoose.model<IDailyUsage>("DailyUsage", DailyUsageSchema);
