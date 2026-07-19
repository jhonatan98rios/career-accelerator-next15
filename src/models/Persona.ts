import { Schema, Document, model, Types, models } from "mongoose";

// ── Enums ──────────────────────────────────────────────────────────────

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

// ── Main interface ─────────────────────────────────────────────────────

export interface IPersona extends Document {
  profile_id: Types.ObjectId;
  // Career identity
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
  // Resume (estruturado, persistido para reuso)
  resume?: Record<string, unknown>;
  resumeGeneratedAt?: Date;
  // Progress tracking
  completedRoadmaps?: number;
  insightsGenerated?: number;
  skillsGained?: string[];
  lastRoleChange?: Date;
}

// ── Schema ─────────────────────────────────────────────────────────────

const PersonaSchema = new Schema<IPersona>(
  {
    profile_id: {
      type: Schema.Types.ObjectId,
      ref: "Profile",
      required: true,
      unique: true,
      index: true,
    },
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
    completedRoadmaps: { type: Number, required: false, default: 0 },
    insightsGenerated: { type: Number, required: false, default: 0 },
    skillsGained: { type: [String], required: false },
    jobSearchKeyword: { type: String, required: false },
    resume: { type: Schema.Types.Mixed, required: false },
    resumeGeneratedAt: { type: Date, required: false },
    lastRoleChange: { type: Date, required: false },
  },
  { timestamps: true }
);

export const Persona = models.Persona || model<IPersona>("Persona", PersonaSchema);
