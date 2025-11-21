"use client";

/* eslint-disable @next/next/no-img-element */

import { useState } from "react";

type RaffleImageCarouselProps = {
  images: string[];
  title: string;
  showControls?: boolean;
};

export default function RaffleImageCarousel({
  images,
  title,
  showControls = true,
}: RaffleImageCarouselProps) {
  const [index, setIndex] = useState(0);
  const [startX, setStartX] = useState<number | null>(null);
  const [endX, setEndX] = useState<number | null>(null);

  if (images.length === 0) {
    return (
      <div className="flex aspect-square w-full items-center justify-center rounded-xl border border-neutral-800 bg-black/20 text-white/60">
        Image coming soon
      </div>
    );
  }

  const currentImage = images[index];

  const handleTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    const touch = event.touches[0];
    setStartX(touch.clientX);
    setEndX(null);
  };

  const handleTouchMove = (event: React.TouchEvent<HTMLDivElement>) => {
    const touch = event.touches[0];
    setEndX(touch.clientX);
  };

  const handleTouchEnd = () => {
    if (startX === null || endX === null) {
      setStartX(null);
      setEndX(null);
      return;
    }

    const delta = startX - endX;
    const threshold = 30;
    if (delta > threshold) {
      goNext();
    } else if (delta < -threshold) {
      goPrevious();
    }
    setStartX(null);
    setEndX(null);
  };

  const goPrevious = () => {
    setIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const goNext = () => {
    setIndex((prev) => (prev + 1) % images.length);
  };

  return (
    <div
      className="relative flex aspect-square w-full items-center justify-center overflow-hidden rounded-xl border border-neutral-800 bg-black/30"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <img
        src={currentImage}
        alt={title}
        className="h-full w-full object-cover object-center"
      />
      {showControls && images.length > 1 && (
        <>
          <button
            type="button"
            onClick={goPrevious}
            aria-label="Previous image"
            className="absolute left-3 top-1/2 hidden -translate-y-1/2 rounded-full border border-white/40 bg-black/40 p-2 text-2xl leading-none text-white hover:bg-black/60 md:inline-flex"
          >
            ←
          </button>
          <button
            type="button"
            onClick={goNext}
            aria-label="Next image"
            className="absolute right-3 top-1/2 hidden -translate-y-1/2 rounded-full border border-white/40 bg-black/40 p-2 text-2xl leading-none text-white hover:bg-black/60 md:inline-flex"
          >
            →
          </button>
          <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
            {images.map((_, dotIdx) => (
              <span
                key={`dot-${dotIdx}`}
                className={`h-1.5 w-1.5 rounded-full ${
                  dotIdx === index ? "bg-white" : "bg-white/30"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

