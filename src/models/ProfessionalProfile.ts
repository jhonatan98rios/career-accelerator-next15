import { Schema, Document, model, Types, models } from "mongoose";

// ── Experience item (middle section: "O que eu fiz") ──────────────────

export interface IExperienceItem {
  title: string;
  period: string;
  description: string;
}

// ── Main interface ─────────────────────────────────────────────────────

export interface IProfessionalProfile extends Document {
  profile_id: Types.ObjectId;
  /** "Quem sou eu" — running text, user-edited */
  who: string;
  /** Set true when the user manually saves `who` — blocks agent overwrite entirely */
  whoEditedByUser: boolean;
  /** "O que eu fiz" — list of experience items (title, period, description) */
  experience: IExperienceItem[];
  /** "O que eu pretendo fazer" — running text, user-edited */
  goals: string;
  /** Set true when the user manually saves `goals` — blocks agent overwrite entirely */
  goalsEditedByUser: boolean;
}

// ── Schema ─────────────────────────────────────────────────────────────

const ExperienceItemSchema = new Schema<IExperienceItem>(
  {
    title: { type: String, required: true, trim: true },
    period: { type: String, default: "", trim: true },
    description: { type: String, default: "", trim: true },
  },
  { _id: false }
);

const ProfessionalProfileSchema = new Schema<IProfessionalProfile>(
  {
    profile_id: {
      type: Schema.Types.ObjectId,
      ref: "Profile",
      required: true,
      unique: true,
      index: true,
    },
    who: { type: String, default: "" },
    whoEditedByUser: { type: Boolean, default: false },
    experience: { type: [ExperienceItemSchema], default: [] },
    goals: { type: String, default: "" },
    goalsEditedByUser: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const ProfessionalProfile =
  models.ProfessionalProfile ||
  model<IProfessionalProfile>("ProfessionalProfile", ProfessionalProfileSchema);
