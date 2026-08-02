"use server";

import { redirect } from "next/navigation";
import { getSessionCached } from "@/lib/auth0";
import { connectDB } from "@/lib/db";
import { Profile, IProfile } from "@/models/Profile";
import { Plan } from "@/lib/enums";
import { createSubscription } from "@/lib/subscription";
import { log, LogLevel } from "@/lib/logger";

// ponytail: server action for plan upgrade/downgrade via Stripe Checkout.
// Creates a new Checkout Session — Stripe handles subscription replacement.

export async function changePlan(plan: Plan) {
  const [session] = await Promise.all([getSessionCached(), connectDB()]);

  if (!session) {
    throw new Error("Not authenticated");
  }

  const { email } = session.user;
  const user = (await Profile.findOne({ email })) as IProfile | null;

  if (!user) {
    throw new Error("User not found");
  }

  if (user.plan === plan) {
    throw new Error("Already on this plan");
  }

  await log(LogLevel.INFO, "Plan change requested", {
    email,
    from: user.plan,
    to: plan,
    profileId: user._id.toString(),
  });

  const { checkoutUrl } = await createSubscription({
    plan,
    email: email ?? "",
    profileId: user._id.toString(),
    externalAuthId: user.externalAuthId,
    stripeCustomerId: user.stripeCustomerId,
  });

  redirect(checkoutUrl);
}
