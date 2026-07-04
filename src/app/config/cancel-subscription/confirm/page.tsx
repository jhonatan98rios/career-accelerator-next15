import { redirect } from "next/navigation";
import { auth0 } from "@/lib/auth0";
import { connectDB } from "@/lib/db";
import { IProfile, Profile } from "@/models/Profile";
import { log, LogLevel } from "@/lib/logger";
import { cancelSubscription } from "@/lib/subscription";

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

  if (!user.subscriptionId) {
    await log(LogLevel.ERROR, "ConfirmCancelPage: User has no subscriptionId", { user });
    return (
      <section className="min-h-dvh flex items-center justify-center bg-gray-50">
        <div className="bg-white shadow-lg rounded-xl p-8 text-center space-y-4">
          <h1 className="text-2xl font-bold text-red-500">Erro ao cancelar sua assinatura</h1>
          <p className="text-gray-600">
            Tente novamente mais tarde, ou entre em contato pelo email plataforma@aceler-ai.com.
          </p>
        </div>
      </section>
    );
  }

  await log(LogLevel.INFO, "ConfirmCancelPage: Cancelling Stripe subscription for user", {
    email: user.email,
    subscriptionId: user.subscriptionId,
  });

  try {
    await cancelSubscription(user.subscriptionId!);
  } catch (error) {
    await log(LogLevel.ERROR, "ConfirmCancelPage: Stripe subscription update failed", {
      error,
      email: user.email,
      subscriptionId: user.subscriptionId,
    });

    return (
      <section className="min-h-dvh flex items-center justify-center bg-gray-50">
        <div className="bg-white shadow-lg rounded-xl p-8 text-center space-y-4">
          <h1 className="text-2xl font-bold text-red-500">Erro ao cancelar sua assinatura</h1>
          <p className="text-gray-600">
            Tente novamente mais tarde, ou entre em contato pelo email plataforma@aceler-ai.com.
          </p>
        </div>
      </section>
    );
  }

  await log(LogLevel.INFO, "ConfirmCancelPage: Stripe subscription cancellation requested", {
    email: user.email,
    subscriptionId: user.subscriptionId,
  });

  redirect("/auth/logout");

  return null
}
