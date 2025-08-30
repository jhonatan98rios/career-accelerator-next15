// Check if the user has an active subscription (subscriptionId, status and plan)
// If not, create a new subscription with MercadoPago and send an email with the payment link

// If the user has an inactive subscription, show a message to the user and send an email with the payment link

// If the user has an active subscription, redirect to the dashboard

import { auth0 } from '@/lib/auth0';
import { connectDB } from '@/lib/db';
import { UserStatus } from '@/lib/enums';
import { User } from '@/models/User';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { GatewayForm } from './form';
import { Profile } from '@/models/Profile';
import { createSubscription } from '@/lib/subscription';
import { sendPaymentEmail } from '@/lib/emailService';

export default async function ProfilePage() {
  const session = await auth0.getSession();

  if (!session) {
    return <p>Usuário não autenticado</p>;
  }

  const user = session.user;

  // Check if the user exists on MongoDB
  await connectDB();

  const userFromDB = await Profile.findOne({ email: user.email });

  // Improve the validation below
  if (userFromDB && userFromDB.status === UserStatus.ACTIVE) {
    redirect('/profile/' + userFromDB._id)
  }

  if (userFromDB && userFromDB.status === UserStatus.INACTIVE) {

    console.log("Creating a new subscription...")
    const subscription = await createSubscription({
      plan: userFromDB.plan,
      email: user.email!,
    })
    
    console.log("Sending a new e-mail...")
    await sendPaymentEmail({
      name: user.name!,
      to: user.email!,
      plan: userFromDB.plan,
      paymentLink: subscription.init_point
    })

    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 p-4">
        <div className="bg-white p-6 rounded-xl shadow-md w-full max-w-lg text-center">
          <h1 className="text-3xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-indigo-500">Conta Inativa</h1>
          <p className="mb-4 text-gray-700">
            Sua conta está inativa devido a problemas no pagamento. <br />
            Te enviamos um novo link de pagamento por email.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gray-100 h-screen text-gray-900">
      <Link
        href="/auth/logout"
        className='absolute top-2 right-4 text-sm text-gray-600 hover:text-gray-900'
      >
        Logout
      </Link>

      <GatewayForm 
        name={user.name!.split('@')[0]} 
        email={user.email!} 
        sub={user.sub!}
        picture={user.picture!}
      />
    </div>
  );
}
