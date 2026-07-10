import { NextResponse } from "next/server";
import { generateInsight } from "@/lib/llm";
import { connectDB } from "@/lib/db";
import { CareerInsight, ICareerInsight } from "@/models/CarrerInsight";
import { CareerRoadmap } from "@/models/CareerRoadmap";
import { IPersona, Persona } from "@/models/Persona";
import { RoadmapStatus, UserStatus } from "@/lib/enums";
import { log, LogLevel } from "@/lib/logger";
import { HttpStatus } from "@/types/httpStatus";
import { isAuthenticated, AuthError } from "@/lib/auth0";
import { IProfile, Profile } from "@/models/Profile";
import { getInsightGuardrailState } from "@/lib/ai-generation-guardrails";

type RouteBody = {
  answers: Record<string, string>;
  manualDescription: string;
  profile_id: string;
};

export async function POST(req: Request) {
  try {
    const { sub } = await isAuthenticated(req.headers);

    await connectDB();

    const user = (await Profile.findOne({ externalAuthId: sub })) as IProfile | null;
    if (!user || user.status == UserStatus.INACTIVE)
      return NextResponse.json({}, { status: HttpStatus.UNAUTHORIZED });

    const payload: RouteBody = await req.json();
    const { answers, manualDescription, profile_id } = payload;

    if (!answers || !profile_id) {
      await log(LogLevel.ERROR, "POST /insight: Missing required fields", { payload });
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: HttpStatus.BAD_REQUEST }
      );
    }

    if (user.id !== profile_id) {
      await log(LogLevel.ERROR, "POST /insight: Profile mismatch", {
        profile_id,
        user_id: user.id,
      });
      return NextResponse.json({ error: "Profile mismatch" }, { status: HttpStatus.FORBIDDEN });
    }

    const guardrail = getInsightGuardrailState(user);

    if (!guardrail.canGenerate) {
      await log(LogLevel.WARN, "POST /insight: Insight generation locked", {
        profile_id,
        unlockAt: guardrail.unlockAt,
      });

      return NextResponse.json(
        {
          error: "A new insight will be available after the cooldown ends.",
          code: "INSIGHT_COOLDOWN",
          unlockAt: guardrail.unlockAt,
        },
        { status: HttpStatus.TOO_MANY_REQUESTS }
      );
    }

    const persona = (await Persona.findOne({ profile_id: user._id })) as IPersona | null;

    const json = await generateInsight({
      answers,
      manualDescription,
      persona,
    });

    if (!json) {
      await log(LogLevel.ERROR, "POST /insight: Failed to generate insight", { payload });
      return NextResponse.json(
        { error: "Failed to generate insight" },
        { status: HttpStatus.INTERNAL_SERVER_ERROR }
      );
    }

    const data: Omit<ICareerInsight, "user_id"> = JSON.parse(json);

    await log(LogLevel.INFO, "Creating career insight", {
      profile_id,
      hero_title: data.hero.title,
    });
    const newInsight: ICareerInsight = await CareerInsight.create({
      ...data,
      user_id: profile_id,
    });

    await log(LogLevel.INFO, "Creating career roadmap", { profile_id, insight_id: newInsight._id });
    const createdInsight = await CareerRoadmap.create({
      user_id: profile_id,
      insight_id: newInsight._id,
      title: newInsight.hero.title,
      steps: newInsight.roadmap.steps.map((step) => ({
        step: step.step,
        title: step.title,
        description: step.description,
        status: RoadmapStatus.PENDING,
      })),
    });

    if (!createdInsight) {
      await log(LogLevel.ERROR, "POST /insight: Failed to store the insight in the collection", {
        profile_id,
        insight_id: newInsight._id,
      });
    }

    user.lastInsightGeneratedAt = new Date();
    await user.save();

    // CP-2: populate persona from form answers + increment counters
    const jobSearchKeyword = deriveJobSearchKeyword(
      answers.dreamJob,
      splitCsv(answers.hardSkills),
      answers.currentRole
    );

    await Persona.findOneAndUpdate(
      { profile_id: user._id },
      {
        $set: {
          currentRole: answers.currentRole || undefined,
          targetRole: answers.dreamJob || undefined,
          yearsOfExperience: parseExperience(answers.experience),
          softSkills: splitCsv(answers.softSkills),
          hardSkills: splitCsv(answers.hardSkills),
          shortTermGoal: answers["1-year-goals"] || undefined,
          mediumTermGoal: answers["5-years-goals"] || undefined,
          longTermGoal: answers["10-years-goals"] || undefined,
          educationLevel: guessEducationLevel(answers.education),
          jobSearchKeyword,
        },
        $inc: { insightsGenerated: 1, completedRoadmaps: 1 },
      },
      { upsert: true }
    );

    return NextResponse.json({ data: newInsight }, { status: 201 });
  } catch (err: any) {
    if (err instanceof AuthError) {
      return NextResponse.json(
        { error: err.message, code: err.code },
        { status: HttpStatus.UNAUTHORIZED }
      );
    }
    await log(LogLevel.ERROR, "POST /insight: Exception occurred", { error: err });
    return NextResponse.json(
      { error: err.message || "Internal Server Error" },
      { status: HttpStatus.INTERNAL_SERVER_ERROR }
    );
  }
}

// ── answer-to-persona helpers ──────────────────────────────────────────

function splitCsv(value?: string): string[] | undefined {
  if (!value) return undefined;
  const parts = value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return parts.length ? parts : undefined;
}

function parseExperience(value?: string): number | undefined {
  if (!value) return undefined;
  const match = value.match(/(\d+)/);
  return match ? parseInt(match[1], 10) : undefined;
}

const EDUCATION_LEVEL_KEYWORDS: [string[], string][] = [
  [["phd", "doutorado", "doutor"], "phd"],
  [["mestrado", "masters", "master", "mba"], "masters"],
  [
    [
      "graduação",
      "graduacao",
      "bacharel",
      "bachelors",
      "faculdade",
      "universidade",
      "superior",
      "engenharia",
      "ciência",
      "ciencia",
      "administração",
    ],
    "bachelors",
  ],
  [["bootcamp"], "bootcamp"],
  [["ensino médio", "ensino medio", "colegial", "técnico", "tecnico"], "high_school"],
];

function deriveJobSearchKeyword(
  targetRole?: string,
  hardSkills?: string[],
  currentRole?: string
): string | undefined {
  const keyword = targetRole || hardSkills?.[0] || currentRole;
  if (!keyword) return undefined;
  // Extract the core term: take first word or hyphenated tech (e.g. "Engenheiro de Software" -> "engenheiro")
  return keyword.split(/[,/\s]+/)[0].toLowerCase();
}

function guessEducationLevel(value?: string): string | undefined {
  if (!value) return undefined;
  const lower = value.toLowerCase();
  for (const [keywords, level] of EDUCATION_LEVEL_KEYWORDS) {
    if (keywords.some((kw) => lower.includes(kw))) return level;
  }
  return undefined;
}
