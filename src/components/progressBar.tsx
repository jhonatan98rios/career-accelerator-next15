"use client";

import { useEffect } from "react";

interface Props {
  progress: number;
}

export function ProgressBar({ progress }: Props) {
  useEffect(() => {
    if (progress) {
      
    }
  }, [progress]);

  return (
    <div className="w-full h-2 bg-gray-200 overflow-hidden mt-8">
      <div className="h-full bg-gray-400 ">
        <div style={{ width: `${progress}%` }} className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 transition-all duration-500 ease-out" />
      </div>
    </div>
  )
}
