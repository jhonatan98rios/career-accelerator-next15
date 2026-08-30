import { redirect } from "next/navigation";
import { connectDB } from "@/lib/db";
import { getSessionCached } from "@/lib/auth0";
import { Profile, IProfile } from "@/models/Profile";
import { IProfessionalProfile, ProfessionalProfile } from "@/models/ProfessionalProfile";
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

  const professionalProfile = (await ProfessionalProfile.findOne({
    profile_id: user._id,
  })) as IProfessionalProfile | null;

  return <VagaSearch initialKeyword={professionalProfile?.jobSearchKeyword ?? null} />;
}
