import { ChatOpenAI } from "@langchain/openai";
import { SystemMessage, HumanMessage, AIMessage } from "@langchain/core/messages";

const MAX_OUTPUT_CHARS = 500;

const model = new ChatOpenAI({
  model: "gpt-5-nano-2025-08-07",
  apiKey: process.env.OPENAI_API_KEY,
});

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

// ponytail: flat subset, only fields the coach prompt uses
export interface PersonaSnapshot {
  currentRole?: string;
  targetRole?: string;
  yearsOfExperience?: number;
  careerStage?: string;
  industries?: string[];
  employmentStatus?: string;
  educationLevel?: string;
  fieldOfStudy?: string;
  certifications?: string[];
  hardSkills?: string[];
  softSkills?: string[];
  languages?: { language: string; proficiency: string }[];
  tools?: string[];
  weeklyStudyHours?: number;
  studySchedule?: string;
  preferredContentFormat?: string;
  shortTermGoal?: string;
  mediumTermGoal?: string;
  longTermGoal?: string;
  careerMotivation?: string;
  willingToRelocate?: boolean;
  remotePreference?: string;
}

function buildSystemPrompt(persona?: PersonaSnapshot): string {
  const lines: string[] = [
    `Você é um coach de carreira especializado. Suas responsabilidades:`,
    ``,
    `- Responder perguntas sobre carreira, currículo, entrevistas e desenvolvimento profissional.`,
    `- Dar respostas objetivas e diretas.`,
    `- Evitar respostas excessivamente longas — limite-se a aproximadamente ${MAX_OUTPUT_CHARS} caracteres.`,
    `- Focar exclusivamente no tema de carreira e mercado de trabalho.`,
    `- Responder sempre em português do Brasil.`,
    `- Use os dados do perfil do usuário (quando disponíveis) para personalizar suas respostas.`,
    `- Quando o usuário fizer perguntas genéricas, contextualize com o perfil dele antes de responder.`,
  ];

  if (persona) {
    const p: string[] = ["", "## Perfil do usuário"];

    if (persona.currentRole) p.push(`- Cargo atual: ${persona.currentRole}`);
    if (persona.targetRole) p.push(`- Cargo desejado: ${persona.targetRole}`);
    if (persona.yearsOfExperience != null) p.push(`- Anos de experiência: ${persona.yearsOfExperience}`);
    if (persona.careerStage) {
      const stageMap: Record<string, string> = {
        entry: "iniciante", mid: "pleno", senior: "sênior", lead: "líder", executive: "executivo",
      };
      p.push(`- Estágio de carreira: ${stageMap[persona.careerStage] ?? persona.careerStage}`);
    }
    if (persona.industries?.length) p.push(`- Setores: ${persona.industries.join(", ")}`);
    if (persona.employmentStatus) {
      const statusMap: Record<string, string> = {
        employed: "empregado", unemployed: "desempregado", freelancer: "freelancer",
        student: "estudante", retired: "aposentado",
      };
      p.push(`- Situação atual: ${statusMap[persona.employmentStatus] ?? persona.employmentStatus}`);
    }
    if (persona.educationLevel) {
      const eduMap: Record<string, string> = {
        high_school: "ensino médio", bootcamp: "bootcamp", bachelors: "graduação",
        masters: "mestrado", phd: "doutorado", other: "outro",
      };
      p.push(`- Nível de educação: ${eduMap[persona.educationLevel] ?? persona.educationLevel}`);
    }
    if (persona.fieldOfStudy) p.push(`- Área de formação: ${persona.fieldOfStudy}`);
    if (persona.certifications?.length) p.push(`- Certificações: ${persona.certifications.join(", ")}`);
    if (persona.hardSkills?.length) p.push(`- Hard skills: ${persona.hardSkills.join(", ")}`);
    if (persona.softSkills?.length) p.push(`- Soft skills: ${persona.softSkills.join(", ")}`);
    if (persona.languages?.length) {
      p.push(`- Idiomas: ${persona.languages.map((l) => `${l.language} (${l.proficiency})`).join(", ")}`);
    }
    if (persona.tools?.length) p.push(`- Ferramentas: ${persona.tools.join(", ")}`);
    if (persona.weeklyStudyHours != null) p.push(`- Horas de estudo/semana: ${persona.weeklyStudyHours}`);
    if (persona.remotePreference) p.push(`- Preferência de trabalho: ${persona.remotePreference}`);
    if (persona.willingToRelocate != null) p.push(`- Disponibilidade para mudança: ${persona.willingToRelocate ? "sim" : "não"}`);
    if (persona.shortTermGoal) p.push(`- Meta de curto prazo: ${persona.shortTermGoal}`);
    if (persona.mediumTermGoal) p.push(`- Meta de médio prazo: ${persona.mediumTermGoal}`);
    if (persona.longTermGoal) p.push(`- Meta de longo prazo: ${persona.longTermGoal}`);

    if (p.length > 2) {
      // Has persona data beyond the header
      p.push("");
      p.push("Use essas informações para dar conselhos mais direcionados e relevantes ao usuário.");
      lines.push(...p);
    }
  }

  return lines.join("\n");
}

export async function generateChatResponse(
  messages: ChatMessage[],
  persona?: PersonaSnapshot,
): Promise<string> {
  const systemPrompt = buildSystemPrompt(persona);

  const response = await model.invoke([
    new SystemMessage(systemPrompt),
    ...messages.map((m) =>
      m.role === "user" ? new HumanMessage(m.content) : new AIMessage(m.content)
    ),
  ]);

  let content = (response.content as string) ?? "";

  if (content.length > MAX_OUTPUT_CHARS) {
    content = content.slice(0, MAX_OUTPUT_CHARS).trimEnd();
  }

  return content;
}
