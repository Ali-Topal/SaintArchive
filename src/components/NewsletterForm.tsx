"use client";

import { useState } from "react";

type NewsletterFormProps = {
  showHeading?: boolean;
};

export default function NewsletterForm({ showHeading = true }: NewsletterFormProps) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!email) {
      setStatus("error");
      setMessage("Enter a valid email.");
      return;
    }

    setStatus("loading");
    setMessage(null);

    try {
      const response = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok && !data.message) {
        throw new Error(data.error ?? "Unable to join right now.");
      }

      setStatus("success");
      setMessage(data.message ?? "You're on the list.");
      setEmail("");
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Failed to join.");
    }
  };

  return (
    <div className="rounded-2xl border border-neutral-800 bg-[#0b0b0b] p-5">
      {showHeading && (
        <>
          <p className="text-xs uppercase tracking-[0.6em] text-muted">
            Stay in the circle
          </p>
          <h3 className="mt-2 text-2xl font-light tracking-[0.2em] text-foreground">
            New drops & early access
          </h3>
        </>
      )}
      <form
        onSubmit={handleSubmit}
        className="mt-6 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center"
      >
        <input
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@email.com"
          className="flex-1 rounded-full border border-white/15 bg-transparent px-6 py-3 text-sm text-foreground focus:border-accent focus:outline-none"
        />
        <button
          type="submit"
          disabled={status === "loading"}
          className="rounded-full border border-white px-6 py-3 text-xs font-semibold uppercase tracking-[0.3em] text-white transition hover:bg-white hover:text-black disabled:opacity-50"
        >
          {status === "loading" ? "Joining..." : "Join the circle"}
        </button>
      </form>
      {message && (
        <p
          className={`mt-3 text-xs ${
            status === "success" ? "text-accent" : "text-red-400"
          }`}
        >
          {message}
        </p>
      )}
    </div>
  );
}

