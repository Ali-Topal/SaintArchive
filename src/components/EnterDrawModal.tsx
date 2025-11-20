"use client";

import { useMemo, useState } from "react";

type EnterDrawModalProps = {
  isOpen: boolean;
  onClose: () => void;
  raffleId: string;
  title: string;
  ticketPriceCents: number;
};

const currencyFormatter = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP",
});

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const sizeOptions = ["S", "M", "L", "XL"] as const;
type SizeOption = (typeof sizeOptions)[number];

export default function EnterDrawModal({
  isOpen,
  onClose,
  raffleId,
  title,
  ticketPriceCents,
}: EnterDrawModalProps) {
  const [entryCount, setEntryCount] = useState(1);
  const [email, setEmail] = useState("");
  const [size, setSize] = useState<SizeOption | "">("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totalPrice = useMemo(
    () => ticketPriceCents * entryCount,
    [ticketPriceCents, entryCount]
  );

  const closeModal = () => {
    if (isSubmitting) return;
    setError(null);
    setEntryCount(1);
    setEmail("");
    setSize("");
    onClose();
  };

  const adjustEntryCount = (delta: number) => {
    setEntryCount((prev) => {
      const next = prev + delta;
      return Math.min(20, Math.max(1, next));
    });
  };

  const handleSubmit = async () => {
    if (!emailRegex.test(email.trim())) {
      setError("Enter a valid email.");
      return;
    }

    if (!size) {
      setError("Select a size.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          raffleId,
          ticketCount: entryCount,
          email: email.trim(),
          size,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error ?? "Unable to start checkout.");
      }

      const data = (await response.json()) as { url?: string };

      if (!data.url) {
        throw new Error("Missing checkout URL.");
      }

      window.location.href = data.url;
    } catch (submitError) {
      const message =
        submitError instanceof Error
          ? submitError.message
          : "Failed to start checkout.";
      setError(message);
      setIsSubmitting(false);
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border border-white/15 bg-[#050505] p-6 text-white">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-white/60">
              Enter the draw
            </p>
            <h2 className="text-2xl font-semibold">{title}</h2>
          </div>
          <button
            type="button"
            onClick={closeModal}
            className="rounded-full border border-white/20 px-3 py-1 text-xs uppercase tracking-[0.3em] text-white/60 hover:border-white/40"
          >
            Close
          </button>
        </div>

        <div className="mt-6 space-y-4 text-sm text-white/80">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.3em] text-white/60">
              Entries
            </p>
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => adjustEntryCount(-1)}
                disabled={entryCount <= 1 || isSubmitting}
                className="h-10 w-10 rounded-full border border-white/30 text-lg text-white disabled:opacity-40"
              >
                −
              </button>
              <span className="text-2xl font-semibold">{entryCount}</span>
              <button
                type="button"
                onClick={() => adjustEntryCount(1)}
                disabled={entryCount >= 20 || isSubmitting}
                className="h-10 w-10 rounded-full border border-white/30 text-lg text-white disabled:opacity-40"
              >
                +
              </button>
            </div>
            <p className="text-xs text-white/60">Min 1 · Max 20 entries</p>
          </div>

          <label className="block space-y-2">
            <span className="text-xs uppercase tracking-[0.3em] text-white/60">
              Email
            </span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-md border border-white/20 bg-transparent px-4 py-2 text-white focus:border-white focus:outline-none"
              placeholder="you@example.com"
              disabled={isSubmitting}
              required
            />
          </label>

          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.3em] text-white/60">
              Size
            </p>
            <div className="grid grid-cols-4 gap-2">
              {sizeOptions.map((option) => {
                const isSelected = size === option;
                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setSize(option)}
                    disabled={isSubmitting}
                    className={[
                      "rounded-md border px-3 py-2 text-sm font-semibold uppercase tracking-[0.2em] transition",
                      isSelected
                        ? "border-white bg-white text-black"
                        : "border-white/30 text-white hover:border-white/60",
                      isSubmitting ? "opacity-70" : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    aria-pressed={isSelected}
                  >
                    {option}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-between rounded-md border border-white/15 px-4 py-3">
            <span className="text-xs uppercase tracking-[0.3em] text-white/60">
              Total
            </span>
            <span className="text-lg font-semibold text-white">
              {currencyFormatter.format(totalPrice / 100)}
            </span>
          </div>
        </div>

        {error && (
          <p className="mt-4 text-xs text-red-400" role="alert">
            {error}
          </p>
        )}

        <button
          type="button"
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="mt-6 w-full rounded-full border border-white/30 bg-white px-6 py-3 text-sm font-semibold uppercase tracking-[0.3em] text-black transition hover:opacity-90 disabled:opacity-50"
        >
          {isSubmitting ? "Processing…" : "Secure Entries"}
        </button>
      </div>
    </div>
  );
}

