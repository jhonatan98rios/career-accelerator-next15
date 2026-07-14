import { NextResponse } from "next/server";
import { isAuthenticated, AuthError } from "@/lib/auth0";
import { connectDB } from "@/lib/db";
import { Profile, IProfile } from "@/models/Profile";
import { ChatSession } from "@/models/ChatSession";
import { UserStatus } from "@/lib/enums";
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
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: HttpStatus.UNAUTHORIZED }
      );
    }

    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get("sessionId");

    if (!sessionId) {
      return NextResponse.json(
        { error: "sessionId query param is required" },
        { status: HttpStatus.BAD_REQUEST }
      );
    }

    const cs = await ChatSession.findOne({
      profileId: user._id as string,
      sessionId,
    });

    if (!cs) {
      return NextResponse.json(
        { error: "Session not found" },
        { status: HttpStatus.NOT_FOUND }
      );
    }

    return NextResponse.json({
      sessionId: cs.sessionId,
      tokenLimit: cs.tokenLimit,
      promptTokens: cs.promptTokens,
      completionTokens: cs.completionTokens,
      totalTokens: cs.totalTokens,
    });
  } catch (err: unknown) {
    if (err instanceof AuthError) {
      return NextResponse.json(
        { error: err.message, code: err.code },
        { status: HttpStatus.UNAUTHORIZED }
      );
    }

    const message = err instanceof Error ? err.message : "Internal Server Error";
    await log(LogLevel.ERROR, "GET /api/chat/session: Exception occurred", { error: message });

    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: HttpStatus.INTERNAL_SERVER_ERROR }
    );
  }
}
