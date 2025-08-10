// app/api/auth/login/route.ts
import { connectDB } from '@/lib/db';
import { IUser, User } from '@/models/User';
import { verifyPassword, generateToken } from '@/lib/auth';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const { email, password } = await req.json();
  await connectDB();

  const user = await User.findOne<IUser>({ email });
  if (!user) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }

  const isValid = await verifyPassword(password, user.password);
  if (!isValid) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }

  const token = generateToken({ id: user._id, email: user.email, name: user.name });

  // Set secure cookie (HttpOnly)
  const cookieStore = await cookies();
  cookieStore.set('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
    sameSite: 'strict',
  });

  return NextResponse.json({ 
    message: 'Logged in', 
    userId: user._id, 
    name: user.name,
    status: user.status
  });
}
