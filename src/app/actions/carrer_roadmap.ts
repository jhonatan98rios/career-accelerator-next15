"use server";

import { connectDB } from "@/lib/db"
import { CareerRoadmap } from "@/models/CareerRoadmap"
import { RoadmapStatus } from "@/lib/enums"
import { Types } from "mongoose"
import { auth0 } from "@/lib/auth0"
import { generateRoadmap } from "@/lib/llm"
import { log, LogLevel } from "@/lib/logger"


export async function toggleStepStatus(roadmapId: string, stepId: string, checked: boolean) {
  
  const session = await auth0.getSession()
  if (!session) {
    await log(LogLevel.ERROR, "toggleStepStatus: User authentication failed", { roadmapId });
    throw new Error("User authentication failed")
  }

  await connectDB()
  
  await log(LogLevel.INFO, "Updating step status", { roadmapId, stepId, checked });
  await CareerRoadmap.updateOne(
    { _id: new Types.ObjectId(roadmapId), "steps._id": new Types.ObjectId(stepId) },
    { $set: { "steps.$.status": checked ? RoadmapStatus.DONE : RoadmapStatus.PENDING } }
  )
}


export async function generateNextSteps(roadmapId: string) {
  const session = await auth0.getSession()
  if (!session) {
    await log(LogLevel.ERROR, "generateNextSteps: User authentication failed", { roadmapId });
    throw new Error("User authentication failed")
  }

  await connectDB()
  const roadmap = await CareerRoadmap.findById(
    roadmapId,
  )

  if (!roadmap) {
    await log(LogLevel.ERROR, "generateNextSteps: Roadmap not found", { roadmapId });
    throw new Error("Roadmap not found")
  }

  const newRoadmap = await generateRoadmap(roadmap.steps)

  if (!newRoadmap) {
    await log(LogLevel.ERROR, "generateNextSteps: Failed to generate roadmap", { roadmapId });
    throw new Error("Failed to generate roadmap")
  }

  const mergedRoadmap = [
    ...roadmap.steps,
    ...JSON.parse(newRoadmap)
  ]

  await log(LogLevel.INFO, "Updating roadmap with new steps", { roadmapId, newStepsCount: JSON.parse(newRoadmap).length });
  const updatedRoadmap = await CareerRoadmap.findByIdAndUpdate(
    roadmapId,
    {
      $set: { 
        steps: mergedRoadmap.map((step: { step: string; title: string; description: string; status: RoadmapStatus }) => ({
          ...step,
          status: step.status || RoadmapStatus.PENDING,
        }))
      }
    },
    { new: true }
  )

  return JSON.parse(JSON.stringify(updatedRoadmap))
}