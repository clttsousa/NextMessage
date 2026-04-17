'use client';

import { useEffect, useState } from 'react';

export function AnimatedNumber({ value }: { value: number }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const duration = 700;
    const steps = 24;
    const stepMs = duration / steps;
    let current = 0;
    const increment = value / steps;

    const timer = setInterval(() => {
      current += increment;
      if (current >= value) {
        setDisplay(value);
        clearInterval(timer);
      } else {
        setDisplay(Math.round(current));
      }
    }, stepMs);

    return () => clearInterval(timer);
  }, [value]);

  return <>{display.toLocaleString('pt-BR')}</>;
}
