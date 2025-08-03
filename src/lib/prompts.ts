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
      }
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
        "title": "Core & Frameworks",
        "description": "Python syntax, Flask/Django, FastAPI async."
      },
      {
        "step": 2,
        "title": "DB & ORM",
        "description": "PostgreSQL, Redis, SQLAlchemy/Django ORM."
      },
      {
        "step": 3,
        "title": "Docker & Cloud",
        "description": "Docker, AWS (EC2, ECS, Lambda), S3, IAM."
      },
      {
        "step": 4,
        "title": "CI/CD & Infra",
        "description": "GitHub Actions, GitLab CI, Terraform basics."
      },
      {
        "step": 5,
        "title": "Observability & Security",
        "description": "Prometheus/Grafana, structured logs, security fundamentals."
      }
    ]
  },
  "finalCta": {
    "title": "Your Future Starts Now",
    "subtitle": "Master Python backend, unlock global roles & life-changing opportunities.",
    "cta": {
      "text": "Dive In Today",
      "href": "https://docs.python.org/3/tutorial/"
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
`

export const getUserPrompt = (answers: Record<string, string>, manualDescription: string) => `
  Generate a personalized and translated career insight based on the following data and language:
  - Answers: ${JSON.stringify(answers)}
  - Manual Description: ${manualDescription}

  Use the latest job market data and trends to provide a comprehensive overview of opportunities, challenges, and recommendations for the user.
`