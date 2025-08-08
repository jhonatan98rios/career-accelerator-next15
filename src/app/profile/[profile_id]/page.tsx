import { getUserFromCookie } from '@/lib/auth';
import Link from 'next/link';
import { redirect } from 'next/navigation';

interface PageProps {
  params: Promise<{
    profile_id: string
  }>
}

export default async function ProfilePage({ params }: PageProps) {
  const user = await getUserFromCookie();

  const { profile_id } = await params

  if (!user) {
    redirect('/login');
  }

  if (user.id !== profile_id) {
    // Optional: deny access to other users' profiles
    redirect('/not-authorized');
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-2">Welcome to your profile</h1>
      <p>User ID: {user.id}</p>
      <p>Email: {user.email}</p>

      <Link href={`/profile/${user.id}/input`} className="text-blue-500 hover:underline">
        Generate a new professional insight
      </Link>
    </div>
  );
}
