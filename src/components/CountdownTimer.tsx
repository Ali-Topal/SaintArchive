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
  totalSeconds: number;
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
      totalSeconds: 0,
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

  return { closed: false, totalSeconds, days, hours, minutes, seconds };
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

  const isClosed = timeParts.closed;
  const totalSeconds = isClosed
    ? 0
    : timeParts.days * 86400 + timeParts.hours * 3600 + timeParts.minutes * 60 + timeParts.seconds;

  let urgencyClass = "text-gray-300";
  let microCopy: string | null = null;

  if (isClosed) {
    urgencyClass = "text-white/40";
    microCopy = "Entries closed";
  } else if (totalSeconds <= 10) {
    urgencyClass = "text-red-600 animate-pulseHard animate-shake";
    microCopy = "🚨 FINAL SECONDS — ENTER NOW!";
  } else if (totalSeconds <= 600) {
    urgencyClass = "text-red-500 animate-pulseHard";
    microCopy = "🔥 Nearly over — last chance!";
  } else if (totalSeconds <= 3600) {
    urgencyClass = "text-yellow-300 animate-pulseSoft";
    microCopy = "⏳ Getting close…";
  }

  const formattedSegments = [
    { label: "days", value: timeParts.days, aria: `${timeParts.days} days remaining` },
    { label: "hours", value: timeParts.hours, aria: `${timeParts.hours} hours remaining` },
    { label: "min", value: timeParts.minutes, aria: `${timeParts.minutes} minutes remaining` },
    { label: "sec", value: timeParts.seconds, aria: `${timeParts.seconds} seconds remaining` },
  ];

  const wrapperClassName = [
    "flex flex-col items-center text-center",
    variant === "compact" ? "gap-2" : "gap-3",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const valueClassName =
    variant === "compact"
      ? `countdown font-mono text-3xl sm:text-4xl ${urgencyClass}`
      : `countdown font-mono text-4xl sm:text-5xl lg:text-6xl font-bold ${urgencyClass}`;

  const microCopyClassName =
    isClosed
      ? "text-sm uppercase tracking-[0.3em] text-white/60"
      : totalSeconds <= 600
        ? "text-sm font-medium text-red-400"
        : "text-sm text-white/70";

  return (
    <div className={wrapperClassName}>
      <div className="grid auto-cols-max grid-flow-col gap-5">
        {formattedSegments.map((segment) => (
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
      {microCopy && <p className={microCopyClassName}>{microCopy}</p>}
    </div>
  );
}

