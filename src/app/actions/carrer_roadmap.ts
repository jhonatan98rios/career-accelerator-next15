"use server";

import { connectDB } from "@/lib/db";
import { CareerRoadmap } from "@/models/CareerRoadmap";
import { RoadmapStatus } from "@/lib/enums";
import { Types } from "mongoose";

export async function toggleStepStatus(roadmapId: string, stepId: string, checked: boolean) {
  await connectDB();

  await CareerRoadmap.updateOne(
    { _id: new Types.ObjectId(roadmapId), "steps._id": new Types.ObjectId(stepId) },
    { $set: { "steps.$.status": checked ? RoadmapStatus.DONE : RoadmapStatus.PENDING } }
  );
}
