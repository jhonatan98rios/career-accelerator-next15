"use server";

import { connectDB } from "@/lib/db";
import { CareerRoadmap } from "@/models/CareerRoadmap";
import { RoadmapStatus } from "@/lib/enums";
import { Types } from "mongoose";
import { auth0 } from "@/lib/auth0";

export async function toggleStepStatus(roadmapId: string, stepId: string, checked: boolean) {
  const session = await auth0.getSession();
  if (!session) {
    throw new Error("Usuário não autenticado");
  }

  await connectDB();

  await CareerRoadmap.updateOne(
    { _id: new Types.ObjectId(roadmapId), "steps._id": new Types.ObjectId(stepId) },
    { $set: { "steps.$.status": checked ? RoadmapStatus.DONE : RoadmapStatus.PENDING } }
  );
}
