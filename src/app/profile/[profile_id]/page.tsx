import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionCached } from "@/lib/auth0";
import { connectDB } from "@/lib/db";
import { Profile } from "@/models/Profile";
import { CareerInsight } from "@/models/CarrerInsight";
import { CareerRoadmap } from "@/models/CareerRoadmap";
import { Persona } from "@/models/Persona";
import { RoadmapStatus } from "@/lib/enums";

export default async function Page() {
  const [session] = await Promise.all([getSessionCached(), connectDB()]);

  if (!session) {
    redirect("/auth/login?returnTo=/gateway");
  }

  const user = await Profile.findOne({ email: session.user.email });

  const latestInsight = await CareerInsight.findOne(
    { user_id: user._id },
    { "hero.title": 1, "hero.subtitle": 1, createdAt: 1, _id: 1 }
  ).sort({ createdAt: -1 });

  const persona = await Persona.findOne(
    { profile_id: user._id },
    { resume: 1, resumeGeneratedAt: 1 }
  ).lean() as { resume?: Record<string, unknown>; resumeGeneratedAt?: Date } | null;

  const roadmaps = await CareerRoadmap.find(
    { user_id: user._id },
    { title: 1, steps: 1, createdAt: 1, _id: 1 }
  )
    .sort({ createdAt: -1 })
    .lean();

  const serializedRoadmaps = roadmaps.map((r) => ({
    id: (r._id as { toString(): string }).toString(),
    title: r.title,
    total: r.steps.length,
    done: r.steps.filter((s: { status: string }) => s.status === RoadmapStatus.DONE).length,
    createdAt: r.createdAt,
  }));

  return (
    <div className="max-w-4xl mx-auto w-full space-y-6">
      <h1 className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-indigo-500">
        Dashboard
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Último Insight */}
        <DashboardCard
          title="Último Insight"
          icon="💡"
          href={latestInsight ? `/profile/${user.id}/output/${latestInsight._id}` : undefined}
          hrefLabel="Ver insight completo"
        >
          {latestInsight ? (
            <div className="space-y-2">
              <p className="font-semibold text-gray-800">{latestInsight.hero.title}</p>
              <p className="text-sm text-gray-500">{latestInsight.hero.subtitle}</p>
              <p className="text-xs text-gray-400">
                {latestInsight.createdAt.toLocaleDateString("pt-BR")}
              </p>
            </div>
          ) : (
            <EmptyCardBody
              text="Nenhum insight gerado ainda."
              href={`/profile/${user.id}/input`}
              linkLabel="Gerar insight"
            />
          )}
        </DashboardCard>

        {/* Currículo */}
        <DashboardCard
          title="Currículo"
          icon="📝"
          href={`/profile/${user.id}/resume`}
          hrefLabel={persona?.resume ? "Gerar novo currículo" : "Gerar currículo"}
        >
          {persona?.resume ? (
            <ResumeCardBody
              resume={persona.resume as Record<string, unknown>}
              date={persona.resumeGeneratedAt as Date | undefined}
            />
          ) : (
            <p className="text-sm text-gray-500">
              Gere um currículo otimizado com IA a partir da descrição da sua experiência profissional.
            </p>
          )}
        </DashboardCard>

        {/* Roadmaps */}
        <DashboardCard title="Roadmaps" icon="🗺️" className="md:col-span-2">
          {serializedRoadmaps.length > 0 ? (
            <ul className="space-y-4">
              {serializedRoadmaps.map((r) => {
                const pct = r.total > 0 ? Math.round((r.done / r.total) * 100) : 0;
                return (
                  <li key={r.id}>
                    <Link
                      href={`/profile/${user.id}/roadmaps/${r.id}`}
                      className="block p-3 rounded-lg border border-gray-200 hover:border-purple-300 hover:shadow-sm transition"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-medium text-gray-800 truncate">{r.title}</p>
                        <span className="ml-3 text-sm text-purple-500 font-semibold whitespace-nowrap">
                          {r.done}/{r.total} · {pct}%
                        </span>
                      </div>
                      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          style={{ width: `${pct}%` }}
                          className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full transition-all duration-500"
                        />
                      </div>
                      <p className="text-xs text-gray-400 mt-2">
                        {r.createdAt.toLocaleDateString("pt-BR")}
                      </p>
                    </Link>
                  </li>
                );
              })}
            </ul>
          ) : (
            <EmptyCardBody
              text="Nenhum roadmap criado ainda."
              href={`/profile/${user.id}/input`}
              linkLabel="Criar roadmap"
            />
          )}
        </DashboardCard>
      </div>
    </div>
  );
}

/* ── Internal helpers ─────────────────────────────────────── */

function DashboardCard({
  title,
  icon,
  children,
  href,
  hrefLabel,
  className = "",
}: {
  title: string;
  icon: string;
  children: React.ReactNode;
  href?: string;
  hrefLabel?: string;
  className?: string;
}) {
  return (
    <div className={`bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col ${className}`}>
      <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
        <span>{icon}</span>
        {title}
      </h2>
      <div className="flex-1">{children}</div>
      {href && hrefLabel && (
        <Link
          href={href}
          className="mt-4 self-start text-sm font-semibold text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-indigo-500 hover:opacity-80 transition"
        >
          {hrefLabel} →
        </Link>
      )}
    </div>
  );
}

function ResumeCardBody({
  resume,
  date,
}: {
  resume: Record<string, unknown>;
  date?: Date;
}) {
  const personal = resume.personal as Record<string, unknown> | undefined;
  const summary = typeof resume.summary === "string" ? resume.summary : null;
  const experience = Array.isArray(resume.experience) ? resume.experience.length : 0;
  const skills = resume.skills as Record<string, unknown[]> | undefined;
  const hardCount = skills?.hard?.length ?? 0;
  const softCount = skills?.soft?.length ?? 0;

  return (
    <div className="space-y-2">
      {personal?.name != null && (
        <p className="font-semibold text-gray-800">{String(personal.name)}</p>
      )}
      {summary && (
        <p className="text-sm text-gray-500 line-clamp-3">{summary}</p>
      )}
      <div className="flex gap-4 text-xs text-gray-400">
        {experience > 0 && <span>{experience} experiência{experience > 1 ? "s" : ""}</span>}
        {hardCount > 0 && <span>{hardCount} hard skill{hardCount > 1 ? "s" : ""}</span>}
        {softCount > 0 && <span>{softCount} soft skill{softCount > 1 ? "s" : ""}</span>}
      </div>
      {date && (
        <p className="text-xs text-gray-400">
          Gerado em {date.toLocaleDateString("pt-BR")}
        </p>
      )}
    </div>
  );
}

function EmptyCardBody({
  text,
  href,
  linkLabel,
}: {
  text: string;
  href: string;
  linkLabel: string;
}) {
  return (
    <div className="space-y-2">
      <p className="text-sm text-gray-400">{text}</p>
      <Link
        href={href}
        className="text-sm font-semibold text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-indigo-500 hover:opacity-80 transition"
      >
        {linkLabel} →
      </Link>
    </div>
  );
}
