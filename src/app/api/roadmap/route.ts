

import { NextResponse } from 'next/server';
import { generateInsight, InsightRequestInput } from '@/lib/openai';
import { connectDB } from "@/lib/db";
import { CareerInsight } from '@/models/CarrerInsight';

export async function POST(req: Request) {

  try {

    const payload = await req.json();
    console.log('Received payload:', payload);
    const { answers, manualDescription, profile_id } = payload as InsightRequestInput;

    if (!answers || !manualDescription || !profile_id) {

      console.log({
        answers, manualDescription,
      })

      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const json = await generateInsight({ answers, manualDescription, profile_id });

    if (!json) {
      return NextResponse.json({ error: 'Failed to generate insight' }, { status: 500 });
    }
    
    const data = JSON.parse(json);

    
    await connectDB();
    
    const newInsight = await CareerInsight.create({
      user_id: profile_id,
      ...data,
    });
    
    console.log(newInsight)
    return NextResponse.json({ data: newInsight }, {status: 201});

  } catch (err: any) {
    console.error("Error in POST /careerInsight:", err);
    return NextResponse.json({ error: err.message || "Internal Server Error" }, { status: 500 });
  }
}
