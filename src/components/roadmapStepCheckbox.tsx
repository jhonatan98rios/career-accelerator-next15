"use client";

import { toggleStepStatus } from "@/app/actions/carrer_roadmap";
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
      type="checkbox"
      defaultChecked={done}
      onChange={(e) => handleChange(e.target.checked)}
      disabled={isPending}
    />
  );
}
