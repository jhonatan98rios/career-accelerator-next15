import { OpenAI } from 'openai';
import { getUserPrompt, getSystemPrompt } from './prompts';

export type InsightRequestInput = {
  answers: Record<string, string>
  manualDescription: string
  // uploadedFileName: string
  output_id: string
  profile_id: string
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const generateInsight = async ({ answers, manualDescription, output_id, profile_id }: InsightRequestInput) => {
  const res = await openai.chat.completions.create({
    model: 'gpt-4.1',
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