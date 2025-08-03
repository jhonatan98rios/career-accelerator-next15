// import { NextResponse } from 'next/server';
// import { data } from './data';

// export async function POST(req: Request) {
//   const payload = await req.json();
//   console.log('Received payload:', payload);
//   return NextResponse.json({ data });
// }





import { NextResponse } from 'next/server';
import { generateInsight, InsightRequestInput } from '@/lib/openai';

export async function POST(req: Request) {
  const payload = await req.json();
  console.log('Received payload:', payload);
  const { answers, manualDescription, output_id, profile_id } = payload as InsightRequestInput;

  if (!answers || !manualDescription || !output_id || !profile_id) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const json = await generateInsight({ answers, manualDescription, output_id, profile_id });

  if (!json) {
    return NextResponse.json({ error: 'Failed to generate insight' }, { status: 500 });
  }
  
  const data = JSON.parse(json);

  return NextResponse.json({ data });
}
