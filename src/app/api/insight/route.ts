import { NextResponse } from 'next/server';
import { generateInsight } from '@/lib/llm';
import { connectDB } from "@/lib/db";
import { CareerInsight, ICareerInsight } from '@/models/CarrerInsight';
import { CareerRoadmap } from '@/models/CareerRoadmap';
import { RoadmapStatus, UserStatus } from '@/lib/enums';
import { log, LogLevel } from "@/lib/logger";
import { HttpStatus } from '@/types/httpStatus';
import { isAuthenticated } from '@/lib/auth0';
import { IProfile, Profile } from '@/models/Profile';
import { getInsightGuardrailState } from '@/lib/ai-generation-guardrails';

type RouteBody = {
  answers: Record<string, string>
  manualDescription: string
  profile_id: string
}

export async function POST(req: Request) {

  try {

    const { sub } = await isAuthenticated(req.headers)

    await connectDB();

    const user = await Profile.findOne({ externalAuthId: sub }) as IProfile | null;
    if (!user || user.status == UserStatus.INACTIVE) return NextResponse.json({}, { status: HttpStatus.UNAUTHORIZED });

    const payload: RouteBody = await req.json();
    const { answers, manualDescription, profile_id } = payload;

    if (!answers || !profile_id) {
      await log(LogLevel.ERROR, "POST /insight: Missing required fields", { payload });
      return NextResponse.json({ error: 'Missing required fields' }, { status: HttpStatus.BAD_REQUEST });
    }

    if (user.id !== profile_id) {
      await log(LogLevel.ERROR, "POST /insight: Profile mismatch", { profile_id, user_id: user.id });
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

    const json = await generateInsight({ answers, manualDescription });

    if (!json) {
      await log(LogLevel.ERROR, "POST /insight: Failed to generate insight", { payload });
      return NextResponse.json({ error: 'Failed to generate insight' }, { status: HttpStatus.INTERNAL_SERVER_ERROR });
    }
    
    const data: Omit<ICareerInsight, "user_id"> = JSON.parse(json);
    
    await log(LogLevel.INFO, "Creating career insight", { profile_id, hero_title: data.hero.title });
    const newInsight: ICareerInsight = await CareerInsight.create({
      ...data,
      user_id: profile_id,
    });

    await log(LogLevel.INFO, "Creating career roadmap", { profile_id, insight_id: newInsight._id });
    const createdInsight = await CareerRoadmap.create({
      user_id: profile_id,
      insight_id: newInsight._id,
      title: newInsight.hero.title,
      steps: newInsight.roadmap.steps.map(step => ({
        step: step.step,
        title: step.title,
        description: step.description,
        status: RoadmapStatus.PENDING
      }))
    })

    if (!createdInsight) {
      await log(LogLevel.ERROR, "POST /insight: Failed to store the insight in the collection", { profile_id, insight_id: newInsight._id });
    }

    user.lastInsightGeneratedAt = new Date();
    await user.save();
    
    return NextResponse.json({ data: newInsight }, { status: 201 });

  } catch (err: any) {
    await log(LogLevel.ERROR, "POST /insight: Exception occurred", { error: err });
    return NextResponse.json({ error: err.message || "Internal Server Error" }, { status: HttpStatus.INTERNAL_SERVER_ERROR });
  }
}
