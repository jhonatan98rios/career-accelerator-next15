import { NextResponse } from 'next/server';
import { generateInsight } from '@/lib/llm';
import { connectDB } from "@/lib/db";
import { CareerInsight, ICareerInsight } from '@/models/CarrerInsight';
import { CareerRoadmap } from '@/models/CareerRoadmap';
import { RoadmapStatus } from '@/lib/enums';
import { log, LogLevel } from "@/lib/logger";
import { HttpStatus } from '@/types/httpStatus';

type RouteBody = {
  answers: Record<string, string>
  manualDescription: string
  profile_id: string
}

export async function POST(req: Request) {

  try {
    const payload: RouteBody = await req.json();
    const { answers, manualDescription, profile_id } = payload;

    if (!answers || !profile_id) {
      await log(LogLevel.ERROR, "POST /careerInsight: Missing required fields", { payload });
      return NextResponse.json({ error: 'Missing required fields' }, { status: HttpStatus.BAD_REQUEST });
    }

    const json = await generateInsight({ answers, manualDescription });

    if (!json) {
      await log(LogLevel.ERROR, "POST /careerInsight: Failed to generate insight", { payload });
      return NextResponse.json({ error: 'Failed to generate insight' }, { status: HttpStatus.INTERNAL_SERVER_ERROR });
    }
    
    const data: Omit<ICareerInsight, "user_id"> = JSON.parse(json);
    
    await connectDB();
    
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
      await log(LogLevel.ERROR, "POST /careerInsight: Failed to store the insight in the collection", { profile_id, insight_id: newInsight._id });
    }
    
    return NextResponse.json({ data: newInsight }, { status: 201 });

  } catch (err: any) {
    await log(LogLevel.ERROR, "POST /careerInsight: Exception occurred", { error: err });
    return NextResponse.json({ error: err.message || "Internal Server Error" }, { status: HttpStatus.INTERNAL_SERVER_ERROR });
  }
}
