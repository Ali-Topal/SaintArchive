"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";

type CopyButtonProps = {
  text: string;
  className?: string;
  small?: boolean;
};

export default function CopyButton({ text, className = "", small = false }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const sizeClasses = small
    ? "gap-1 rounded-md px-2 py-1 text-[10px]"
    : "gap-1.5 rounded-lg px-3 py-1.5 text-xs";

  const iconSize = small ? "h-3 w-3" : "h-3.5 w-3.5";

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={`inline-flex items-center border border-white/20 text-white/70 transition hover:border-white/40 hover:text-white ${sizeClasses} ${className}`}
      title="Copy to clipboard"
    >
      {copied ? (
        <>
          <Check className={`${iconSize} text-green-400`} />
          <span className="text-green-400">Copied!</span>
        </>
      ) : (
        <>
          <Copy className={iconSize} />
          <span>Copy</span>
        </>
      )}
    </button>
  );
}
