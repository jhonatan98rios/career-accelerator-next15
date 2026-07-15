import { NextResponse } from "next/server";
import { isAuthenticated, AuthError } from "@/lib/auth0";
import { render } from "@/resume-docx";
import type { Resume } from "@/resume";

export async function POST(req: Request) {
  try {
    await isAuthenticated(req.headers);

    const body = await req.json();

    const { resume, template = "modern" } = body as {
      resume: Resume;
      template?: "modern" | "classic" | "ats" | "academic";
    };

    if (!resume?.personal?.name) {
      return NextResponse.json(
        { error: "Dados de currículo inválidos" },
        { status: 400 },
      );
    }

    const buffer = await render(resume, template);

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="curriculo-${resume.personal.name.replace(/\s+/g, "-").toLowerCase()}.docx"`,
        "Content-Length": String(buffer.length),
      },
    });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json(
        { error: err.message, code: err.code },
        { status: 401 },
      );
    }
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
