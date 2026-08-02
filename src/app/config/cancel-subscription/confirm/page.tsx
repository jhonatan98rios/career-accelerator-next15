import { redirect } from "next/navigation";
import { auth0 } from "@/lib/auth0";
import { connectDB } from "@/lib/db";
import { IProfile, Profile } from "@/models/Profile";
import { UserStatus } from "@/lib/enums";
import { log, LogLevel } from "@/lib/logger";
import { isDevelopment } from "@/lib/environment";
import { cancelSubscription } from "@/lib/subscription";
import { APP_URL } from "@/lib/constants";

export default async function ConfirmCancelPage() {
  const session = await auth0.getSession();
  if (!session) {
    redirect("/gateway");
  }

  await connectDB();

  const user = (await Profile.findOne({ email: session.user.email })) as IProfile | null;

  if (!user) {
    await log(LogLevel.WARN, "ConfirmCancelPage: user not found in DB, redirecting to gateway", {
      email: session.user.email,
    });
    redirect("/gateway");
  }

  // ponytail: dev bypass — no Stripe subscription to cancel, simulate immediate cancel
  if (isDevelopment) {
    await log(LogLevel.INFO, "Dev mode: simulating subscription cancellation", {
      email: user.email,
      previousStatus: user.status,
    });
    await Profile.findByIdAndUpdate(user._id, { status: UserStatus.INACTIVE });
    redirect(`/auth/logout?returnTo=${APP_URL}`);
  }

  if (!user.subscriptionId) {
    await log(LogLevel.ERROR, "ConfirmCancelPage: User has no subscriptionId", {
      userId: String(user._id),
      email: user.email,
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

  await log(LogLevel.INFO, "ConfirmCancelPage: Cancelling Stripe subscription for user", {
    email: user.email,
    subscriptionId: user.subscriptionId,
  });

  let stripeFailed = false;
  try {
    await cancelSubscription(user.subscriptionId!);
  } catch (error) {
    await log(LogLevel.ERROR, "ConfirmCancelPage: Stripe subscription update failed", {
      error,
      email: user.email,
      subscriptionId: user.subscriptionId,
    });
    stripeFailed = true;
  }

  if (stripeFailed) {
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

  await log(
    LogLevel.INFO,
    "ConfirmCancelPage: Stripe subscription cancellation requested, logging out",
    {
      email: user.email,
      subscriptionId: user.subscriptionId,
    }
  );

  redirect(`/auth/logout?returnTo=${APP_URL}`);
}
