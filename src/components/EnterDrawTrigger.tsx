"use client";

import { useState } from "react";
import EnterDrawModal from "./EnterDrawModal";

type EnterDrawTriggerProps = {
  raffleId: string;
  title: string;
  ticketPriceCents: number;
  maxEntriesPerUser?: number | null;
  options?: string[] | null;
  buttonLabel?: string;
  buttonClassName?: string;
};

export default function EnterDrawTrigger({
  raffleId,
  title,
  ticketPriceCents,
  maxEntriesPerUser,
  options,
  buttonLabel = "Enter draw",
  buttonClassName,
}: EnterDrawTriggerProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={
          buttonClassName ??
          "inline-flex w-full items-center justify-center rounded-full border border-white/40 px-6 py-3 text-xs font-semibold uppercase tracking-[0.3em] text-white transition hover:border-white"
        }
      >
        {buttonLabel}
      </button>

      <EnterDrawModal
        isOpen={open}
        onClose={() => setOpen(false)}
        raffleId={raffleId}
        title={title}
        ticketPriceCents={ticketPriceCents}
        maxEntriesPerUser={maxEntriesPerUser}
        options={options}
      />
    </>
  );
}

