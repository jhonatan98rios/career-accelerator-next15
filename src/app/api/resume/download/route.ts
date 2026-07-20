import { NextResponse } from "next/server";
import { log, LogLevel } from "@/lib/logger";
import { isAuthenticated, AuthError } from "@/lib/auth0";
import { connectDB } from "@/lib/db";
import { Profile } from "@/models/Profile";
import { UserStatus } from "@/lib/enums";
import { getResumeDocxBuffer } from "@/lib/resume-download";
import { HttpStatus } from "@/types/httpStatus";

export async function POST(req: Request) {
  try {
    const { sub } = await isAuthenticated(req.headers);
    await connectDB();

    const user = await Profile.findOne({ externalAuthId: sub });
    if (!user || user.status === UserStatus.INACTIVE) {
      return NextResponse.json({}, { status: HttpStatus.UNAUTHORIZED });
    }

    const result = await getResumeDocxBuffer(user._id.toString(), user.name);

    if (!result.ok) {
      return NextResponse.json(
        { error: result.error },
        { status: result.status },
      );
    }

    return new NextResponse(new Uint8Array(result.buffer), {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${result.fileName}"`,
        "Content-Length": String(result.buffer.length),
      },
    });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json(
        { error: err.message, code: err.code },
        { status: HttpStatus.UNAUTHORIZED },
      );
    }
    const message = err instanceof Error ? err.message : String(err);
    await log(LogLevel.ERROR, "Resume download failed", { error: message });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
