import { redirect } from "next/navigation";
import { getUserFromCookie } from "@/lib/auth";

import { connectDB } from "@/lib/db";
import { CareerRoadmap } from "@/models/CareerRoadmap";
import { RoadmapStatus } from "@/lib/enums";
import { toggleStepStatus } from "@/app/actions/carrer_roadmap";
import { ReactElement, JSXElementConstructor, ReactNode, ReactPortal } from "react";
import { RoadmapStepCheckbox } from "@/components/roadmapStepCheckbox";



export default async function Page() {
  const user = await getUserFromCookie();

  if (!user) {
    redirect("/login");
  }

  await connectDB();

  // @ts-ignore
  const roadmapDoc : ICareerRoadmap = await CareerRoadmap.findOne(
    { user_id: user.id },
    { "title": 1, "_id": 1, "steps": 1, "createdAt": 1, "updatedAt": 1 }
  ).lean();

  const roadmap = JSON.parse(JSON.stringify(roadmapDoc));

  return (
    <div className="flex flex-col items-center w-full min-h-96">
      <h1 className="text-2xl mb-8 text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-indigo-500">Roadmap de carreira</h1>

      <h2 className="mb-8"> {roadmap.title} </h2>

      <ul className="flex flex-col w-92">
        {
          roadmap.steps.map((step: { _id: { toString: () => any; }; title: string; status: RoadmapStatus; description: string }) => {
            const id = step._id.toString()

            return (
            <div className="my-4" key={id}>
              <label htmlFor={id} className="flex">
                
                <RoadmapStepCheckbox
                  roadmapId={roadmap._id}
                  stepId={id}
                  done={step.status == RoadmapStatus.DONE}
                  key={id}
                />

                <h4 className="font-bold ml-2"> {step.title} </h4>
              </label>
              <p> {step.description} </p>
            </div>
          )
          })
        }
      </ul>
    </div>
  );
}