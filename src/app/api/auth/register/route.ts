import { connectDB } from '@/lib/db';
import { User } from '@/models/User';
import { hashPassword } from '@/lib/auth';
import { NextResponse } from 'next/server';
import { Plan, UserStatus } from '@/lib/enums';
import { sendPaymentEmail } from "@/lib/emailService";
import { createSubscription } from '@/lib/subscription';

type RegisterBody = {
  name: string;
  email: string;
  password: string;
  plan: Plan;
}

export async function POST(req: Request) {
  const body = await req.json();
  const { name, email, password, plan }: RegisterBody = body;

  await connectDB();

  const existing = await User.findOne({ email });
  if (existing) {
    return NextResponse.json({ error: 'User already exists' }, { status: 400 });
  }

  if (!Object.values(Plan).includes(plan)) {
    return NextResponse.json({ error: 'Invalid plan selected' }, { status: 400 });
  }

  // Hash password and create subscription in parallel
  const [hashedPassword, subscription] = await Promise.all([
    hashPassword(password),
    createSubscription({
      plan,
      email,
    }),
  ]);

  // Then run the user, subscription creation and email sending in parallel
  const promises = [
    User.create({ 
      name,
      email,
      plan,
      password: hashedPassword,
      status: UserStatus.INACTIVE,
    }),
    sendPaymentEmail({ name, to: email, plan, paymentLink: subscription.init_point }),
  ]

  await Promise.all(promises)
  .catch(error => {
    console.error('Error during user registration:', error);
    return NextResponse.json({ error: 'Failed to create user and subscription' }, { status: 500 });
  })

  // // Run password hashing and create subscription in parallel
  // const hashedPassword = await hashPassword(password);
  // const subscription: ISubscription = await createSubscription({
  //   // planId: preapproval_plan_ids[plan]!,
  //   plan,
  //   email,
  // })

  // // Then run the user, subscription creation and email sending in parallel
  // await User.create({ 
  //   name,
  //   email,
  //   plan,
  //   password: hashedPassword,
  //   status: UserStatus.INACTIVE,
  // });

  // await Subscription.create(subscription)

  // await sendPaymentEmail({ name, to: email, plan, paymentLink: subscription.init_point });

  return NextResponse.json({ message: 'User created' }, { status: 201 });
}
