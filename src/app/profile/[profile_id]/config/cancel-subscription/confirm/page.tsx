import { redirect } from "next/navigation";
import { auth0 } from "@/lib/auth0";
import { connectDB } from "@/lib/db";
import { Profile } from "@/models/Profile";


export default async function ConfirmCancelPage() {
  const session = await auth0.getSession();
  if (!session) {
    redirect("/gateway");
  }

  // Check if the user exists on MongoDB
  await connectDB();

  const user = await Profile.findOne({ email: session.user.email });

  if (!user) {
    redirect("/gateway");
  }

  await fetch(`https://api.mercadopago.com/preapproval/${user?.subscriptionId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}`,
    },
    body: JSON.stringify({
      status: "cancelled",
    }),
  })

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