"use client";

import { toggleStepStatus } from "@/app/actions/career_roadmap";
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


export function RoadmapUpdateButton({ roadmapId, jwtToken }: { roadmapId: string, jwtToken: string }) {

  const [isPending, startTransition] = useTransition();

  const submit = async () => {
    try {
      console.log('Form submitted with data:', { roadmapId });

      const res = await fetch('/api/roadmap', {
        method: 'POST',
        body: JSON.stringify({ roadmapId }),
        headers: {
          'Authorization': `Bearer ${jwtToken}`
        }
      })
  
      const data = await res.json()

      if (!data) {
        throw new Error('No data returned from API')
      }

      window.location.reload()

    }
    catch (err) {
      console.log('Error while generating the roadmap:', err)
    }
  }

  const handleSubmit = () => {
    if (isPending) return

    startTransition(async () => {
      await submit()
    })
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
      onClick={() => handleSubmit()}
      className="mt-10 px-8 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-bold hover:scale-105 transition-transform shadow-lg"
    >
      Solicitar proximos passos
    </button>
  )
}