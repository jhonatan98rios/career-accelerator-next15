"use client";

import { useState } from "react";
import { dismissOnboarding } from "@/app/actions/onboarding";

const STEPS = [
  {
    title: "Boas-vindas! 🚀",
    message:
      "AcelerAi te ajuda a entender o mercado de trabalho e a escolher as melhores oportunidades com dados reais. Vamos te mostrar como!",
    buttonLabel: "Próximo",
  },
  {
    title: "📊 Insights de Carreira",
    message:
      "Com nossos insights, você descobre quais skills estão em alta, faixas salariais reais e o que as empresas realmente pedem — tudo baseado em dados do mercado.",
    buttonLabel: "Próximo",
  },
  {
    title: "🗺️ Roadmap Personalizado",
    message:
      "Depois de gerar um insight, você recebe um roadmap com metas de curto prazo para alcançar seus objetivos e evoluir na carreira.",
    buttonLabel: "Começar",
  },
];

export default function OnboardingTour() {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [isDismissing, setIsDismissing] = useState(false);

  const handleDismiss = async () => {
    if (isDismissing) return;
    setIsDismissing(true);
    try {
      await dismissOnboarding();
    } finally {
      setIsVisible(false);
    }
  };

  const handleNext = async () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      await handleDismiss();
    }
  };

  if (!isVisible) return null;

  const step = STEPS[currentStep];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60" />

      {/* Modal card */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 z-10">
        {/* X close button */}
        <button
          onClick={handleDismiss}
          disabled={isDismissing}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
          aria-label="Fechar"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Step content */}
        <div className="text-center mt-4">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">{step.title}</h2>
          <p className="text-gray-600 leading-relaxed">{step.message}</p>
        </div>

        {/* Step dots */}
        <div className="flex justify-center gap-2 mt-8">
          {STEPS.map((_, index) => (
            <span
              key={index}
              className={`block h-2 w-2 rounded-full transition-colors ${
                index === currentStep ? "bg-purple-500" : "bg-gray-300"
              }`}
            />
          ))}
        </div>

        {/* Next / Dismiss button */}
        <button
          onClick={handleNext}
          disabled={isDismissing}
          className="mt-6 w-full py-3 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-bold text-lg hover:scale-105 transition-transform disabled:opacity-50 disabled:hover:scale-100"
        >
          {step.buttonLabel}
        </button>
      </div>
    </div>
  );
}
