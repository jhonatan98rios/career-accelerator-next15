import { InsightType } from "@/types/data";

const example: InsightType = {
  "hero": {
    "title": "Become a Python Backend Pro",
    "subtitle": "Deep expertise • Top demand • Global & Remote • High pay",
    "anchor": "Start Your Journey"
  },
  "marketSnapshot": {
    "title": "Real Demand, Real Numbers",
    "items": [
      {
        "icon": "🔥",
        "description": "11,000+ Python Developer jobs on LinkedIn (US) & 1,033,000+ global listings"
      },
      {
        "icon": "🌐",
        "description": "3,406 Python Web roles on Indeed; 71,000+ general Python jobs"
      },
      {
        "icon": "💼",
        "description": "17,900+ Python Dev roles on Glassdoor, avg salary $97K–$167K"
      }
    ]
  },
  "compensation": {
    "title": "Compensation & Benefits",
    "items": [
      {
        "label": "US Average Salary",
        "value": "$126,600 / year"
      },
      {
        "label": "Europe Average Salary",
        "value": "€83,000 / year"
      },
      {
        "label": "Asian Average Salary",
        "value": "$137,980 / year"
      },
      {
        "label": "Remote Roles Avg",
        "value": "$112,700 / year"
      },
      {
        "label": "Top 10% Earn",
        "value": "Up to $186,000"
      }
    ]
  },
  "globalOpportunities": {
    "title": "Work from Anywhere",
    "subtitle": "Python roles span 50+ countries; companies in Canada, UK, UAE, and more sponsor visas or hire fully remote.",
    "cards": [
      {
        "title": "Remote-OK",
        "description": "1,093,757 total remote jobs",
        "bgColor": "bg-indigo-700"
      },
      {
        "title": "Travel Tech",
        "description": "Booking platforms & hospitality CRMs hire globally",
        "bgColor": "bg-purple-700"
      },
      {
        "title": "Visa Sponsorship",
        "description": "Roles in Canada, UK, UAE, and more",
        "bgColor": "bg-indigo-700"
      },
      {
        "title": "Networking",
        "description": "Work from anywhere with the best professionals in the world",
        "bgColor": "bg-purple-700"
      },
      {
        "title": "Best Salaries",
        "description": "Find the highest salaries and get paid in globally valued currencies",
        "bgColor": "bg-indigo-700"
      },

    ]
  },
  "bigTechHiring": {
    "title": "Hiring Now: Big Tech & Startups",
    "items": [
      {
        "company": "Google",
        "details": "1,000+ Python roles (16% remote)"
      },
      {
        "company": "Amazon",
        "details": "372+ Python Developer listings in US"
      },
      {
        "company": "Meta",
        "details": "200+ Python-heavy engineering roles"
      },
      {
        "company": "Startups",
        "details": "SaaS, fintech, AI, travel-tech scale-ups hiring now"
      }
    ]
  },
  "roadmap": {
    "title": "Your Python Backend Roadmap",
    "subtitle": "Laser-focus your study and avoid wasted effort.",
    "steps": [
      {
        "step": 1,
        "title": "Setup, Basics & Core Python Concepts",
        "description": "Install Python and set up a code editor like VS Code or PyCharm. Learn Python syntax, variables, data types, operators, conditional statements, loops, and input/output functions. Start small exercises to reinforce learning. Keywords: Python install, Python syntax, variables, loops, if else. This step is essential because understanding the fundamentals is the foundation for all future Python development."
      },
      {
        "step": 2,
        "title": "Functions, Modules & File Handling",
        "description": "Learn how to define functions, use arguments, return values, and understand scope. Explore Python modules (standard library and third-party) and how to import them. Learn file handling (read/write text, CSV, JSON) and exception handling (try, except, finally). Keywords: Python functions, modules, file I/O, exceptions. This step teaches code organization, reusability, and error management, which are crucial for professional development."
      },
      {
        "step": 3,
        "title": "Object-Oriented Programming & Intermediate Python",
        "description": "Dive into classes, objects, attributes, methods, inheritance, encapsulation, and polymorphism. Learn intermediate Python concepts like list comprehensions, lambda functions, map/filter/reduce, decorators, generators, and context managers. Solve coding exercises on platforms like LeetCode or HackerRank. Keywords: Python OOP, classes, decorators, generators, problem solving. These skills are vital for building scalable projects and improving problem-solving efficiency."
      },
      {
        "step": 4,
        "title": "Python Libraries & Small Projects",
        "description": "Learn key libraries: NumPy (numerical operations), pandas (data analysis), matplotlib/seaborn (visualization), requests (HTTP requests). Apply knowledge by building small projects like a calculator, web scraper, or basic data analysis report. Keywords: NumPy, pandas, matplotlib, requests, Python projects. Libraries expand your capabilities and projects help consolidate learning while providing practical experience."
      },
      {
        "step": 5,
        "title": "Web Development, APIs & Git",
        "description": "Learn HTTP, REST API concepts, and basic web development. Build a simple CRUD web application with Flask or Django. Learn Git version control (init, clone, commit, push, pull, branching) and host projects on GitHub. Keywords: Flask, Django, REST API, CRUD, Git, GitHub. This step opens doors to real-world applications, teamwork, and professional collaboration, which are highly valued in careers."
      },
      {
        "step": 6,
        "title": "Portfolio, Career Building & Advanced Projects",
        "description": "Create 2-3 intermediate projects (web app, API, data analysis dashboard). Document them clearly on GitHub with detailed README, screenshots, and instructions. Build a LinkedIn profile showcasing your skills, projects, and learning journey. Keywords: Python portfolio, GitHub README, LinkedIn, career development. This final step is critical for demonstrating skills to employers, creating a professional presence, and launching your Python career."
      }
    ]
  },
  "finalCta": {
    "title": "Your Future Starts Now",
    "subtitle": "Master Python backend, unlock global roles & life-changing opportunities.",
    "cta": {
      "text": "Dive In Today",
      "href": "https://www.udemy.com/courses/search/?src=ukw&q=python&sort=relevance&ratings=4.5&lang=en"
    }
  },
  "footer": {
    "text": "Data as of August 3, 2025 • LinkedIn • Glassdoor • Indeed • Remote-OK"
  }
}

