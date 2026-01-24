"use client";

import { useRouter } from "next/navigation";
import { useCallback, type MouseEvent } from "react";

type BackToDropsButtonProps = {
  className?: string;
  fallbackHref?: string;
};

export default function BackToDropsButton({
  className,
  fallbackHref = "/",
}: BackToDropsButtonProps) {
  const router = useRouter();

  const handleClick = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      event.preventDefault();
      if (window.history.length > 1) {
        router.back();
        return;
      }
      router.push(fallbackHref, { scroll: false });
    },
    [router, fallbackHref]
  );

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`text-sm text-white/60 transition hover:text-white ${className ?? ""}`}
    >
      ← Back to Shop
    </button>
  );
}

