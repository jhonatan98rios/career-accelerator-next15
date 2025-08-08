import { connectDB } from '@/lib/db';
import { User } from '@/models/User';
import { hashPassword } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const { email, password } = await req.json();

  await connectDB();

  const existing = await User.findOne({ email });
  if (existing) {
    return NextResponse.json({ error: 'User already exists' }, { status: 400 });
  }

  const hashedPassword = await hashPassword(password);
  const user = await User.create({ email, password: hashedPassword });

  return NextResponse.json({ message: 'User created successfully' });
}
