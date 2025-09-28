import { CancelSubscriptionButton } from "@/components/cancelSubscriptionButton";
import DataUsageCheckbox from "@/components/dataUsageCheckbox";
import { LogoutButton } from "@/components/logoutButton";
import { getSessionCached } from "@/lib/auth0";
import { connectDB } from "@/lib/db";
import { Consent, ConsentEventStatus, IConsent } from "@/models/Consent";
import { IProfile, Profile } from "@/models/Profile";
import { ITerm, Term } from "@/models/Term";
import { redirect } from "next/navigation";

export default async function Terms() {

  // try {
  //   const version = '20250929' //new Date().toISOString().substring(0, 10).replaceAll("-", "");

  //   Term.create({
  //     version,
  //     link: `/terms/data-usage/${version}.pdf`,
  //   });
  // } catch (err) {
  //   console.log("err: ", err);
  // }

  const [session] = await Promise.all([
    getSessionCached(),
    connectDB()
  ])
  
  if (!session) {
    redirect("/auth/login?returnTo=/gateway");
  }

  const { email } = session.user

  if (!email) {
    redirect("/auth/login?returnTo=/gateway");
  }

  const term = (await Term.findOne({}, {}, { sort: { createdAt: -1 } })) as ITerm;
  const consent = await Consent.findOne({ 
    email, 
    currentVersion: term.version
  }) as IConsent | null

  return (
    <main className="bg-gray-50 text-gray-900 min-h-screen flex flex-col items-center justify-center px-6">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-2xl p-10 text-center space-y-6">
        {/* Título */}
        <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-indigo-500">
          Atualização do <br /> Termo de Uso de Dados
        </h1>

        {/* Subtítulo */}
        <p className="mt-6 text-gray-600">
          Desculpe por interromper sua navegação, <br /> mas nosso termo de uso de dados foi
          atualizado. <br />
          Para continuar utilizando nossa plataforma, <br /> pedimos que você leia e aceite o novo termo.
        </p>

        <p className="text-gray-700">
          *A recusa ao termo de dados impossibilitará a utilização da plataforma.
        </p>

        {/* Caixa com o checkbox */}
        <div className="mt-10 text-left">
          <DataUsageCheckbox 
            email={email} 
            version={term?.version!} 
            consent={consent?.status == ConsentEventStatus.AGREED}
            hasButton={true}
          />
        </div>

        {/* Logout */}
        <LogoutButton />

        {/* Cancel Subscription */}
        <CancelSubscriptionButton />
      </div>
    </main>
  );
}