export const getSystemPrompt = () => `
  You are an API that work as expert career coach.
  Your task is open job sites (indeed, LinkedIn, remote.ok, etc) and look how many open positions are available for the given profile.
  Then, use the following received data to generate a personalized career insight for a user based on their profile and answers.
  The insight should be a single json (as a API) following this structure (you cannot change the structure, because the frontend will not work):

  ${JSON.stringify(example)}

  You also need to generate a 6 months (short term) career roadmap based on the given career insight description. 
  You should always to create achievable steps, that can be completed in a month each. Be very descriptive in each step.
  The user has no prior experience, so the roadmap should start from the basics and gradually progress to more advanced topics.
  Do not repeat steps! The user is expecting to learn new things, not the same things again.
  The roadmap should be part of the json, inside the "roadmap" field.
`

export const getUserPrompt = (answers: Record<string, string>, manualDescription: string) => `
  Generate a personalized and translated career insight based on the following data and language:
  - Answers: ${JSON.stringify(answers)}
  - Manual Description: ${manualDescription}

  Use the latest job market data and trends to provide a comprehensive overview of opportunities, challenges, and recommendations for the user.
`

export const getRoadmapSystemPrompt = () => `
  You are an API that work as expert career coach.
  Your task is to create a 6 month (short term) career roadmap based on the given career insight description. 
  You should always to create achievable steps, that can be completed in a month each.
  The user has already completed the previous career roadmap, and now wants to continue their learning journey with the next steps.
  Do not repeat steps! The user is expecting to learn new things, not the same things again.
  The roadmap should be a single json (as a API) following the same structure as the previous roadmap (you cannot change the structure, because the frontend will not work):
`

export const getRoadmapUserPrompt = (oldSteps: any[]) => `
  Generate a personalized and translated (use the same language as in the previous steps) career roadmap based on the "Old Steps" data and language:
  - Old Steps: ${JSON.stringify(oldSteps)}

  And be sure to NOT start the steps count from scratch. The order should be continuous.
`