import { auth0 } from '@/lib/auth0';
import { connectDB } from '@/lib/db';
import { UserStatus } from '@/lib/enums';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { GatewayForm } from './form';
import { IProfile, Profile } from '@/models/Profile';
import { createSubscription } from '@/lib/subscription';
import { sendPaymentEmail } from '@/lib/emailService';
import { log, LogLevel } from "@/lib/logger";
import { Consent, ConsentEventStatus, IConsent } from '@/models/Consent';
import { ITerm, Term } from '@/models/Term';

export default async function Gateway() {
  const session = await auth0.getSession();

  if (!session) {
    redirect("/auth/login?returnTo=/gateway");
  }

  // Check if the user exists on MongoDB
  await connectDB();

  const user: IProfile | null = await Profile.findOne({ email: session.user.email });

  if (!user) {
    return (
      <div className="bg-gray-100 min-h-screen text-gray-900">
        <Link
          href="/auth/logout"
          className='absolute top-2 right-4 text-sm text-gray-600 hover:text-gray-900'
        >
          Logout
        </Link>

        <GatewayForm
          email={session.user.email!}
          sub={session.user.sub!}
          picture={session.user.picture!}
          jwtToken={session.tokenSet.accessToken!}
        />
      </div>
    );
  }

  if (user && user.status === UserStatus.INACTIVE) {
    await log(LogLevel.INFO, "User inactive, creating new subscription", { email: user.email, plan: user.plan });
    const subscription = await createSubscription({
      plan: user.plan,
      email: user.email!,
    })

    await log(LogLevel.INFO, "Sending payment email", { email: user.email, plan: user.plan, paymentLink: subscription.init_point });
    await sendPaymentEmail({
      name: user.name!,
      to: user.email!,
      plan: user.plan,
      paymentLink: subscription.init_point
    })

    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 p-4">
        <Link
          href="/auth/logout"
          className='absolute top-2 right-4 text-sm text-gray-600 hover:text-gray-900'
        >
          Logout
        </Link>
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


    // Improve the validation below
  if (user && user.status === UserStatus.ACTIVE) {

    const term = (await Term.findOne({}, {}, { sort: { createdAt: -1 } })) as ITerm;
    const consent = await Consent.findOne({ 
      email: user.email,
      currentVersion: term.version
    }) as IConsent | null

    if (!consent || consent.status != ConsentEventStatus.AGREED) {
      redirect('/legal/terms')
    }

    redirect('/profile/' + user._id)
  }
}
