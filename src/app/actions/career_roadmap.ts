"use server";

import { connectDB } from "@/lib/db"
import { CareerRoadmap, } from "@/models/CareerRoadmap"
import { RoadmapStatus } from "@/lib/enums"
import { Types } from "mongoose"
import { auth0 } from "@/lib/auth0"
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