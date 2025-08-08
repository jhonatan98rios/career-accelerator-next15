import { redirect } from 'next/navigation';
import InsightForm from '@/components/insightForm';
import { getUserFromCookie } from '@/lib/auth';

export default async function Page() {
  const user = await getUserFromCookie();

  if (!user) {
    redirect('/login');
  }

  return <InsightForm {...user} />;
}
