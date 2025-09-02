import { OpenAI } from 'openai';
import { getUserPrompt, getSystemPrompt, getRoadmapSystemPrompt, getRoadmapUserPrompt } from './prompts';

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

export const generateRoadmap = async (oldSteps: any[]): Promise<any[]|null> => {

  const systemPrompt = getRoadmapSystemPrompt();
  const userPrompt = getRoadmapUserPrompt(oldSteps.map((step) => ({
    step: step.step,
    title: step.title,
    description: step.description,
  })));

  const res = await openai.chat.completions.create({
    model: 'gpt-5-nano-2025-08-07',
    messages: [
      {
        role: 'system',
        content: systemPrompt,
      },
      {
        role: 'user',
        content: userPrompt,
      },
    ],
  });

  const data = res.choices[0].message.content;

  if (!data) {
    return null;
  }

  return JSON.parse(data);
}