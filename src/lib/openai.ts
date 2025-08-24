import { OpenAI } from 'openai';
import { getUserPrompt, getSystemPrompt } from './prompts';

export type InsightRequestInput = {
  answers: Record<string, string>
  manualDescription: string
  profile_id: string
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const generateInsight = async ({ answers, manualDescription }: InsightRequestInput) => {
  const res = await openai.chat.completions.create({
    model: 'gpt-5-nano-2025-08-07',
    messages: [
      {
        role: 'system',
        content: getSystemPrompt(),
      },
      {
        role: 'user',
        content: getUserPrompt(answers, manualDescription),
      },
    ],
  });

  const data = res.choices[0].message.content;
  return data;
}