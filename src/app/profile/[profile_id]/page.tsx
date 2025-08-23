import { redirect } from "next/navigation";
import { getUserFromCookie } from "@/lib/auth";

import { CareerInsight, ICareerInsight } from "@/models/CarrerInsight";
import { connectDB } from "@/lib/db";
import Link from "next/link";
import { User } from "@/store/UserContext";

export default async function Page() {
  const user = await getUserFromCookie();

  if (!user) {
    redirect("/login");
  }

  await connectDB();

  const insights: ICareerInsight[] = await CareerInsight.find(
    { user_id: user.id },
    { "hero.title": 1, "hero.subtitle": 1, "createdAt": 1, "_id": 1 }
  );

  return (
    <div className="flex flex-col items-center w-full h-96">
      <h1 className="text-2xl mb-8 text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-indigo-500">Insights de carreira</h1>
      {
        insights.length > 0
          ? <InsightsListRender insights={insights} user={user} />
          : <EmptyListDisclaimer user={user} />
      }
    </div>
  );
}

function InsightsListRender({ insights, user }: { insights: ICareerInsight[], user: User }) {
  return (
    <ul>
      {insights.map((insight, index) => (
        <InsighListItem insight={insight} user={user} key={index} />
      ))}
    </ul>
  )
}

function InsighListItem({ insight, user }: { insight: ICareerInsight; user: User }) {
  return (
    <li className="border border-purple-500 rounded-lg shadow-sm p-4 flex flex-col hover:shadow-md transition-shadow">
      <Link href={`/profile/${user.id}/output/${insight.id}/v4`}>
        <h4 className="text-lg font-semibold text-purple-500">{insight.hero.title}</h4>
      </Link>
      <p className="text-gray-700 mt-1">{insight.hero.subtitle}</p>
      <span className="text-gray-400 text-sm mt-2 self-end">
        {insight.createdAt.toLocaleDateString("pt-BR")}
      </span>
    </li>
  );
}

function EmptyListDisclaimer({ user }: { user: User }) {
  return (
    <div className="flex flex-col text-center items-center justify-center h-full">
      <h2 className="text-1xl text-gray-600">
        Seus insights de carreira aparecerão aqui. <br />
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