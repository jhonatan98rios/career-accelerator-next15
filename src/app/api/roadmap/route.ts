import { NextResponse } from 'next/server';
import { generateInsight, InsightRequestInput } from '@/lib/openai';
import { connectDB } from "@/lib/db";
import { CareerInsight } from '@/models/CarrerInsight';
import { CareerRoadmap } from '@/models/CareerRoadmap';
import { RoadmapStatus } from '@/lib/enums';

export async function POST(req: Request) {

  try {
    const payload = await req.json();
    const { answers, manualDescription, profile_id } = payload as InsightRequestInput;

    if (!answers || !profile_id) {
      console.log("Missing required fields:")
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const json = await generateInsight({ answers, manualDescription, profile_id });

    if (!json) {
      return NextResponse.json({ error: 'Failed to generate insight' }, { status: 500 });
    }
    
    const data = JSON.parse(json);
    
    await connectDB();
    
    console.log("Creating career insight...")
    const newInsight = await CareerInsight.create({
      user_id: profile_id,
      ...data,
    });

    console.log("Creating roadmap...")
    await CareerRoadmap.create({
      user_id: profile_id,
      insight_id: newInsight._id,
      title: newInsight.roadmap.title,
      steps: newInsight.roadmap.steps.map((step: { step: string; title: string; description: string; }) => ({
        step: step.step,
        title: step.title,
        description: step.description,
        status: RoadmapStatus.PENDING
      }))
    })
    
    return NextResponse.json({ data: newInsight }, {status: 201});

  } catch (err: any) {
    console.error("Error in POST /careerInsight:", err);
    return NextResponse.json({ error: err.message || "Internal Server Error" }, { status: 500 });
  }
}
