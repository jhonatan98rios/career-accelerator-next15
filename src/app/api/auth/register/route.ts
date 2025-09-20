import { connectDB } from '@/lib/db';
import { NextResponse } from 'next/server';
import { Plan, UserStatus } from '@/lib/enums';
import { sendPaymentEmail } from "@/lib/emailService";
import { createSubscription } from '@/lib/subscription';
import { Profile } from '@/models/Profile';
import { HttpStatus } from '@/types/httpStatus';
import { log, LogLevel } from "@/lib/logger";

type RegisterBody = {
  name: string;
  email: string;
  plan: Plan;
  sub: string;
  picture: string;
}

export async function POST(req: Request) {
  const body = await req.json();
  const { name, email, plan, sub, picture }: RegisterBody = body;

  if (!(name && email && plan && sub && picture)) {
    await log(LogLevel.ERROR, "Missing required registration fields", { name, email, plan, sub, picture });
    return NextResponse.json({ error: 'Missing required registration fields' }, { status: HttpStatus.BAD_REQUEST });
  }

  await log(LogLevel.INFO, "Registering user", { email, plan });

  await connectDB();

  const existing = await Profile.findOne({ email });
  if (existing) {
    await log(LogLevel.WARN, "User already exists", { email });
    return NextResponse.json(null, { status: HttpStatus.CONFLICT });
  }

  if (!Object.values(Plan).includes(plan)) {
    await log(LogLevel.ERROR, "Invalid plan selected", { email, plan });
    return NextResponse.json({ error: 'Invalid plan selected' }, { status: HttpStatus.BAD_REQUEST });
  }

  await log(LogLevel.INFO, "Creating subscription", { email, plan });
  const subscription = await createSubscription({
    plan,
    email,
  })

  // Create the user and send the email in parallel
  await log(LogLevel.INFO, "Creating a new user", { email, plan, subscriptionId: subscription.subscription_id });

  const promises = [
    Profile.create({
      name,
      email,
      plan,
      picture,
      externalAuthId: sub,
      status: UserStatus.INACTIVE,
    }),
    sendPaymentEmail({ name, to: email, plan, paymentLink: subscription.init_point }),
  ]

  await Promise.all(promises)
  .catch(async (error) => {
    await log(LogLevel.ERROR, "Error during user registration", { error, email, plan });
    return NextResponse.json({ error: 'Failed to create user and subscription' }, { status: HttpStatus.INTERNAL_SERVER_ERROR });
  })

  return NextResponse.json(null, { status: HttpStatus.CREATED });
}
