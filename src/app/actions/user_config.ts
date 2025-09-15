"use server";

import { connectDB } from "@/lib/db";
import { Profile } from "@/models/Profile";
import { auth0 } from "@/lib/auth0";
import { log, LogLevel } from "@/lib/logger"

export async function updateUserData(formData: FormData) {
  const session = await auth0.getSession();
  if (!session) {
    await log(LogLevel.ERROR, "updateUserData: User authentication failed", { formData });
    throw new Error("User authentication failed");
  }

  const name = formData.get("name") as string;

  if (!name || name.trim().length < 2) {
    await log(LogLevel.ERROR, "updateUserData: Invalid name", { formData, name });
    throw new Error("Invalid name");
  }

  await connectDB();
  await Profile.findOneAndUpdate(
    { email: session.user.email },
    { $set: { name } }
  );
}