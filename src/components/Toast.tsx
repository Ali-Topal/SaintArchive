"use client";

import { useEffect, useState } from "react";

type ToastProps = {
  message: string;
  duration?: number;
  cookiePath: string;
};

export default function Toast({ message, duration = 3000, cookiePath }: ToastProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timeout = setTimeout(() => setVisible(false), duration);
    return () => clearTimeout(timeout);
  }, [duration]);

  useEffect(() => {
    if (!visible) {
      document.cookie = `admin-toast=; Max-Age=0; path=${cookiePath}`;
    }
  }, [visible, cookiePath]);

  if (!visible) {
    return null;
  }

  return (
    <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full border border-white/30 bg-black/80 px-6 py-3 text-sm text-white shadow-xl">
      {message}
    </div>
  );
}

