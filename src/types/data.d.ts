export type InsightType = {
  hero: {
    title: string
    subtitle: string
    anchor: string
  },
  marketSnapshot: {
    title: string
    items: {
      icon: string
      description: string
    }[]
  },
  compensation: {
    title: string
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