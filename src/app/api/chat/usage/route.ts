import { NextResponse } from "next/server";
import { isAuthenticated, AuthError } from "@/lib/auth0";
import { connectDB } from "@/lib/db";
import { Profile, IProfile } from "@/models/Profile";
import { UserStatus } from "@/lib/enums";
import { getPlanLimits } from "@/lib/plan-service";
import { getTodayUsage } from "@/lib/usage-service";
import { log, LogLevel } from "@/lib/logger";
import { HttpStatus } from "@/types/httpStatus";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { sub } = await isAuthenticated(req.headers);

    await connectDB();

    const user = (await Profile.findOne({ externalAuthId: sub })) as IProfile | null;
    if (!user || user.status === UserStatus.INACTIVE) {
      return NextResponse.json({ error: "Unauthorized" }, { status: HttpStatus.UNAUTHORIZED });
    }

    const usage = await getTodayUsage(user._id.toString());
    const limits = getPlanLimits(user.plan);

    return NextResponse.json({
      sessionsStarted: usage.chat.sessionsStarted,
      sessionsLimit: limits.chatSessionsPerDay,
      canStartSession: usage.chat.sessionsStarted < limits.chatSessionsPerDay,
      tokenLimit: limits.chatSessionTokenLimit,
      resumeGenerations: usage.resume.generations,
      resumeGenerationsLimit: limits.resumeGenerationsPerDay,
    });
  } catch (err: unknown) {
    if (err instanceof AuthError) {
      return NextResponse.json(
        { error: err.message, code: err.code },
        { status: HttpStatus.UNAUTHORIZED }
      );
    }

    const message = err instanceof Error ? err.message : "Internal Server Error";
    await log(LogLevel.ERROR, "GET /api/chat/usage: Exception occurred", { error: message });

    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: HttpStatus.INTERNAL_SERVER_ERROR }
    );
  }
}
