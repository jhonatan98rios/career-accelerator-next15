"use server";

import { connectDB } from "@/lib/db";
import { CareerRoadmap } from "@/models/CareerRoadmap";
import { Persona } from "@/models/Persona";
import { RoadmapStatus } from "@/lib/enums";
import { Types } from "mongoose";
import { auth0 } from "@/lib/auth0";
import { log, LogLevel } from "@/lib/logger";

export async function toggleStepStatus(roadmapId: string, stepId: string, checked: boolean) {
  const session = await auth0.getSession();
  if (!session) {
    await log(LogLevel.ERROR, "toggleStepStatus: User authentication failed", { roadmapId });
    throw new Error("User authentication failed");
  }

  await connectDB();

  const roadmap = (await CareerRoadmap.findById(new Types.ObjectId(roadmapId), {
    "steps._id": 1,
    "steps.title": 1,
    user_id: 1,
  }).lean()) as { user_id: Types.ObjectId; steps: { _id: Types.ObjectId; title: string }[] } | null;

  if (!roadmap) {
    await log(LogLevel.ERROR, "toggleStepStatus: Roadmap not found", { roadmapId });
    throw new Error("Roadmap not found");
  }

  const step = roadmap.steps.find((s) => s._id.toString() === stepId);

  await log(LogLevel.INFO, "Updating step status", { roadmapId, stepId, checked });
  await CareerRoadmap.updateOne(
    { _id: new Types.ObjectId(roadmapId), "steps._id": new Types.ObjectId(stepId) },
    { $set: { "steps.$.status": checked ? RoadmapStatus.DONE : RoadmapStatus.PENDING } }
  );

  // CP-3: when marking DONE, add step title to persona skillsGained
  if (checked && step) {
    await Persona.findOneAndUpdate(
      { profile_id: roadmap.user_id },
      { $addToSet: { skillsGained: step.title } },
      { upsert: true }
    );
  }
}
