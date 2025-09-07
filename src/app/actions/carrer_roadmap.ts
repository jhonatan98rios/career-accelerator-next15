"use server";

import { connectDB } from "@/lib/db"
import { CareerRoadmap } from "@/models/CareerRoadmap"
import { RoadmapStatus } from "@/lib/enums"
import { Types } from "mongoose"
import { auth0 } from "@/lib/auth0"
import { generateRoadmap } from "@/lib/llm"

export async function toggleStepStatus(roadmapId: string, stepId: string, checked: boolean) {
  const session = await auth0.getSession()
  if (!session) {
    throw new Error("Usuário não autenticado")
  }

  await connectDB()

  await CareerRoadmap.updateOne(
    { _id: new Types.ObjectId(roadmapId), "steps._id": new Types.ObjectId(stepId) },
    { $set: { "steps.$.status": checked ? RoadmapStatus.DONE : RoadmapStatus.PENDING } }
  )
}


export async function generateNextSteps(roadmapId: string) {
  const session = await auth0.getSession()
  if (!session) {
    throw new Error("Usuário não autenticado")
  }

  await connectDB()
  const roadmap = await CareerRoadmap.findById(
    roadmapId,
  )

  if (!roadmap) {
    throw new Error("Roadmap não encontrado")
  }

  const newRoadmap = await generateRoadmap(roadmap.steps)

  if (!newRoadmap) {
    throw new Error("Falha ao gerar novos passos")
  }

  const mergedRoadmap = [
    ...roadmap.steps,
    ...JSON.parse(newRoadmap)
  ]

  console.log("Updating roadmap...")
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