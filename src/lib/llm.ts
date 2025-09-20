import { ChatOpenAI } from "@langchain/openai";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { getUserPrompt, getSystemPrompt, getRoadmapSystemPrompt, getRoadmapUserPrompt, insightExample } from './prompts';
import { IStep } from "@/models/CareerRoadmap";

type InsightRequestInput = {
  answers: Record<string, string>
  manualDescription: string
}

const model = new ChatOpenAI({
  model: "gpt-5-nano-2025-08-07",
  // model: "gpt-5-mini", (5x more expensive but 15% faster)
  apiKey: process.env.OPENAI_API_KEY,
});

export const generateInsight = async ({ answers, manualDescription }: InsightRequestInput): Promise<string|null> => {

  const prompt = ChatPromptTemplate.fromMessages([
    ["system", getSystemPrompt()],
    ["user", getUserPrompt()]
  ])

  const chain = prompt.pipe(model);

  const response = await chain.invoke({
    insightExample: JSON.stringify(insightExample, null, 2),
    answers: JSON.stringify(answers, null, 2),
    manualDescription: manualDescription || "N/A",
  });
  
  return response.content as string;
}




export const generateRoadmap = async (oldSteps: IStep[]): Promise<string|null> => {

  const systemPrompt = getRoadmapSystemPrompt();
  const userPrompt = getRoadmapUserPrompt();
  
  const prompt = ChatPromptTemplate.fromMessages([
    ["system", systemPrompt],
    ["user", userPrompt]
  ])
  
  const chain = prompt.pipe(model);

  const steps = oldSteps.map(step => ({
    step: step.step,
    title: step.title,
    description: step.description,
  }))

  const res = await chain.invoke({
    steps: JSON.stringify(steps, null, 2)
  });

  if (!res.content) {
    return null;
  }

  return res.content as string;
}