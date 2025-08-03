import { NextResponse } from 'next/server';
import { data } from './data';

export async function POST(req: Request) {
  const payload = await req.json();
  console.log('Received payload:', payload);
  return NextResponse.json({ data });
}
