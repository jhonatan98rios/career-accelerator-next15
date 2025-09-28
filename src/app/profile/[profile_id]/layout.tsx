import { redirect } from "next/navigation";
import SideBar from "@/components/sideBar";
import Header from "@/components/header";
import { auth0 } from '@/lib/auth0';
import { connectDB } from "@/lib/db";
import { Profile } from "@/models/Profile";
import { ITerm, Term } from "@/models/Term";
import { Consent, ConsentEventStatus, IConsent } from "@/models/Consent";
import { log, LogLevel } from "@/lib/logger";

type LayoutProps = {
  children: React.ReactNode;
  params: Promise<{ profile_id: string }>; // Adicione o parâmetro params
}

export default async function ProfileLayout({
  children,
  params
}: LayoutProps) {
  const session = await auth0.getSession();
  const { profile_id } = await params;

  if (!session) {
    redirect("/auth/login?returnTo=/gateway");
  }

  await connectDB();

  const { email } = session.user
  const user = await Profile.findOne({ email });
  
  if (!user || user.id !== profile_id) {
    await log(LogLevel.INFO, "ProfileLayout: User not found", { email })
    redirect("/auth/login?returnTo=/gateway");
  }
  
  const term = (await Term.findOne({}, {}, { sort: { createdAt: -1 } })) as ITerm;
  const consent = await Consent.findOne({ 
    email, 
    currentVersion: term.version
  }) as IConsent | null

  if (!consent || consent?.status != ConsentEventStatus.AGREED) {
    await log(LogLevel.INFO, "ProfileLayout: Consent not found", { email, version: term.version })
    redirect("/gateway");
  }

  return (
    <div className="flex flex-col min-h-screen h-full bg-gray-50 text-gray-900">
      <Header />
      <div className="flex">
        <SideBar id={user._id.toString()} tokens={25} />

        {/* Main content */}
        <main className="flex-1 mx-8 md:ml-80 md:mr-14 lg:ml-96 lg:mr-20 mt-60 md:mt-30 mb-20 space-y-10">
          {children}
        </main>
      </div>
    </div>
  );
}
