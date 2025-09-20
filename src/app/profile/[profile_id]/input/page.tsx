// profile/[profile_id]/input/page.tsx
import { redirect } from 'next/navigation';
import InsightForm from '@/components/insightForm';
import { connectDB } from '@/lib/db';
import { getSessionCached } from '@/lib/auth0';


export default async function Page() {
  const [session] = await Promise.all([
    getSessionCached(),
    connectDB()
  ])
  
  if (!session) {
    redirect("/auth/login?returnTo=/gateway");
  }

  return <InsightForm />;
}
