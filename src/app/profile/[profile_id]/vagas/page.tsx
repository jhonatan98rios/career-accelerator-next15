import { redirect } from "next/navigation";
import { connectDB } from "@/lib/db";
import { getSessionCached } from "@/lib/auth0";
import { Profile, IProfile } from "@/models/Profile";
import { Persona, IPersona } from "@/models/Persona";
import VagaSearch from "@/components/vagaSearch";

export default async function Page() {
  const [session] = await Promise.all([getSessionCached(), connectDB()]);

  if (!session) {
    redirect("/auth/login?returnTo=/gateway");
  }

  const user = (await Profile.findOne({ email: session.user.email })) as IProfile | null;
  if (!user) {
    redirect("/auth/login?returnTo=/gateway");
  }

  const persona = (await Persona.findOne({ profile_id: user._id })) as IPersona | null;

  return <VagaSearch initialKeyword={persona?.jobSearchKeyword ?? null} />;
}
