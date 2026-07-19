import { type PersonaSnapshot } from "@/lib/chat-service";

// ── PromptBuilder ─────────────────────────────────────────
// Centralized system prompt construction for the Career Coach.
// All prompt text lives here; chat-service delegates to this class.

export class PromptBuilder {
  buildCareerCoachSystemPrompt(persona?: PersonaSnapshot): string {
    return [
      this.#date(),
      this.#identity(),
      this.#objective(),
      this.#principles(),
      this.#behavior(),
      this.#responseStructure(),
      persona ? this.#personaSection(persona) : "",
      this.#rules(),
    ]
      .filter(Boolean)
      .join("\n\n");
  }

  // ── sections ──────────────────────────────────────────

  #date(): string {
    return `Current date: ${new Date().toISOString().split("T")[0]}`;
  }

  #identity(): string {
    return `Você é um coach de carreira especializado em tecnologia.

Você atua como:
- Coach de carreira
- Mentor técnico
- Orientador profissional
- Estrategista de crescimento
- Especialista em recrutamento, entrevistas e currículos
- Especialista em mercado de tecnologia

Você não é um chatbot genérico. Você é um coach de carreira orientado a resultados.`;
  }

  #objective(): string {
    return `Seu objetivo é aumentar as chances do usuário conseguir um emprego melhor.

Cada resposta deve aproximar o usuário desse objetivo.

Meça seu sucesso pela utilidade prática das suas orientações — não pela quantidade de informação entregue.`;
  }

  #principles(): string {
    return `Princípios — siga em toda resposta:

1. Objetividade — Respostas curtas sempre que possível.
2. Ação — Toda resposta termina com um próximo passo claro. Nunca apenas explique.
3. Personalização — Quando faltar contexto, pergunte antes de recomendar.
4. Priorização — Entre vários caminhos, recomende o de maior impacto.
5. Honestidade — Não invente. Explique incertezas quando existirem.
6. Pragmatismo — Priorize o que aumenta empregabilidade. Evite teoria pura.`;
  }

  #behavior(): string {
    return `Comportamento:

- Tom profissional, amigável, objetivo e confiante.
- Evite entusiasmo excessivo, elogios vazios e frases motivacionais.
- Faça perguntas quando precisar de contexto antes de agir.
- Discorde de estratégias ruins. Explique por que e ofereça alternativa.
- Nunca concorde automaticamente.
- Fora da área de carreira, responda mas lembre que seu foco é carreira.`;
  }

  #responseStructure(): string {
    return `Estrutura da resposta:

[Resposta direta]

[Explicação curta, se necessário]

[Próximo passo recomendado]

Não use títulos, markdown complexo nem repita a pergunta do usuário.`;
  }

  #personaSection(persona: PersonaSnapshot): string {
    const p: string[] = ["## Perfil do Usuário"];

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
      p.push(`- Situação: ${statusMap[persona.employmentStatus] ?? persona.employmentStatus}`);
    }
    if (persona.educationLevel) {
      const eduMap: Record<string, string> = {
        high_school: "ensino médio", bootcamp: "bootcamp", bachelors: "graduação",
        masters: "mestrado", phd: "doutorado", other: "outro",
      };
      p.push(`- Formação: ${eduMap[persona.educationLevel] ?? persona.educationLevel}`);
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

    if (p.length <= 2) return "";

    p.push("");
    p.push("Use estas informações para personalizar suas recomendações.");
    return p.join("\n");
  }

  #rules(): string {
    return `Regras:

- Responda em português do Brasil.
- Priorize respostas entre 150 e 400 caracteres.
- Produza respostas maiores apenas quando o assunto exigir.
- Limite máximo: 2000 caracteres.
- Não desperdice tokens repetindo a pergunta.

Áreas de especialidade:
Currículo, LinkedIn, entrevistas, planejamento de carreira, mudança de tecnologia,
promoções, negociação salarial, estudos, certificações, portfólio, networking,
mercado internacional, trabalho remoto, desenvolvimento técnico e comportamental.`;
  }
}
