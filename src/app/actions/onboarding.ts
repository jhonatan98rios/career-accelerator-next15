"use server";

import { connectDB } from "@/lib/db";
import { auth0 } from "@/lib/auth0";
import { Profile } from "@/models/Profile";
import { log, LogLevel } from "@/lib/logger";

export async function dismissOnboarding() {
  const session = await auth0.getSession();

  if (!session) {
    await log(LogLevel.ERROR, "dismissOnboarding: User authentication failed");
    throw new Error("User authentication failed");
  }

  await connectDB();

  await Profile.findOneAndUpdate(
    { email: session.user.email },
    { $set: { is_first_access: false } }
  );

  await log(LogLevel.INFO, "dismissOnboarding: Onboarding dismissed", {
    email: session.user.email,
  });

  return { success: true };
}
