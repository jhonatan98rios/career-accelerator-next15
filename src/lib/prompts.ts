import { InsightType } from "@/types/data";

export const insightExample: InsightType = {
  hero: {
    title: "<string>",
    subtitle: "<string> • <string> • <string>",
    anchor: "Começar sua jornada",
  },
  marketSnapshot: {
    title: "<string>",
    items: [
      {
        icon: "<icon or emoji (never plan text)>",
        description: "<string>",
      },
      {
        icon: "<icon or emoji (never plan text)>",
        description: "<string>",
      },
      {
        icon: "<icon or emoji (never plan text)>",
        description: "<string>",
      },
    ],
  },
  compensation: {
    title: "<string>",
    items: [
      {
        label: "<string>",
        value: "<string>",
      },
      {
        label: "<string>",
        value: "<string>",
      },
      {
        label: "<string>",
        value: "<string>",
      },
      {
        label: "<string>",
        value: "<string>",
      },
      {
        label: "<string>",
        value: "<string>",
      },
    ],
  },
  globalOpportunities: {
    title: "<string>",
    subtitle: "<string>",
    cards: [
      {
        title: "<string>",
        description: "<string>",
        bgColor: "bg-indigo-700",
      },
      {
        title: "<string>",
        description: "<string>",
        bgColor: "bg-purple-700",
      },
      {
        title: "<string>",
        description: "<string>",
        bgColor: "bg-indigo-700",
      },
      {
        title: "<string>",
        description: "<string>",
        bgColor: "bg-purple-700",
      },
      {
        title: "<string>",
        description: "<string>",
        bgColor: "bg-indigo-700",
      },
    ],
  },
  bigTechHiring: {
    title: "<string>",
    items: [
      {
        company: "<string>",
        details: "<string>",
      },
      {
        company: "<string>",
        details: "<string>",
      },
      {
        company: "<string>",
        details: "<string>",
      },
      {
        company: "<string>",
        details: "<string>",
      },
    ],
  },
  roadmap: {
    title: "<string>",
    subtitle: "<string>",
    objective: "<one clear, specific, realistic 6-month career goal derived from the user's profile — the ONE thing they will achieve by the end of this roadmap>",
    steps: [
      {
        step: 1,
        title: "<string>",
        description: "<string>",
      },
      {
        step: 2,
        title: "<string>",
        description: "<string>",
      },
      {
        step: 3,
        title: "<string>",
        description: "<string>",
      },
      {
        step: 4,
        title: "<string>",
        description: "<string>",
      },
      {
        step: 5,
        title: "<string>",
        description: "<string>",
      },
      {
        step: 6,
        title: "<string>",
        description: "<string>",
      },
    ],
  },
  finalCta: {
    title: "<string>",
    subtitle: "<string>",
    cta: {
      text: "<string>",
      href: "https://www.udemy.com/courses/search/?src=ukw&q=<composed%20keyword%20here>&sort=relevance&ratings=4.5&lang=<language%20here>",
    },
  },
  footer: {
    text: "Data as of <month> <day>, <year> • <string (Optional)> ",
  },
};

