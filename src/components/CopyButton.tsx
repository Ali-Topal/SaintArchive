"use client";

import { useCallback, useState } from "react";

type CopyButtonProps = {
  text: string;
  label?: string;
  className?: string;
};

export default function CopyButton({
  text,
  label = "Copy",
  className = "",
}: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleClick = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch (error) {
      console.error("[CopyButton] Failed to copy text:", error);
    }
  }, [text]);

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`rounded-full border border-white/20 px-2 py-1 text-[9px] tracking-[0.3em] text-white/60 transition hover:border-white/60 hover:text-white/90 ${className}`}
    >
      {copied ? "Copied" : label}
    </button>
  );
}

