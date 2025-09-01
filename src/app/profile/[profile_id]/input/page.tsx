import { redirect } from 'next/navigation';
import InsightForm from '@/components/insightForm';
import { connectDB } from '@/lib/db';
import { auth0 } from '@/lib/auth0';
import { Profile } from '@/models/Profile';

export default async function Page() {
  const session = await auth0.getSession();
  
  if (!session) {
    redirect("/auth/login?returnTo=/gateway");
  }

  // Check if the user exists on MongoDB
  await connectDB();

  const user = await Profile.findOne({ email: session.user.email });

  return <InsightForm {...JSON.parse(JSON.stringify(user))} />;
}
