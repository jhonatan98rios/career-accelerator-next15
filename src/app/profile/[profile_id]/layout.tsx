import { getUserFromCookie } from "@/lib/auth";
import { redirect } from "next/navigation";
import SideBar from "@/components/sideBar";

type LayoutProps = {
  children: React.ReactNode;
  params: Promise<{ profile_id: string }>; // Adicione o parâmetro params
}

export default async function ProfileLayout({
  children,
  params
}: LayoutProps) {
  // Server-side auth check
  const user = await getUserFromCookie();

  // Get profile_id from url
  const { profile_id } = await params;

  console.log(profile_id)

  if (!user || user.id !== profile_id) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen bg-gray-50 text-gray-900">
      <SideBar user={user} tokens={25} />

      {/* Main content */}
      <main className="flex-1 md:ml-64 space-y-10">{children}</main>
    </div>
  );
}
