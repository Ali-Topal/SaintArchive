"use client";

import { useMemo, useState } from "react";

type EnterDrawPanelProps = {
  raffleId: string;
  ticketPriceCents: number;
  maxTickets?: number | null;
  maxEntriesPerUser?: number | null;
  currentEntriesCount: number;
};

const formatter = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP",
});

export default function EnterDrawPanel({
  raffleId,
  ticketPriceCents,
  maxTickets,
  maxEntriesPerUser,
  currentEntriesCount,
}: EnterDrawPanelProps) {
  const [ticketCount, setTicketCount] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ticketsLeft =
    typeof maxTickets === "number"
      ? Math.max(maxTickets - currentEntriesCount, 0)
      : null;

  const perUserLimit = Math.max(1, maxEntriesPerUser ?? 20);

  const maxSelectable = useMemo(() => {
    if (ticketsLeft !== null) {
      return Math.max(1, Math.min(perUserLimit, ticketsLeft));
    }
    return perUserLimit;
  }, [ticketsLeft, perUserLimit]);

  const pricePerTicket = ticketPriceCents / 100;
  const totalPrice = formatter.format(ticketCount * pricePerTicket);
  const priceLabel = formatter.format(pricePerTicket);

  const adjustCount = (delta: number) => {
    setTicketCount((prev) => {
      const next = prev + delta;
      if (next < 1) return 1;
      if (next > maxSelectable) return maxSelectable;
      return next;
    });
  };

  const onChange = (value: number) => {
    if (!Number.isFinite(value)) return;
    if (value < 1) {
      setTicketCount(1);
    } else if (value > maxSelectable) {
      setTicketCount(maxSelectable);
    } else {
      setTicketCount(value);
    }
  };

  const startCheckout = async () => {
    setError(null);
    setLoading(true);
    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ raffleId, ticketCount }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error ?? "Checkout failed");
      }

      const data = (await response.json()) as { url?: string };
      if (!data.url) {
        throw new Error("No checkout url returned");
      }
      window.location.href = data.url;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unable to start checkout";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 rounded-[28px] border border-white/10 bg-white/5/40 p-6">
      <div className="flex flex-wrap items-center justify-between gap-4 text-sm text-foreground/70">
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-muted">
            Ticket price
          </p>
          <p className="text-xl font-light text-foreground">{priceLabel}</p>
        </div>
        {ticketsLeft !== null && (
          <p className="text-xs uppercase tracking-[0.4em] text-muted">
            Tickets left:{" "}
            <span className="text-foreground">{ticketsLeft}</span>
          </p>
        )}
      </div>
      <div className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/5 p-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => adjustCount(-1)}
            className="rounded-full border border-white/20 px-3 py-2 text-lg text-foreground transition hover:border-accent"
          >
            −
          </button>
          <input
            type="number"
            min={1}
            max={maxSelectable}
            value={ticketCount}
            onChange={(event) => onChange(Number(event.target.value))}
            className="w-20 rounded-2xl border border-white/15 bg-transparent py-2 text-center text-lg text-foreground focus:border-accent focus:outline-none"
          />
          <button
            type="button"
            onClick={() => adjustCount(1)}
            className="rounded-full border border-white/20 px-3 py-2 text-lg text-foreground transition hover:border-accent"
          >
            +
          </button>
        </div>
        <div className="text-right">
          <p className="text-xs uppercase tracking-[0.4em] text-muted">
            Total
          </p>
          <p className="text-2xl font-light text-foreground">{totalPrice}</p>
        </div>
      </div>
      <div className="space-y-3">
        <button
          type="button"
          onClick={startCheckout}
          disabled={loading}
          className="w-full rounded-full border border-accent/60 bg-linear-to-r from-accent/80 to-accent px-10 py-3 text-sm font-semibold uppercase tracking-[0.4em] text-background transition duration-200 ease-out hover:shadow-[0_0_25px_rgba(210,165,78,0.45)] hover:scale-[1.01] disabled:opacity-50"
        >
          {loading ? "Processing..." : "Confirm & Pay"}
        </button>
        {error && (
          <p className="text-xs text-red-400">{error}</p>
        )}
      </div>
    </div>
  );
}

