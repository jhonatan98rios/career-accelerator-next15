import { connectDB } from '@/lib/db';
import { NextResponse } from 'next/server';
import { Plan, UserStatus } from '@/lib/enums';
import { sendPaymentEmail } from "@/lib/emailService";
import { createSubscription } from '@/lib/subscription';
import { Profile } from '@/models/Profile';
import { HttpStatus } from '@/types/httpStatus';

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

  console.log("Registering user:", body);

  await connectDB();

  const existing = await Profile.findOne({ email });
  if (existing) {
    console.log("User already exists with email:", email);
    return NextResponse.json(null, { status: HttpStatus.CONFLICT });
  }

  if (!Object.values(Plan).includes(plan)) {
    console.log("Invalid plan selected:", plan);
    return NextResponse.json({ error: 'Invalid plan selected' }, { status: HttpStatus.BAD_REQUEST });
  }

  console.log("Creating subscription...")
  const subscription = await createSubscription({
    plan,
    email,
  })

  // Create the user and send the email in parallel
  console.log("Creating a new user...")
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
  .catch(error => {
    console.error('Error during user registration:', error);
    return NextResponse.json({ error: 'Failed to create user and subscription' }, { status: HttpStatus.INTERNAL_SERVER_ERROR });
  })

  return NextResponse.json(null, { status: HttpStatus.CREATED });
}
