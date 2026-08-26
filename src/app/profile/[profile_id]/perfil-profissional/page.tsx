import { redirect } from "next/navigation";
import { connectDB } from "@/lib/db";
import { getSessionCached } from "@/lib/auth0";
import { Profile } from "@/models/Profile";
import { ProfessionalProfile, IProfessionalProfile } from "@/models/ProfessionalProfile";
import ProfileSections from "./ProfileSections";

export default async function Page() {
  const [session] = await Promise.all([getSessionCached(), connectDB()]);

  if (!session) {
    redirect("/auth/login?returnTo=/gateway");
  }

  const user = await Profile.findOne({ email: session.user.email });

  if (!user) {
    redirect("/auth/login?returnTo=/gateway");
  }

  const doc = (await ProfessionalProfile.findOne({
    profile_id: user._id,
  }).lean()) as IProfessionalProfile | null;

  const sections = {
    who: doc?.who ?? "",
    experience: Array.isArray(doc?.experience) ? doc.experience : [],
    goals: doc?.goals ?? "",
  };

  return <ProfileSections initial={sections} />;
}