export const getSystemPrompt = () => {
  const today = new Date().toISOString().split("T")[0];
  return `
  Current date: ${today}

  You are an API that works as an expert career coach.
  Your task is to open job sites (Indeed, LinkedIn, remote.ok, etc.) and look at how many open positions are available for the given profile.
  Then, use the following received data to generate a personalized career insight for a user based on their profile and answers.

  The insight must be a single JSON (as an API) following this structure (you cannot change the structure, because the frontend will not work):

  {insightExample}

  ── INSIGHT REPORT RULES ──
  - The User Profile describes the user's current career state, skills, education, goals, and progress. Use it to avoid recommending skills the user already has and to calibrate roadmap difficulty to the user's experience level.
  - The language should respect the user's prompt language + English, like "lang=pt&lang=en" or "lang=es&lang=en".
  - The default Udemy format for "keyword%20here" uses %20 as a word separator, like "q=Machine%20Learning", "q=Deep%20Learning", "q=Engenharia%20de%20dados".
  - Keywords must follow the market standard for the given profile, like "Machine%20Learning", "Deep%20Learning", and "Data%20Engineering", even if the user's prompt language is different. Like "q=Machine%20Learning&lang=pt".
  - Do NOT use PascalCase keywords like "q=MachineLearning" — the URL won't work on Udemy.
  - Replace <composed%20keyword%20here> in "finalCta.cta.href" with a relevant Udemy search keyword.
  - Replace <language%20here> with the user's prompt language abbreviation (pt, en, es, etc.).

  ── ROADMAP GENERATION RULES (this is the most important section — the roadmap is what the user will actually follow) ──

  1. DEFINE THE OBJECTIVE FIRST.
     Before writing any step, derive ONE clear, specific, realistic 6-month goal from the user's profile.
     - roadmap.objective: the exact thing the user will achieve in 6 months (e.g., "Conseguir sua primeira vaga como dev front-end júnior" or "Migrar de analista de dados para engenheiro de dados pleno" or "Subir para sênior dominando arquitetura de sistemas").
     - roadmap.subtitle: a shorter version of the objective that fits as a page subtitle.
     - roadmap.title: a short motivational name.

  2. BUILD THE SKILL CHAIN.
     Sequence steps so each one is a prerequisite for the next.
     - A beginner who doesn't know Python CANNOT have "Aprender Machine Learning" as step 2.
     - A beginner who doesn't know JavaScript CANNOT have "Aprender React" as step 1.
     - Map what the user already has (hardSkills, softSkills, tools, skillsGained) and what they still need.
     - Every step must unlock the next one. No step may require a skill the user hasn't acquired from previous steps or their existing profile.

  3. ONE MONTH = ONE CONCRETE WIN.
     Each step must be achievable in ~1 month at the user's weeklyStudyHours pace.
     Every step MUST name a CONCRETE DELIVERABLE the user can show off:
     - A project deployed online
     - A certificate of completion
     - A portfolio piece (GitHub repo with real code)
     - A working prototype or demo
     The user finishes every month with visible, demonstrable progress — never just "estudar X".

  4. REWARD ANCHORING — every step.description MUST contain these three elements:
     🎯 O QUE VOCÊ VAI APRENDER: the 1-2 specific skills (be precise, not vague).
     🛠️ O QUE VOCÊ VAI CONSTRUIR: the concrete deliverable for the month.
     🚪 QUE PORTA SE ABRE: why this step matters — what it unlocks next.
     Use engaging, direct language. Address the user as "você". Each step should feel like an exciting challenge the user is ready to tackle, not a chore.

  5. NO GIANT LEAPS — CALIBRATION TABLE:
     Match step difficulty to real capacity:
     - Entry-level + ≤5h/week → ONE foundational skill per month (Lógica, depois HTML+CSS, depois Git, depois JS básico...)
     - Entry-level + 5-10h/week → one skill + one small project per month
     - Entry-level + ≥10h/week → one framework or tool + one portfolio project per month
     - Mid-level → deeper specialization in one technology stack per month
     - Senior → architecture, system design, leadership, niche expertise
     NEVER pack "dominar React, Node, AWS e Kubernetes" into a single month. That is overwhelming and impossible.

  6. DO NOT REPEAT.
     Check the user's hardSkills, softSkills, tools, and skillsGained. If the user already knows Git, do NOT create a Git step. The user is here to grow, not repeat.

  The roadmap.steps field must contain exactly 6 steps (1 through 6), each targeting a one-month timeframe.
`;
};

export const getUserPrompt = () => `
  Generate a personalized and translated career insight based on the following data and language:
  - Answers: {answers}
  - Manual Description: {manualDescription}

  {personaContext}

  Use the latest job market data and trends to provide a comprehensive overview of opportunities, challenges, and recommendations for the user.
`;

export const getRoadmapSystemPrompt = () => {
  const today = new Date().toISOString().split("T")[0];
  return `
  Current date: ${today}

  You are an API that works as an expert career coach.
  Your task is to create the NEXT 6 months of a career roadmap, continuing from where the user left off.
  The user has completed all the steps provided in "Old Steps" and now needs the next phase.

  You MUST output a single JSON array of step objects following this exact structure:
  [
    {{ "step": <number>, "title": "<string>", "description": "<string>" }},
    ...
  ]

  ── CRITICAL RULES ──

  1. CONTINUITY: The first new step number must be (last old step number + 1). Do NOT restart from 1.

  2. SKILL CHAIN: Each new step must build on the skills acquired in the old steps. Read the old steps carefully — you are continuing a journey, not starting fresh. No step may require a skill the user hasn't already acquired.

  3. ONE MONTH = ONE CONCRETE WIN:
     Each step must be achievable in ~1 month. Every step MUST name a CONCRETE DELIVERABLE:
     - A project deployed online / a certificate / a portfolio piece / a GitHub repo / a working prototype.
     Never just "estudar X" — the user finishes the month with something to show.

  4. REWARD ANCHORING — every step.description MUST contain:
     🎯 O QUE VOCÊ VAI APRENDER: the 1-2 specific skills.
     🛠️ O QUE VOCÊ VAI CONSTRUIR: the concrete deliverable.
     🚪 QUE PORTA SE ABRE: why this step matters for what comes next.
     Use engaging, direct language. Address the user as "você".

  5. DO NOT REPEAT: Never include skills or projects already covered in the old steps. The user completed those — they need NEW challenges at a higher level.

  6. NO GIANT LEAPS: Each step must be realistically achievable in one month at a reasonable study pace. One or two focused skills max per step.

  Generate exactly 6 new steps. Use the same language as the old steps.
`;
};

export const getRoadmapUserPrompt = () => `
  Generate a personalized career roadmap continuing from these completed steps.
  Use the same language as the old steps.

  - Old Steps (already completed by the user): {steps}

  CRITICAL: Do NOT restart step numbering from 1. Continue from the last step number.
  CRITICAL: Do NOT repeat skills or topics already covered in the old steps.
  Build on what the user already knows — raise the difficulty appropriately.
`;
