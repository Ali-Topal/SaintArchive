"use client";

import { useMemo } from "react";

type TopBlurProps = {
  height?: string;
  strength?: number;
  divCount?: number;
  exponential?: boolean;
};

// Bezier curve for smooth progression
const bezierCurve = (p: number) => p * p * (3 - 2 * p);

export default function TopBlur({
  height = "7.5rem",
  strength = 2,
  divCount = 5,
  exponential = true,
}: TopBlurProps) {
  const blurDivs = useMemo(() => {
    const divs: React.ReactNode[] = [];
    const increment = 100 / divCount;

    for (let i = 1; i <= divCount; i++) {
      let progress = i / divCount;
      progress = bezierCurve(progress);

      // Calculate blur value
      let blurValue: number;
      if (exponential) {
        blurValue = Math.pow(2, progress * 4) * 0.0625 * strength;
      } else {
        blurValue = 0.0625 * (progress * divCount + 1) * strength;
      }

      // Calculate gradient stops for mask
      const p1 = Math.round((increment * i - increment) * 10) / 10;
      const p2 = Math.round(increment * i * 10) / 10;
      const p3 = Math.round((increment * i + increment) * 10) / 10;
      const p4 = Math.round((increment * i + increment * 2) * 10) / 10;

      let gradient = `transparent ${p1}%, black ${p2}%`;
      if (p3 <= 100) gradient += `, black ${p3}%`;
      if (p4 <= 100) gradient += `, transparent ${p4}%`;

      // Direction is "to top" since we want blur at top fading down
      const maskGradient = `linear-gradient(to top, ${gradient})`;

      divs.push(
        <div
          key={i}
          style={{
            position: "absolute",
            inset: 0,
            maskImage: maskGradient,
            WebkitMaskImage: maskGradient,
            backdropFilter: `blur(${blurValue.toFixed(3)}rem)`,
            WebkitBackdropFilter: `blur(${blurValue.toFixed(3)}rem)`,
          }}
        />
      );
    }

    return divs;
  }, [divCount, strength, exponential]);

  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-0 z-40"
      style={{
        height,
        isolation: "isolate",
      }}
    >
      <div
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
        }}
      >
        {blurDivs}
      </div>
    </div>
  );
}
