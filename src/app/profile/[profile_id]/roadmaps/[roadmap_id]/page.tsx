// profile/[profile_id]/roadmaps/[roadmap_id]/page.tsx
import { redirect } from "next/navigation";
import { connectDB } from "@/lib/db";
import { CareerRoadmap, ICareerRoadmap } from "@/models/CareerRoadmap";
import { RoadmapStatus } from "@/lib/enums";
import { RoadmapStepCheckbox, RoadmapUpdateButton } from "@/components/roadmap";
import { getSessionCached } from "@/lib/auth0";
import { Profile } from "@/models/Profile";
import { ConfettiOnComplete } from "@/components/confetti";
import { ProgressBar } from "@/components/progressBar";

interface PageProps {
  params: Promise<{
    profile_id: string;
    roadmap_id: string;
  }>;
}

export default async function Page({ params }: PageProps) {

  const [session] = await Promise.all([
    getSessionCached(),
    connectDB()
  ])

  if (!session) {
    redirect("/auth/login?returnTo=/gateway");
  }

  const user = await Profile.findOne({ email: session.user.email });

  const { roadmap_id } = await params;

  // @ts-ignore
  const roadmapDoc: ICareerRoadmap = await CareerRoadmap.findOne(
    { _id: roadmap_id },
    { title: 1, _id: 1, steps: 1, createdAt: 1, updatedAt: 1 }
  ).lean();

  if (!roadmapDoc) {
    redirect(`/profile/${user.id}/roadmaps`);
  }

  const roadmap: ICareerRoadmap = JSON.parse(JSON.stringify(roadmapDoc));

  return (
    <div className="flex flex-col items-center w-full min-h-screen px-6 py-12 bg-gray-50">
      <h1 className="text-3xl font-extrabold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-indigo-500">
        Roadmap de carreira
      </h1>

      <h2 className="text-lg text-gray-700 mb-10">{roadmap.title}</h2>

      <ul className="flex flex-col gap-6 w-full">
        {roadmap.steps.map(step => {
            const id = step._id.toString();

            return (
              <li
                key={id}
                className="p-6 bg-white rounded-2xl shadow-md border border-gray-100 hover:shadow-lg transition"
              >
                <label htmlFor={id} className="flex items-start gap-3 cursor-pointer">
                  <RoadmapStepCheckbox
                    roadmapId={roadmap._id.toString()}
                    stepId={id}
                    done={step.status == RoadmapStatus.DONE}
                    key={id}
                  />
                  <div>
                    <h4 className="text-lg font-semibold text-gray-800">
                      {step.title}
                    </h4>
                    <p className="text-gray-600 text-sm mt-1">
                      {step.description}
                    </p>
                  </div>
                </label>
              </li>
            );
          }
        )}
      </ul>

      <ProgressBar
        progress={
          Math.round(
            (
              roadmap
                .steps
                .filter(
                  (step) => step.status === RoadmapStatus.DONE
                ).length / roadmap.steps.length
            ) * 100
          )
        }
      />

      {
        roadmap
          .steps
          .every((step) => step.status === RoadmapStatus.DONE) && (
            <RoadmapUpdateButton roadmapId={roadmap._id.toString() } />
          )
      }

      <ConfettiOnComplete 
        allDone={
          roadmap
            .steps
            .every((step) => step.status === RoadmapStatus.DONE)
        } 
      />
      
    </div>
  );
}
