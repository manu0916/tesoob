'use client';

import { useEffect, useRef, useState } from 'react';

function remaining(target: string) {
  return Math.max(0, Date.parse(target) - Date.now());
}

export function DropCountdown({
  target,
  compact = false,
  onComplete,
}: {
  target: string;
  compact?: boolean;
  onComplete?: () => void;
}) {
  const [milliseconds, setMilliseconds] = useState(0);
  const completed = useRef(false);
  const complete = useRef(onComplete);

  useEffect(() => {
    complete.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    completed.current = false;
    const update = () => {
      const next = remaining(target);
      setMilliseconds(next);
      if (!next && !completed.current) {
        completed.current = true;
        complete.current?.();
      }
    };
    update();
    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, [target]);

  const totalSeconds = Math.floor(milliseconds / 1000);
  const values = [
    ['DIAS', Math.floor(totalSeconds / 86400)],
    ['HORAS', Math.floor((totalSeconds % 86400) / 3600)],
    ['MIN', Math.floor((totalSeconds % 3600) / 60)],
    ['SEG', totalSeconds % 60],
  ] as const;

  return (
    <div
      className={`store-drop-countdown${compact ? ' is-compact' : ''}`}
      aria-label="Contagem regressiva para o lançamento"
      aria-live={compact ? 'off' : 'polite'}
    >
      {values.map(([label, value]) => (
        <span key={label}>
          <strong>{String(value).padStart(2, '0')}</strong>
          <small>{label}</small>
        </span>
      ))}
    </div>
  );
}
