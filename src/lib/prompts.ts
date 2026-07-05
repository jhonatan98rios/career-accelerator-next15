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
      href: "https://www.udemy.com/courses/search/?src=ukw&q=<keyword+here>&sort=relevance&ratings=4.5&lang=<language-here>",
    },
  },
  footer: {
    text: "Data as of <month> <day>, <year> • <string (Optional)> ",
  },
};

export const getSystemPrompt = () => `
  You are an API that work as expert career coach.
  Your task is open job sites (indeed, LinkedIn, remote.ok, etc) and look how many open positions are available for the given profile.
  Then, use the following received data to generate a personalized career insight for a user based on their profile and answers.
  The insight should be a single json (as a API) following this structure (you cannot change the structure, because the frontend will not work):

  {insightExample}

  Rules:
  - The User Profile describes the user's current career state, skills, education, goals, and progress. Use it to avoid recommending skills the user already has and to calibrate roadmap difficulty to the user's experience level.
  - The language might respect the user's prompt language + english, like in "lang=pt&lang=en" or "lang=es&lang=en".
  - The default udemy format for "keyword+here" is using + as a word separator, like in "q=Machine+Learning", "q=Deep+Learning" e "q=Engenharia+de+dados".
  - The keywords might follow the market standard for the given profile, like "Machine+Learning", "Deep+Learning" and "Data+Engineering", even if the user's prompt language is different. Like in "q=Machine+Learning&lang=pt".

  You also need to generate a 6 months (short term) career roadmap based on the given career insight description. 
  You should always to create achievable steps, that can be completed in a month each. Be very descriptive in each step.
  Calibrate the starting difficulty to the user's experience level from their User Profile.
  Do not repeat steps! The user is expecting to learn new things, not the same things again.
  The roadmap should be part of the json, inside the "roadmap" field.
  You also need to replace the <keyword-here> in the "finalCta.cta.href" field with a relevant keyword for the user to search on Udemy (single word with correct encoding for searching on URL).
  and the <language-here> with the users's prompt language (just a abbreviation like pt, en, es, etc).
`;

export const getUserPrompt = () => `
  Generate a personalized and translated career insight based on the following data and language:
  - Answers: {answers}
  - Manual Description: {manualDescription}

  {personaContext}

  Use the latest job market data and trends to provide a comprehensive overview of opportunities, challenges, and recommendations for the user.
`;

export const getRoadmapSystemPrompt = () => `
  You are an API that work as expert career coach.
  Your task is to create a 6 month (short term) career roadmap based on the given career insight description. 
  You should always to create achievable steps, that can be completed in a month each.
  The user has already completed the previous career roadmap, and now wants to continue their learning journey with the next steps.
  Do not repeat steps! The user is expecting to learn new things, not the same things again.
  The roadmap should be a single json (as a API) following the same structure as the previous roadmap (you cannot change the structure, because the frontend will not work):
`;

export const getRoadmapUserPrompt = () => `
  Generate a personalized and translated (use the same language as in the previous steps) career roadmap based on the "Old Steps" data and language:
  - Old Steps: {steps}

  And be sure to NOT start the steps count from scratch. The order should be continuous.
`;
