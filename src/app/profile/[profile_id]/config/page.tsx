// app/settings/page.tsx
import { redirect } from "next/navigation";
import { getSessionCached } from "@/lib/auth0";
import { connectDB } from "@/lib/db";
import { Profile } from "@/models/Profile";
import { updateUserData } from "@/app/actions/user_config";
import { LogoutButton } from "@/components/logoutButton";
import { CancelSubscriptionButton } from "@/components/cancelSubscriptionButton";

export default async function Page() {

  const [session] = await Promise.all([
    getSessionCached(),
    connectDB()
  ])

  if (!session) {
    redirect("/auth/login?returnTo=/gateway");
  }

  const user = await Profile.findOne({ email: session.user.email });

  return (
    <main className="bg-gray-50 text-gray-900 min-h-screen">

      {/* Formulário */}
      <section className="container mx-auto px-6 py-12 max-w-2xl">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-8">
          Ajuste as informações da sua conta
        </h2>

        <form 
          className="bg-white shadow-lg rounded-2xl p-8 space-y-6 border"
          action={updateUserData}
        >
          {/* Nome */}
          <div>
            <label
              htmlFor="user-name"
              className="block text-sm font-semibold text-gray-700 mb-2"
            >
              Nome
            </label>
            <input
              id="user-name"
              name="name"
              type="text"
              defaultValue={user?.name ?? ""}
              className="w-full border border-gray-300 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          {/* Email (read-only) */}
          <div>
            <label
              htmlFor="user-email"
              className="block text-sm font-semibold text-gray-700 mb-2"
            >
              Email
            </label>
            <input
              id="user-email"
              type="email"
              value={user?.email ?? ""}
              readOnly
              className="w-full border border-gray-200 rounded-xl px-4 py-2 bg-gray-100 text-gray-500 cursor-not-allowed"
            />
          </div>

          {/* Botões */}
          <div className="flex justify-end gap-4">
            <button
              type="reset"
              className="flex-1 w-0 px-6 py-2 rounded-xl border border-gray-300 text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 w-0 px-6 py-2 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-bold hover:scale-105 transition-transform cursor-pointer"
            >
              Salvar
            </button>
          </div>

          
          {/* Logout */}
          <LogoutButton />

          {/* Cancel Subscription */}
          <CancelSubscriptionButton />
        </form>


      </section>
    </main>
  );
}
