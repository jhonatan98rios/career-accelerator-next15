import { NextResponse } from "next/server";
import { generate } from "@/resume";
import { isAuthenticated } from "@/lib/auth0";
import { connectDB } from "@/lib/db";
import { Profile } from "@/models/Profile";
import { UserStatus } from "@/lib/enums";
import { log, LogLevel } from "@/lib/logger";
import { HttpStatus } from "@/types/httpStatus";

export async function POST(req: Request) {
  try {
    const { sub } = await isAuthenticated(req.headers);
    await connectDB();

    const user = await Profile.findOne({ externalAuthId: sub });
    if (!user || user.status === UserStatus.INACTIVE) {
      return NextResponse.json({}, { status: HttpStatus.UNAUTHORIZED });
    }

    const { input }: { input: string } = await req.json();

    if (!input || input.trim().length === 0) {
      return NextResponse.json({ error: "Texto vazio." }, { status: 400 });
    }

    const result = await generate(input);

    if (!result.ok) {
      await log(LogLevel.ERROR, "Resume generation failed", { error: result.error });
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({ data: result.data });
  } catch (err) {
    await log(LogLevel.ERROR, "Resume API error", {
      error: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json(
      { error: "Erro ao gerar currículo." },
      { status: 500 },
    );
  }
}
