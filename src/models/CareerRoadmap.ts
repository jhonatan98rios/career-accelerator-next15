import { RoadmapStatus } from '@/lib/enums'
import { Schema, Document, model, Types, models } from 'mongoose'


export interface IStep {
  _id: Types.ObjectId
  step: number
  title: string
  description: string
  status: RoadmapStatus
}

export interface ICareerRoadmap extends Document {
  _id: Types.ObjectId
  user_id: Types.ObjectId
  insight_id: Types.ObjectId
  title: string
  steps: IStep[]
  createdAt: Date
  updatedAt: Date
}

const CareerRoadmapSchema = new Schema<ICareerRoadmap>(
  {
    user_id: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    insight_id: { type: Schema.Types.ObjectId, ref: "CareerInsight", required: true },
    title: { type: String, required: true },
    steps: [
      {
        step: { type: Number, required: true },
        title: { type: String, required: true },
        description: { type: String, required: true },
        status: { type: String, default: RoadmapStatus.PENDING },
      },
    ],
  },
  {
    timestamps: true, // adds createdAt & updatedAt
  }
)

export const CareerRoadmap = models.CareerRoadmap || model<ICareerRoadmap>("CareerRoadmap", CareerRoadmapSchema)