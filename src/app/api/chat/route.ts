import { NextResponse } from "next/server";
import {
  generateChatResponse,
  type ChatMessage,
  type PersonaSnapshot,
  type TokenUsage,
} from "@/lib/chat-service";
import { isAuthenticated, AuthError } from "@/lib/auth0";
import { connectDB } from "@/lib/db";
import { Profile, IProfile } from "@/models/Profile";
import { Persona, IPersona } from "@/models/Persona";
import { ChatSession } from "@/models/ChatSession";
import { ChatNotes } from "@/models/ChatNotes";
import { generateChatNotes } from "@/lib/chat-notes";
import { UserStatus } from "@/lib/enums";
import { log, LogLevel } from "@/lib/logger";
import { HttpStatus } from "@/types/httpStatus";
import { canStartChatSession, registerChatSession } from "@/lib/usage-service";
import { getPlanLimits } from "@/lib/plan-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_INPUT_CHARS = 500;

interface ChatRequestBody {
  messages: ChatMessage[];
  sessionId?: string;
}

export async function POST(req: Request) {
  try {
    const { sub } = await isAuthenticated(req.headers);

    await connectDB();

    const user = (await Profile.findOne({ externalAuthId: sub })) as IProfile | null;
    if (!user || user.status === UserStatus.INACTIVE) {
      return NextResponse.json({ error: "Unauthorized" }, { status: HttpStatus.UNAUTHORIZED });
    }

    const profileId = user._id.toString();
    const limits = getPlanLimits(user.plan);

    const body: ChatRequestBody = await req.json();

    let chatSession;
    const clientSid = body.sessionId;

    if (clientSid) {
      // Lookup existing session
      chatSession = await ChatSession.findOne({ profileId, sessionId: clientSid });
    }

    if (!chatSession) {
      // New session (no sessionId or not found): enforce daily limit
      const allowed = await canStartChatSession(profileId, user.plan);
      if (!allowed) {
        await log(LogLevel.WARN, "Chat session blocked: daily limit reached", {
          profileId,
          plan: user.plan,
          limits,
        });
        return NextResponse.json(
          { error: "Daily chat session limit reached" },
          { status: HttpStatus.TOO_MANY_REQUESTS }
        );
      }

      chatSession = await ChatSession.create({
        profileId,
        sessionId: clientSid || `cs_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        tokenLimit: limits.chatSessionTokenLimit,
      });

      await registerChatSession(profileId);
    } else {
      // Existing session: enforce token limit
      if (chatSession.totalTokens >= chatSession.tokenLimit) {
        await log(LogLevel.WARN, "Chat blocked: token limit reached for session", {
          profileId,
          sessionId: chatSession.sessionId,
          totalTokens: chatSession.totalTokens,
          tokenLimit: chatSession.tokenLimit,
        });
        return NextResponse.json(
          { error: "Token limit reached for this session" },
          { status: HttpStatus.TOO_MANY_REQUESTS }
        );
      }
    }

    const csId = chatSession.sessionId;

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

    // [DIAGNOSTIC] STREAM_DEBUG mode — artificial stream, no OpenAI call
    const DEBUG = process.env.STREAM_DEBUG === "true";

    const encoder = new TextEncoder();

    let cancelled = false;

    const stream = new ReadableStream({
      start(controller) {
        (async () => {
          try {
            console.log("[route] stream started", { time: Date.now(), debug: DEBUG });

            let usage: TokenUsage | undefined;

            if (DEBUG) {
              // Artificial stream: 10 tokens, 1 per second, same SSE format
              for (let i = 1; i <= 10; i++) {
                if (cancelled) break;
                const token = `Token ${i} `;
                const payload = `data: ${JSON.stringify({ token })}\n\n`;
                console.log("[route] enqueue (debug)", {
                  time: Date.now(),
                  tokenLength: token.length,
                  token,
                });
                controller.enqueue(encoder.encode(payload));
                await new Promise((r) => setTimeout(r, 1000));
              }
              // ponytail: fake usage for debug mode
              usage = { promptTokens: 50, completionTokens: 30, totalTokens: 80 };
            } else {
              const out = {} as { usage?: TokenUsage };
              // ponytail: cap at remaining budget, but never above model max (128K)
              const remainingBudget = Math.min(
                chatSession.tokenLimit - (chatSession.totalTokens ?? 0),
                128000
              );
              const generator = generateChatResponse(
                body.messages,
                personaSnapshot,
                out,
                remainingBudget
              );
              for await (const token of generator) {
                if (cancelled) break;
                const payload = `data: ${JSON.stringify({ token })}\n\n`;
                console.log("[route] enqueue", {
                  time: Date.now(),
                  tokenLength: token.length,
                  content: token.slice(0, 80),
                });
                controller.enqueue(encoder.encode(payload));
              }
              usage = out.usage;
            }

            if (!cancelled) {
              // Persist token usage
              if (usage) {
                await ChatSession.findOneAndUpdate(
                  { profileId, sessionId: csId },
                  {
                    $inc: {
                      promptTokens: usage.promptTokens,
                      completionTokens: usage.completionTokens,
                      totalTokens: usage.totalTokens,
                    },
                  },
                  { new: true }
                );
              }

              // Generate and persist chat notes
              let notes = "";
              try {
                notes = await generateChatNotes(body.messages);
                await ChatNotes.findOneAndUpdate(
                  { profileId, sessionId: csId },
                  { notes },
                  { upsert: true }
                );
              } catch (notesErr) {
                // ponytail: notes are best-effort — chat still works without them
                await log(LogLevel.WARN, "POST /api/chat: Failed to generate/save notes", {
                  error: notesErr instanceof Error ? notesErr.message : String(notesErr),
                });
              }

              const updatedSession = await ChatSession.findOne({ profileId, sessionId: csId });

              // Send session data before [DONE]
              const sessionPayload = JSON.stringify({
                session: updatedSession
                  ? {
                      sessionId: updatedSession.sessionId,
                      tokenLimit: updatedSession.tokenLimit,
                      promptTokens: updatedSession.promptTokens,
                      completionTokens: updatedSession.completionTokens,
                      totalTokens: updatedSession.totalTokens,
                      notes,
                    }
                  : null,
              });
              controller.enqueue(encoder.encode(`data: ${sessionPayload}\n\n`));

              console.log("[route] sending [DONE]", { time: Date.now() });
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
            console.log("[route] closing controller", { time: Date.now() });
            controller.close();
          }
        })();
      },
      cancel() {
        cancelled = true;
        console.log("[route] client cancelled stream", { time: Date.now() });
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
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
