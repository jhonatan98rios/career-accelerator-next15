// profile/[profile_id]/input/page.tsx
import { redirect } from "next/navigation";
import InsightForm from "@/components/insightForm";
import FirstAccessWelcome from "@/components/firstAccessWelcome";
import { connectDB } from "@/lib/db";
import { getSessionCached } from "@/lib/auth0";
import { Profile } from "@/models/Profile";
import { getInsightGuardrailState } from "@/lib/ai-generation-guardrails";

export default async function Page() {
  const [session] = await Promise.all([getSessionCached(), connectDB()]);

  if (!session) {
    redirect("/auth/login?returnTo=/gateway");
  }

  const user = await Profile.findOne({ email: session.user.email });

  if (!user) {
    redirect("/auth/login?returnTo=/gateway");
  }

  const hasInsight = user.lastInsightGeneratedAt != null;

  return (
    <>
      {!hasInsight && <FirstAccessWelcome />}
      <InsightForm
        jwtToken={session.tokenSet.accessToken!}
        insightGuardrail={getInsightGuardrailState(user)}
        compact={!hasInsight}
      />
    </>
  );
}
