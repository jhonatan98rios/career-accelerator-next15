import { Schema, Document, model, Types, models } from "mongoose";

// ── Enums (moved from Persona; single source of truth is now this model) ──

export const CAREER_STAGE = ["entry", "mid", "senior", "lead", "executive"] as const;
export type CareerStage = (typeof CAREER_STAGE)[number];

export const EMPLOYMENT_STATUS = [
  "employed",
  "unemployed",
  "freelancer",
  "student",
  "retired",
] as const;
export type EmploymentStatus = (typeof EMPLOYMENT_STATUS)[number];

export const EDUCATION_LEVEL = [
  "high_school",
  "bootcamp",
  "bachelors",
  "masters",
  "phd",
  "other",
] as const;
export type EducationLevel = (typeof EDUCATION_LEVEL)[number];

export const LEARNING_STYLE = ["self_paced", "structured", "project_based", "mentorship"] as const;
export type LearningStyle = (typeof LEARNING_STYLE)[number];

export const LANGUAGE_PROFICIENCY = ["basic", "intermediate", "fluent", "native"] as const;
export type LanguageProficiency = (typeof LANGUAGE_PROFICIENCY)[number];

export const STUDY_SCHEDULE = [
  "mornings",
  "afternoons",
  "evenings",
  "weekends",
  "flexible",
] as const;
export type StudySchedule = (typeof STUDY_SCHEDULE)[number];

export const CONTENT_FORMAT = ["video", "text", "interactive", "audio"] as const;
export type ContentFormat = (typeof CONTENT_FORMAT)[number];

export const CAREER_MOTIVATION = [
  "salary",
  "growth",
  "impact",
  "stability",
  "flexibility",
  "passion",
] as const;
export type CareerMotivation = (typeof CAREER_MOTIVATION)[number];

export const SALARY_PERIOD = ["monthly", "yearly"] as const;
export type SalaryPeriod = (typeof SALARY_PERIOD)[number];

export const REMOTE_PREFERENCE = ["remote", "hybrid", "onsite", "flexible"] as const;
export type RemotePreference = (typeof REMOTE_PREFERENCE)[number];

// ── Sub-document types ─────────────────────────────────────────────────

export type UserLanguage = {
  language: string;
  proficiency: LanguageProficiency;
};

export type TargetSalary = {
  currency: string;
  amount: number;
  period: SalaryPeriod;
};

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
  // Career identity (moved from Persona)
  currentRole?: string;
  targetRole?: string;
  yearsOfExperience?: number;
  careerStage?: CareerStage;
  industries?: string[];
  employmentStatus?: EmploymentStatus;
  // Education
  educationLevel?: EducationLevel;
  fieldOfStudy?: string;
  certifications?: string[];
  currentlyStudying?: boolean;
  preferredLearningStyle?: LearningStyle;
  // Technical skills
  hardSkills?: string[];
  softSkills?: string[];
  languages?: UserLanguage[];
  tools?: string[];
  // Routine & availability
  weeklyStudyHours?: number;
  studySchedule?: StudySchedule;
  preferredContentFormat?: ContentFormat;
  // Goals & motivation
  shortTermGoal?: string;
  mediumTermGoal?: string;
  longTermGoal?: string;
  careerMotivation?: CareerMotivation;
  targetSalary?: TargetSalary;
  willingToRelocate?: boolean;
  remotePreference?: RemotePreference;
  // Job search
  jobSearchKeyword?: string;
  // Resume (structured AI artifact, persisted for reuse)
  resume?: Record<string, unknown>;
  resumeGeneratedAt?: Date;
  // Progress tracking
  completedRoadmaps?: number;
  insightsGenerated?: number;
  skillsGained?: string[];
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
    currentRole: { type: String, required: false },
    targetRole: { type: String, required: false },
    yearsOfExperience: { type: Number, required: false },
    careerStage: { type: String, enum: CAREER_STAGE, required: false },
    industries: { type: [String], required: false },
    employmentStatus: { type: String, enum: EMPLOYMENT_STATUS, required: false },
    educationLevel: { type: String, enum: EDUCATION_LEVEL, required: false },
    fieldOfStudy: { type: String, required: false },
    certifications: { type: [String], required: false },
    currentlyStudying: { type: Boolean, required: false },
    preferredLearningStyle: { type: String, enum: LEARNING_STYLE, required: false },
    hardSkills: { type: [String], required: false },
    softSkills: { type: [String], required: false },
    languages: {
      type: [
        {
          language: { type: String, required: true },
          proficiency: { type: String, enum: LANGUAGE_PROFICIENCY, required: true },
        },
      ],
      required: false,
      _id: false,
    },
    tools: { type: [String], required: false },
    weeklyStudyHours: { type: Number, required: false },
    studySchedule: { type: String, enum: STUDY_SCHEDULE, required: false },
    preferredContentFormat: { type: String, enum: CONTENT_FORMAT, required: false },
    shortTermGoal: { type: String, required: false },
    mediumTermGoal: { type: String, required: false },
    longTermGoal: { type: String, required: false },
    careerMotivation: { type: String, enum: CAREER_MOTIVATION, required: false },
    targetSalary: {
      type: {
        currency: { type: String, required: true },
        amount: { type: Number, required: true },
        period: { type: String, enum: SALARY_PERIOD, required: true },
      },
      required: false,
      _id: false,
    },
    willingToRelocate: { type: Boolean, required: false },
    remotePreference: { type: String, enum: REMOTE_PREFERENCE, required: false },
    jobSearchKeyword: { type: String, required: false },
    resume: { type: Schema.Types.Mixed, required: false },
    resumeGeneratedAt: { type: Date, required: false },
    completedRoadmaps: { type: Number, required: false, default: 0 },
    insightsGenerated: { type: Number, required: false, default: 0 },
    skillsGained: { type: [String], required: false },
  },
  { timestamps: true }
);

export const ProfessionalProfile =
  models.ProfessionalProfile ||
  model<IProfessionalProfile>("ProfessionalProfile", ProfessionalProfileSchema);
