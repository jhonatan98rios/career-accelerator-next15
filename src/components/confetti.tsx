"use client";

import { useEffect, useState } from "react";
import confetti from "canvas-confetti";

interface Props {
  allDone: boolean;
}

export function ConfettiOnComplete({ allDone }: Props) {
  const [hasFired, setHasFired] = useState(false);

  useEffect(() => {
    if (allDone && !hasFired) {
      confetti({
        particleCount: 400,
        spread: 250,
        origin: { y: 0.5 },

      });
      setHasFired(true);
    }
  }, [allDone, hasFired]);

  useEffect(() => {
    if (hasFired) {
        setHasFired(false);
    }
  }, [allDone]);

  if (!allDone) return null;

  return <></>;
}
