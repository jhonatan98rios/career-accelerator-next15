import { connectDB } from '@/lib/db';
import { User } from '@/models/User';
import { hashPassword } from '@/lib/auth';
import { NextResponse } from 'next/server';
import { Plan, UserStatus } from '@/lib/enums';
import { sendPaymentEmail } from "@/lib/emailService";

const MERCADO_PAGO_SUBSCRIPTION_BASE_URL = process.env.MERCADO_PAGO_SUBSCRIPTION_BASE_URL!;
const MERCADO_PAGO_BASIC_PLAN_ID = process.env.MERCADO_PAGO_BASIC_PLAN_ID!;
const MERCADO_PAGO_INTERMEDIARY_PLAN_ID = process.env.MERCADO_PAGO_INTERMEDIARY_PLAN_ID!;

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

  const hashedPassword = await hashPassword(password);
  await User.create({ 
    name, 
    email, 
    plan,
    password: hashedPassword,
    status: UserStatus.INACTIVE,
  });

  const preapproval_plan_ids = {
    [Plan.BASIC]: MERCADO_PAGO_BASIC_PLAN_ID,
    [Plan.INTERMEDIARY]: MERCADO_PAGO_INTERMEDIARY_PLAN_ID,
    // [Plan.PREMIUM]: 'premium_plan_id_placeholder',
  }

  const paymentLink = MERCADO_PAGO_SUBSCRIPTION_BASE_URL + preapproval_plan_ids[plan]!

  await sendPaymentEmail(email, name, plan, paymentLink);

  return NextResponse.json({ message: 'User created' }, { status: 201 });
}
