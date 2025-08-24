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
        "title": "Core & Frameworks",
        "description": "Master Python syntax and its main frameworks (Flask, Django, FastAPI). These are the tools companies expect you to know for building APIs and scalable services, and strong fundamentals here will make you productive from day one."
      },
      {
        "step": 2,
        "title": "Paradigms & Architectures",
        "description": "Understand OOP, functional programming, and design patterns. Explore Event-Driven and Clean Architecture. This knowledge allows you to design software that is robust, maintainable, and trusted in large-scale systems."
      },
      {
        "step": 3,
        "title": "Databases & ORM",
        "description": "Work with PostgreSQL, Redis, and ORMs like SQLAlchemy or Django ORM. Knowing how to model, query, and optimize data makes you invaluable for building real-world applications with reliable performance."
      },
      {
        "step": 4,
        "title": "Docker & Cloud",
        "description": "Learn Docker and cloud services (AWS EC2, ECS, Lambda, S3, IAM, Kubernetes). These skills make you capable of deploying and managing modern applications in production environments, a highly demanded ability in the job market."
      },
      {
        "step": 5,
        "title": "CI/CD & Infrastructure",
        "description": "Get hands-on with GitHub Actions, GitLab CI, and Terraform. Automating deployments and infrastructure proves that you can deliver software quickly and safely — a must-have for engineering teams today."
      },
      {
        "step": 6,
        "title": "Observability",
        "description": "Use Prometheus, Grafana, and structured logging to monitor applications. Observability is critical: it shows you can keep systems reliable under real-world conditions and resolve issues before they impact users."
      },
      {
        "step": 7,
        "title": "Cyber Security",
        "description": "Learn the fundamentals of application security. Understanding vulnerabilities and safe coding practices sets you apart, as security is no longer optional in today’s technology landscape."
      },
      {
        "step": 8,
        "title": "Performance",
        "description": "Dive into parallel computing and Async I/O. Optimizing performance is a skill that distinguishes senior engineers, allowing you to build systems that scale efficiently under heavy loads."
      },
      {
        "step": 9,
        "title": "Real-time Systems",
        "description": "Work with WebSockets, RPC, WebRTC, and Kafka. Real-time communication powers modern products — from chat apps to trading platforms — and mastering these technologies makes you stand out immediately."
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
`

export const getUserPrompt = (answers: Record<string, string>, manualDescription: string) => `
  Generate a personalized and translated career insight based on the following data and language:
  - Answers: ${JSON.stringify(answers)}
  - Manual Description: ${manualDescription}

  Use the latest job market data and trends to provide a comprehensive overview of opportunities, challenges, and recommendations for the user.
`