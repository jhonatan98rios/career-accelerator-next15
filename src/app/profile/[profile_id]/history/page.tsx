import Link from 'next/link'

function generateStaticParams() {}
 
interface PageProps {
  params: Promise<{
    profile_id: string
  }>
}

export default async function Page({ params }: PageProps) {

  const { profile_id } = await params

  return (
    <div className='flex flex-col items-center w-full justify-center h-screen'>
      <h1>Hello user {profile_id} to the History Page!</h1>

      <div className='flex flex-col gap-4 mt-8 text-center'>
        <Link href="/profile/1234/output/abcd"> Get new insights about career </Link>
      </div>
    </div>
  )
}