import { NextResponse } from "next/server";
import { generate, type UserData } from "@/resume";
import { isAuthenticated, AuthError } from "@/lib/auth0";
import { connectDB } from "@/lib/db";
import { Profile } from "@/models/Profile";
import { Persona, type IPersona } from "@/models/Persona";
import { UserStatus } from "@/lib/enums";
import { log, LogLevel } from "@/lib/logger";
import { HttpStatus } from "@/types/httpStatus";
import { MAX_RESUME_INPUT_CHARS } from "@/lib/resume-constants";
import { getRecentNotesContext } from "@/lib/chat-notes";
import { canGenerateResume, registerResumeGeneration } from "@/lib/usage-service";
import { getPlanLimits } from "@/lib/plan-service";
import { validateUserInput } from "@/lib/prompt-guard";

export async function POST(req: Request) {
  try {
    const { sub } = await isAuthenticated(req.headers);
    await connectDB();

    const user = await Profile.findOne({ externalAuthId: sub });
    if (!user || user.status === UserStatus.INACTIVE) {
      return NextResponse.json({}, { status: HttpStatus.UNAUTHORIZED });
    }

    const persona = await Persona.findOne({ profile_id: user._id }).lean() as IPersona | null;

    const userData: UserData = {
      name: user.name ?? undefined,
      email: user.email ?? undefined,
      currentRole: persona?.currentRole,
      targetRole: persona?.targetRole,
      yearsOfExperience: persona?.yearsOfExperience,
      careerStage: persona?.careerStage,
      industries: persona?.industries,
      employmentStatus: persona?.employmentStatus,
      educationLevel: persona?.educationLevel,
      fieldOfStudy: persona?.fieldOfStudy,
      certifications: persona?.certifications,
      hardSkills: persona?.hardSkills,
      softSkills: persona?.softSkills,
      languages: persona?.languages?.map((l) => ({ name: l.language, proficiency: l.proficiency })),
      shortTermGoal: persona?.shortTermGoal,
      mediumTermGoal: persona?.mediumTermGoal,
      longTermGoal: persona?.longTermGoal,
    };

    // Guardrail: max resume generations per day
    const allowed = await canGenerateResume(user._id.toString(), user.plan);
    if (!allowed) {
      const limits = getPlanLimits(user.plan);
      await log(LogLevel.WARN, "Resume generation blocked: daily limit reached", {
        profileId: user._id.toString(),
        plan: user.plan,
        limit: limits.resumeGenerationsPerDay,
      });
      return NextResponse.json(
        { error: "Limite diário de geração de currículos atingido.", code: "RESUME_DAILY_LIMIT" },
        { status: HttpStatus.TOO_MANY_REQUESTS }
      );
    }

    const { input, language }: { input: string; language?: string } = await req.json();

    if (!input || input.trim().length === 0) {
      return NextResponse.json({ error: "Texto vazio." }, { status: 400 });
    }

    if (input.length > MAX_RESUME_INPUT_CHARS) {
      return NextResponse.json(
        { error: `Texto excede o limite de ${MAX_RESUME_INPUT_CHARS} caracteres.` },
        { status: 400 }
      );
    }

    // Guardrail: reject prompt injection patterns before LLM call
    const inputCheck = validateUserInput(input);
    if (!inputCheck.ok) {
      await log(LogLevel.WARN, "Resume input blocked: prompt injection detected", {
        profileId: user._id.toString(),
        matched: inputCheck.matched,
      });
      return NextResponse.json(
        { error: inputCheck.error },
        { status: HttpStatus.BAD_REQUEST }
      );
    }

    // Fetch recent chat notes for context
    let notesContext = "";
    try {
      notesContext = await getRecentNotesContext(user._id.toString());
    } catch (notesErr) {
      await log(LogLevel.WARN, "POST /resume: Failed to fetch notes, continuing without", {
        error: notesErr instanceof Error ? notesErr.message : String(notesErr),
      });
    }

    const result = await generate(input, userData, language === "en" ? "en" : "pt", notesContext || undefined);

    if (!result.ok) {
      await log(LogLevel.ERROR, "Resume generation failed", { error: result.error });
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    // Persist structured resume on persona
    await Persona.findOneAndUpdate(
      { profile_id: user._id },
      { $set: { resume: result.data, resumeGeneratedAt: new Date() } },
      { upsert: true }
    );

    // Register usage after successful generation
    await registerResumeGeneration(user._id.toString());

    return NextResponse.json({ data: result.data });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json(
        { error: err.message, code: err.code },
        { status: 401 }
      );
    }
    const message = err instanceof Error ? err.message : String(err);
    console.error("[resume] step=api-crash error=%s", message, err);
    await log(LogLevel.ERROR, "Resume API error", { error: message });
    return NextResponse.json(
      { error: message },
      { status: 500 },
    );
  }
}
