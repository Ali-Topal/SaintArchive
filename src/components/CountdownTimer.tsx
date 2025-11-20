"use client";

import type { CSSProperties } from "react";
import { useEffect, useMemo, useState } from "react";

type CountdownTimerProps = {
  targetDate: string | Date;
  className?: string;
  variant?: "default" | "compact";
};

type TimeParts = {
  closed: boolean;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
};

const countdownValueStyle = (value: number): CSSProperties =>
  ({
    "--value": value,
  } as CSSProperties);

const computeTimeParts = (target: Date): TimeParts => {
  const diff = target.getTime() - Date.now();

  if (Number.isNaN(target.getTime()) || diff <= 0) {
    return {
      closed: true,
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
    };
  }

  const totalSeconds = Math.floor(diff / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return { closed: false, days, hours, minutes, seconds };
};

export default function CountdownTimer({
  targetDate,
  className,
  variant = "default",
}: CountdownTimerProps) {
  const target = useMemo(
    () => (targetDate instanceof Date ? targetDate : new Date(targetDate)),
    [targetDate]
  );

  const [isMounted, setIsMounted] = useState(false);
  const [timeParts, setTimeParts] = useState<TimeParts>(() =>
    computeTimeParts(target)
  );

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsMounted(true);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTimeParts(computeTimeParts(target));

    const interval = window.setInterval(() => {
      setTimeParts(computeTimeParts(target));
    }, 1000);

    return () => window.clearInterval(interval);
  }, [target]);

  if (!isMounted) {
    return <span className={className}>Loading…</span>;
  }

  if (timeParts.closed) {
    return <span className={className}>Closed</span>;
  }

  const segments = [
    { label: "days", value: timeParts.days, aria: `${timeParts.days} days remaining` },
    { label: "hours", value: timeParts.hours, aria: `${timeParts.hours} hours remaining` },
    { label: "min", value: timeParts.minutes, aria: `${timeParts.minutes} minutes remaining` },
    { label: "sec", value: timeParts.seconds, aria: `${timeParts.seconds} seconds remaining` },
  ];

  const wrapperClassName = ["grid auto-cols-max grid-flow-col gap-5 text-center", className]
    .filter(Boolean)
    .join(" ");
  const valueClassName =
    variant === "compact"
      ? "countdown font-mono text-2xl"
      : "countdown font-mono text-4xl sm:text-5xl";

  return (
    <div className={wrapperClassName}>
      {segments.map((segment) => (
        <div key={segment.label} className="flex flex-col items-center gap-1 text-white">
          <span className={valueClassName}>
            <span
              style={countdownValueStyle(segment.value)}
              aria-live="polite"
              aria-label={segment.aria}
            >
              {segment.value}
            </span>
          </span>
          <span className="text-xs uppercase tracking-[0.3em] text-white/60">
            {segment.label}
          </span>
        </div>
      ))}
    </div>
  );
}

