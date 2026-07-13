import { NextResponse } from "next/server";
import { generateChatResponse, type ChatMessage, type PersonaSnapshot } from "@/lib/chat-service";
import { isAuthenticated, AuthError } from "@/lib/auth0";
import { connectDB } from "@/lib/db";
import { Profile, IProfile } from "@/models/Profile";
import { Persona, IPersona } from "@/models/Persona";
import { UserStatus } from "@/lib/enums";
import { log, LogLevel } from "@/lib/logger";
import { HttpStatus } from "@/types/httpStatus";

const MAX_INPUT_CHARS = 500;

interface ChatRequestBody {
  messages: ChatMessage[];
}

export async function POST(req: Request) {
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

    const body: ChatRequestBody = await req.json();

    if (!body.messages || !Array.isArray(body.messages) || body.messages.length === 0) {
      return NextResponse.json(
        { error: "messages array is required and must not be empty" },
        { status: HttpStatus.BAD_REQUEST }
      );
    }

    for (const msg of body.messages) {
      if (!msg.role || !["user", "assistant"].includes(msg.role)) {
        return NextResponse.json(
          { error: "each message must have role: 'user' or 'assistant'" },
          { status: HttpStatus.BAD_REQUEST }
        );
      }
      if (typeof msg.content !== "string") {
        return NextResponse.json(
          { error: "each message must have a content string" },
          { status: HttpStatus.BAD_REQUEST }
        );
      }
    }

    const lastMessage = body.messages[body.messages.length - 1];
    if (lastMessage.content.length > MAX_INPUT_CHARS) {
      return NextResponse.json(
        { error: `message exceeds ${MAX_INPUT_CHARS} character limit` },
        { status: HttpStatus.BAD_REQUEST }
      );
    }

    // Fetch persona for richer coaching context
    let personaSnapshot: PersonaSnapshot | undefined;
    try {
      const persona = (await Persona.findOne({ profile_id: user._id })) as IPersona | null;
      if (persona) {
        personaSnapshot = {
          currentRole: persona.currentRole,
          targetRole: persona.targetRole,
          yearsOfExperience: persona.yearsOfExperience,
          careerStage: persona.careerStage,
          industries: persona.industries,
          employmentStatus: persona.employmentStatus,
          educationLevel: persona.educationLevel,
          fieldOfStudy: persona.fieldOfStudy,
          certifications: persona.certifications,
          hardSkills: persona.hardSkills,
          softSkills: persona.softSkills,
          languages: persona.languages?.map((l) => ({
            language: l.language,
            proficiency: l.proficiency,
          })),
          tools: persona.tools,
          weeklyStudyHours: persona.weeklyStudyHours,
          studySchedule: persona.studySchedule,
          preferredContentFormat: persona.preferredContentFormat,
          shortTermGoal: persona.shortTermGoal,
          mediumTermGoal: persona.mediumTermGoal,
          longTermGoal: persona.longTermGoal,
          careerMotivation: persona.careerMotivation,
          willingToRelocate: persona.willingToRelocate,
          remotePreference: persona.remotePreference,
        };
      }
    } catch (dbErr) {
      // ponytail: persona fetch is best-effort — chat still works without it
      await log(LogLevel.WARN, "POST /api/chat: Failed to fetch persona, continuing without", {
        error: dbErr instanceof Error ? dbErr.message : String(dbErr),
      });
    }

    const encoder = new TextEncoder();

    let cancelled = false;

    const stream = new ReadableStream({
      start(controller) {
        (async () => {
          try {
            const generator = generateChatResponse(body.messages, personaSnapshot);
          for await (const token of generator) {
            if (cancelled) break;
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ token })}\n\n`));
          }
          if (!cancelled) {
            controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          }
        } catch (err) {
          if (!cancelled) {
            await log(LogLevel.ERROR, "POST /api/chat: Stream generation failed", {
              error: err instanceof Error ? err.message : String(err),
            });
            const msg = err instanceof Error ? err.message : "Internal Server Error";
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: msg })}\n\n`));
          }
        } finally {
          controller.close();
        }
        })();
      },
      cancel() {
        cancelled = true;
      },
    });

    return new NextResponse(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (err: unknown) {
    if (err instanceof AuthError) {
      return NextResponse.json(
        { error: err.message, code: err.code },
        { status: HttpStatus.UNAUTHORIZED }
      );
    }

    const message = err instanceof Error ? err.message : "Internal Server Error";
    await log(LogLevel.ERROR, "POST /api/chat: Exception occurred", { error: message });

    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: HttpStatus.INTERNAL_SERVER_ERROR }
    );
  }
}
