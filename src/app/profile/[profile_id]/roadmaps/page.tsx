import { redirect } from "next/navigation";
import { getUserFromCookie } from "@/lib/auth";

import { connectDB } from "@/lib/db";
import Link from "next/link";
import { User } from "@/store/UserContext";
import { CareerRoadmap, ICareerRoadmap } from "@/models/CareerRoadmap";
import { RoadmapStatus } from "@/lib/enums";

type SerializedRoadmap = {
  id: string
  title: string
  steps: {
    step: number
    title: string
    description: string
    status: RoadmapStatus
  }[]
  createdAt: Date
  updatedAt: Date
}

export default async function Page() {
  const user = await getUserFromCookie();

  if (!user) {
    redirect("/login");
  }

  await connectDB();

  // @ts-ignore
  const roadmaps: ICareerRoadmap[] = await CareerRoadmap.find(
    { user_id: user.id },
    { "title": 1, "_id": 1, "steps": 1, "createdAt": 1, "updatedAt": 1 }
  ).lean();

  const serializedRoadmaps: SerializedRoadmap[] = roadmaps.map(roadmap => ({
    ...roadmap,
    id: (roadmap._id as string | { toString(): string }).toString(),
    progress: roadmap.steps.filter(step => step.status == RoadmapStatus.DONE).length,
  }))

  return (
    <div className="flex flex-col items-center w-full min-h-96">
      <h1 className="text-2xl mb-8 text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-indigo-500">Roadmaps de carreira</h1>
      {
        serializedRoadmaps.length > 0
          ? <RoadmapListRender roadmaps={serializedRoadmaps} user={user} />
          : <EmptyListDisclaimer user={user} />
      }
    </div>
  );
}

function RoadmapListRender({ roadmaps, user }: { roadmaps: SerializedRoadmap[], user: User }) {
  return (
    <ul>
      {roadmaps.map((roadmap, index) => (
        <RoadmapListItem roadmap={roadmap} user={user} key={index} />
      ))}
    </ul>
  )
}

function RoadmapListItem({ roadmap, user }: { roadmap: SerializedRoadmap; user: User }) {
  return (
    <li className="border w-full border-purple-500 rounded-lg shadow-sm p-4 flex flex-col hover:shadow-md transition-shadow mb-4">
      <Link href={`/profile/${user.id}/roadmaps/${roadmap.id}`}>
        <h4 className="text-lg font-semibold text-purple-500">{roadmap.title}</h4>
      </Link>
      <span className="text-gray-400 text-sm mt-2 self-end">
        {roadmap.createdAt.toLocaleDateString("pt-BR")}
      </span>
    </li>
  );
}

function EmptyListDisclaimer({ user }: { user: User }) {
  return (
    <div className="flex flex-col text-center items-center justify-center h-full">
      <h2 className="text-1xl text-gray-600">
        Seus roadmaps de carreira aparecerão aqui. <br />
      </h2>
      <Link
        href={`/profile/${user.id}/input/`}
        className="mt-2 text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-indigo-500"
      >
        Clique aqui para começar
      </Link>
    </div>
  )
}