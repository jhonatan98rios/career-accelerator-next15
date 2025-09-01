"use server";

import { connectDB } from "@/lib/db";
import { Profile } from "@/models/Profile";
import { auth0 } from "@/lib/auth0";

export async function updateUserData(formData: FormData) {
  const session = await auth0.getSession();
  if (!session) {
    throw new Error("Usuário não autenticado");
  }

  const name = formData.get("name") as string;

  if (!name || name.trim().length < 2) {
    throw new Error("Nome inválido");
  }

  await connectDB();
  await Profile.findOneAndUpdate(
    { email: session.user.email },
    { $set: { name } },
    { new: true }
  );
}