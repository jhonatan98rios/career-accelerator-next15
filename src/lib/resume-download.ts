import { Persona } from "@/models/Persona";
import { render } from "@/resume-docx";

export type ResumeDownloadResult =
  | { ok: true; buffer: Buffer; fileName: string }
  | { ok: false; error: string; status: number };

/** Fetch the latest resume from Mongo and render it as a DOCX buffer. */
export async function getResumeDocxBuffer(
  profileId: string,
  userName: string,
): Promise<ResumeDownloadResult> {
  const persona = (await Persona.findOne(
    { profile_id: profileId },
    { resume: 1 },
  ).lean()) as { resume?: unknown } | null;

  if (!persona?.resume) {
    return { ok: false, error: "Currículo não gerado ainda.", status: 404 };
  }

  const buffer = await render(persona.resume as any, "modern");
  const safeName = userName.replace(/\s+/g, "-").toLowerCase();
  const fileName = `curriculo-${safeName}.docx`;

  return { ok: true, buffer, fileName };
}
