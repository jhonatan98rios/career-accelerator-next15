import { redirect } from "next/navigation";
import { getUserFromCookie } from "@/lib/auth";

import { CareerInsight, ICareerInsight } from "@/models/CarrerInsight";
import { connectDB } from "@/lib/db";
import Link from "next/link";

export default async function Page() {
  const user = await getUserFromCookie();

  if (!user) {
    redirect("/login");
  }

  // ensure DB connection (singleton)
  await connectDB();

  // fetch insights for this user
  const insights: ICareerInsight[] = await CareerInsight.find(
    { user_id: user.id },
    { "hero.title": 1, "hero.subtitle": 1, "createdAt": 1, "_id": 1 }
  );

  return (
    <div className="flex flex-col items-center w-full">
      <h1 className="text-2xl mb-8">Your Career Insights</h1>
      <ul>
        {insights.map((insight, index) => (
          <li key={index} className="mb-2 flex flex-col">
            <Link href={`/profile/${user.id}/output/${insight.id}/v4`}>
              <strong>{insight.hero.title}</strong>
            </Link>
            <p>{insight.hero.subtitle}</p>
            <p className="ml-auto mr-0 mt-4">{insight.createdAt.toLocaleDateString('pt-BR')}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
