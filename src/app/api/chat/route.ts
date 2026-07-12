import { NextResponse } from "next/server";
import { generateChatResponse, type ChatMessage } from "@/lib/chat-service";
import { isAuthenticated, AuthError } from "@/lib/auth0";
import { log, LogLevel } from "@/lib/logger";
import { HttpStatus } from "@/types/httpStatus";

const MAX_INPUT_CHARS = 500;

interface ChatRequestBody {
  messages: ChatMessage[];
}

export async function POST(req: Request) {
  try {
    await isAuthenticated(req.headers);

    const body: ChatRequestBody = await req.json();

    if (!body.messages || !Array.isArray(body.messages) || body.messages.length === 0) {
      return NextResponse.json(
        { error: "messages array is required and must not be empty" },
        { status: HttpStatus.BAD_REQUEST }
      );
    }

    // Validate each message
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

    const content = await generateChatResponse(body.messages);

    return NextResponse.json({
      message: {
        role: "assistant" as const,
        content,
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
