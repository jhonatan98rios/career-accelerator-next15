import { getUserFromCookie } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function ProfileLayout({ children }: { children: React.ReactNode }) {
  const user = await getUserFromCookie()
  if (!user) {
    redirect('/login')
  }

  return <>{children}</>
}
