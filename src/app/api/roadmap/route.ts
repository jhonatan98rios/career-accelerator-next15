import { NextResponse } from 'next/server';
import { generateRoadmap } from '@/lib/llm';
import { connectDB } from "@/lib/db";
import { CareerRoadmap, ICareerRoadmap, IStep } from '@/models/CareerRoadmap';
import { RoadmapStatus } from '@/lib/enums';
import { log, LogLevel } from "@/lib/logger";
import { HttpStatus } from '@/types/httpStatus';

type RouteBody = {
  roadmapId: string
}

export async function POST(req: Request) {

  try {
    const payload: RouteBody = await req.json();
    const { roadmapId } = payload;

    if (!roadmapId) {
      await log(LogLevel.ERROR, "POST /roadmap: Missing required roadmapId");
      return NextResponse.json({ error: 'Missing required roadmapId' }, { status: HttpStatus.BAD_REQUEST });
    }

    await connectDB()
      
    const roadmap = await CareerRoadmap.findById(
      roadmapId,
    ).lean() as ICareerRoadmap | null
  
    if (!roadmap) {
      await log(LogLevel.ERROR, "POST /roadmap: Roadmap not found", { roadmapId });
      throw new Error("Roadmap not found")
    }
  
    const newRoadmap = await generateRoadmap(roadmap.steps)
  
    if (!newRoadmap) {
      await log(LogLevel.ERROR, "POST /roadmap: Failed to generate roadmap", { roadmapId });
      throw new Error("Failed to generate roadmap")
    }
  
    const mergedRoadmap: IStep[] = [
      ...roadmap.steps,
      ...JSON.parse(newRoadmap)
    ]
  
    await log(LogLevel.INFO, "Updating roadmap with new steps", { roadmapId, newStepsCount: JSON.parse(newRoadmap).length });
    const updatedRoadmap = await CareerRoadmap.findByIdAndUpdate(
      roadmapId,
      {
        $set: { 
          steps: mergedRoadmap.map(step => ({
            ...step,
            status: step.status || RoadmapStatus.PENDING,
          }))
        }
      },
      { new: true }
    ).lean() as ICareerRoadmap | null
  
    if (!updatedRoadmap) {
      await log(LogLevel.ERROR, "POST /roadmap: Failed to update the roadmap collection", { roadmapId, mergedRoadmap });
      throw new Error("Failed to update the roadmap collection")
    }
    
    return NextResponse.json({ updatedRoadmap }, { status: 201 });

  } catch (err: any) {
    await log(LogLevel.ERROR, "POST /roadmap: Exception occurred", { error: err });
    return NextResponse.json({ error: err.message || "Internal Server Error" }, { status: HttpStatus.INTERNAL_SERVER_ERROR });
  }
}
