import { Schema, Document, model, Types, models } from 'mongoose';


export interface ICareerInsight extends Document {
  user_id: Types.ObjectId;
  hero: {
    title: string;
    subtitle: string;
    anchor: string;
  };
  marketSnapshot: {
    title: string;
    items: {
      icon: string;
      description: string;
    }[];
  };
  compensation: {
    title: string;
    items: {
      label: string;
      value: string;
    }[];
  };
  globalOpportunities: {
    title: string;
    subtitle: string;
    cards: {
      title: string;
      description: string;
      bgColor: string;
    }[];
  };
  bigTechHiring: {
    title: string;
    items: {
      company: string;
      details: string;
    }[];
  };
  roadmap: {
    title: string;
    subtitle: string;
    steps: {
      step: number;
      title: string;
      description: string;
    }[];
  };
  finalCta: {
    title: string;
    subtitle: string;
    cta: {
      text: string;
      href: string;
    };
  };
  footer: {
    text: string;
  };
  createdAt: Date
}

const CareerInsightSchema = new Schema<ICareerInsight>(
  {
    user_id: { type: Schema.Types.ObjectId, ref: "User", required: true },
    hero: {
      title: { type: String, required: true },
      subtitle: { type: String, required: true },
      anchor: { type: String, required: true },
    },
    marketSnapshot: {
      title: { type: String, required: true },
      items: [
        {
          icon: { type: String, required: true },
          description: { type: String, required: true },
        },
      ],
    },
    compensation: {
      title: { type: String, required: true },
      items: [
        {
          label: { type: String, required: true },
          value: { type: String, required: true },
        },
      ],
    },
    globalOpportunities: {
      title: { type: String, required: true },
      subtitle: { type: String, required: true },
      cards: [
        {
          title: { type: String, required: true },
          description: { type: String, required: true },
          bgColor: { type: String, required: true },
        },
      ],
    },
    bigTechHiring: {
      title: { type: String, required: true },
      items: [
        {
          company: { type: String, required: true },
          details: { type: String, required: true },
        },
      ],
    },
    roadmap: {
      title: { type: String, required: true },
      subtitle: { type: String, required: true },
      steps: [
        {
          step: { type: Number, required: true },
          title: { type: String, required: true },
          description: { type: String, required: true },
        },
      ],
    },
    finalCta: {
      title: { type: String, required: true },
      subtitle: { type: String, required: true },
      cta: {
        text: { type: String, required: true },
        href: { type: String, required: true },
      },
    },
    footer: {
      text: { type: String, required: true },
    },
  },
  {
    timestamps: true, // adds createdAt & updatedAt
  }
);

export const CareerInsight = models.CareerInsight || model<ICareerInsight>("CareerInsight", CareerInsightSchema);