export type DataType = {
  hero: {
    title: string
    subtitle: string
  },
  marketSnapshot: {
    items: {
      icon: string
      description: string
    }[]
  },
  compensation: {
    items: {
      label: string
      value: string
    }[]
  },
  globalOpportunities: {
    title: string
    subtitle: string
    cards: {
      title: string
      description: string
      bgColor: string
    }[]
  },
  bigTechHiring: {
    title: string
    items: {
      company: string
      details: string
    }[]
  },
  roadmap: {
    title: string
    subtitle: string
    steps: {
      step: number
      title: string
      description: string
    }[]
  },
  finalCta: {
    title: string
    subtitle: string
    cta: {
      text: string
      href: string
    }
  },
  footer: {
    text: string
  }
}

export const data: DataType = {
  "hero": {
    "title": "Become a Python Backend Pro",
    "subtitle": "Deep expertise • Top demand • Global & Remote • High pay",
  },
  "marketSnapshot": {
    "items": [
      {
        "icon": "🔥",
        "description": "<strong>11,000+</strong> Python Developer jobs on LinkedIn (US) & <strong>1,033,000+</strong> global listings"
      },
      {
        "icon": "🌐",
        "description": "<strong>3,406</strong> Python Web roles on Indeed; <strong>71,000+</strong> general Python jobs"
      },
      {
        "icon": "💼",
        "description": "<strong>17,900+</strong> Python Dev roles on Glassdoor, avg salary <strong>$97K–$167K</strong>"
      }
    ]
  },
  "compensation": {
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
