import Link from 'next/link'
import { redirect } from 'next/navigation';
import { getUserFromCookie } from '@/lib/auth';


export default async function Page() {

  const user = await getUserFromCookie();

  if (!user) {
    redirect('/login');
  }

  return (
    <div className='flex flex-col items-center w-full justify-center h-screen'>
      <h1>Hello user {user?.name} to the History Page!</h1>

      <div className='flex flex-col gap-4 mt-8 text-center'>
        <Link href={`/profile/${user.id}/output/abcd`}> Get new insights about career </Link>
      </div>
    </div>
  )
}