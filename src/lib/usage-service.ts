import { DailyUsage, IDailyUsage } from "@/models/DailyUsage";
import { getPlanLimits } from "@/lib/plan-service";
import { Plan } from "@/lib/enums";

function today(): string {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
}

export async function getTodayUsage(profileId: string): Promise<IDailyUsage> {
  const date = today();

  // ponytail: upsert so callers never deal with null
  return (await DailyUsage.findOneAndUpdate(
    { profileId, date },
    { $setOnInsert: { profileId, date } },
    { upsert: true, new: true }
  ))!;
}

export async function canStartChatSession(profileId: string, plan: Plan): Promise<boolean> {
  const usage = await getTodayUsage(profileId);
  const limits = getPlanLimits(plan);
  return usage.chat.sessionsStarted < limits.chatSessionsPerDay;
}

export async function registerChatSession(profileId: string): Promise<IDailyUsage> {
  const date = today();

  return (await DailyUsage.findOneAndUpdate(
    { profileId, date },
    { $inc: { "chat.sessionsStarted": 1 } },
    { upsert: true, new: true }
  ))!;
}

export async function canGenerateResume(profileId: string, plan: Plan): Promise<boolean> {
  const usage = await getTodayUsage(profileId);
  const limits = getPlanLimits(plan);
  return usage.resume.generations < limits.resumeGenerationsPerDay;
}

export async function registerResumeGeneration(profileId: string): Promise<IDailyUsage> {
  const date = today();

  return (await DailyUsage.findOneAndUpdate(
    { profileId, date },
    { $inc: { "resume.generations": 1 } },
    { upsert: true, new: true }
  ))!;
}
