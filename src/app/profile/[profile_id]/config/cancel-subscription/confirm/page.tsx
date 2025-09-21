import { redirect } from "next/navigation";
import { auth0 } from "@/lib/auth0";
import { connectDB } from "@/lib/db";
import { IProfile, Profile } from "@/models/Profile";
import { log, LogLevel } from "@/lib/logger";

export default async function ConfirmCancelPage() {
  const session = await auth0.getSession();
  if (!session) {
    redirect("/gateway");
  }

  // Check if the user exists on MongoDB
  await connectDB();

  const user = await Profile.findOne({ email: session.user.email }) as IProfile | null;

  if (!user) {
    redirect("/gateway");
  }

  await log(LogLevel.INFO, "ConfirmCancelPage: Cancelling subscription for user", { user });
  const res = await fetch(`https://api.mercadopago.com/preapproval/${user?.subscriptionId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}`,
    },
    body: JSON.stringify({
      "status": "cancelled",
    }),
  })

  const updatedSubscription = await res.json()

  if (!updatedSubscription) {
    redirect("/gateway");
  }

  if (updatedSubscription.status != "cancelled") {
    await log(LogLevel.ERROR, "ConfirmCancelPage: Subscription update failed", { user, updatedSubscription });
  }

  await log(LogLevel.INFO, "ConfirmCancelPage: Subscription cancelled", { user, updatedSubscription });

  return (
    <section className="min-h-96 flex items-center justify-center bg-gray-50">
      <div className="bg-white shadow-lg rounded-xl p-8 text-center space-y-4">
        <h1 className="text-2xl font-bold text-red-500">Assinatura cancelada</h1>
        <p className="text-gray-600">
          Sua assinatura foi cancelada com sucesso.
        </p>
      </div>
    </section>
  );
}