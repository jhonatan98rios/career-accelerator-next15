import { redirect } from "next/navigation";
import { connectDB } from "@/lib/db";
import { getSessionCached } from "@/lib/auth0";
import { Profile } from "@/models/Profile";
import ResumeGenerator from "./ResumeGenerator";

export default async function Page() {
  const [session] = await Promise.all([getSessionCached(), connectDB()]);

  if (!session) {
    redirect("/auth/login?returnTo=/gateway");
  }

  const user = await Profile.findOne({ email: session.user.email });

  if (!user) {
    redirect("/auth/login?returnTo=/gateway");
  }

  return <ResumeGenerator jwtToken={session.tokenSet.accessToken!} />;
}
