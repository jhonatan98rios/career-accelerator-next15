"use client";

import { toggleStepStatus, generateNextSteps } from "@/app/actions/carrer_roadmap";
import { useTransition } from "react";

export function RoadmapStepCheckbox({ roadmapId, stepId, done }: { 
  roadmapId: string; 
  stepId: string; 
  done: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  const handleChange = (checked: boolean) => {
    startTransition(async () => {
      await toggleStepStatus(roadmapId, stepId, checked);
    });
  };

  return (
    <input
      id={stepId}
      type="checkbox"
      defaultChecked={done}
      onChange={(e) => handleChange(e.target.checked)}
      disabled={isPending}
      className="min-h-4 min-w-4 accent-blue-600 rounded mt-auto mb-auto mr-2 cursor-pointer "
    />
  );
}


export function RoadmapUpdateButton({ roadmapId }: { roadmapId: string }) {

  const [isPending, startTransition] = useTransition();

  const handleChange = (checked: boolean) => {
    startTransition(async () => {
      await generateNextSteps(roadmapId);
    });
  };

  if (isPending) {
    return (
      <button
        disabled
        className="mt-10 px-8 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-bold hover:scale-105 transition-transform shadow-lg opacity-50 cursor-not-allowed"
      >
        Carregando...
      </button>
    )
  }

  return (
    <button
      onClick={() => handleChange(true)}
      className="mt-10 px-8 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-bold hover:scale-105 transition-transform shadow-lg"
    >
      Solicitar proximos passos
    </button>
  )
}