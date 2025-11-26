import Link from "next/link";
import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import CopyButton from "@/components/CopyButton";

const formatDate = (value: string | null) => {
  if (!value) return "TBA";
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) return "TBA";
  return date.toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
};

async function updateRaffleStatus(formData: FormData) {
  "use server";

  const raffleId = formData.get("raffleId")?.toString();
  const status = formData.get("status")?.toString();

  if (!raffleId || !status) {
    throw new Error("Missing parameters");
  }

  const supabase = supabaseAdmin();
  const { error } = await supabase
    .from("raffles")
    .update({ status })
    .eq("id", raffleId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/");
  revalidatePath("/winners");
  revalidatePath("/admin");
}

type AdminPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdminPage({ searchParams }: AdminPageProps = {}) {
  const resolvedSearchParams =
    searchParams !== undefined
      ? await searchParams
      : ({} as Record<string, string | string[] | undefined>);

  const statusFilterRaw = resolvedSearchParams.status;
  const statusFilter = Array.isArray(statusFilterRaw)
    ? statusFilterRaw[0]
    : statusFilterRaw ?? "all";

  const supabase = supabaseAdmin();
  let query = supabase
    .from("raffles")
    .select("id,title,status,opens_at,closes_at,slug,sort_priority,image_url,image_urls")
    .order("sort_priority", { ascending: true, nullsFirst: true })
    .order("closes_at", { ascending: true, nullsFirst: true });

  if (statusFilter !== "all") {
    query = query.eq("status", statusFilter);
  }

  const { data: raffles, error } = await query;

  if (error) {
    console.error("[admin] Failed to load raffles:", error.message);
  }

  const items = raffles ?? [];

  return (
    <section className="space-y-10 py-16">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.6em] text-muted">Admin</p>
          <h1 className="text-3xl font-light tracking-widest text-foreground">
            Raffle Control
          </h1>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
          <div className="flex flex-wrap gap-2">
            {["all", "draft", "upcoming", "active", "closed"].map((option) => {
              const isActive = statusFilter === option;
              const href =
                option === "all"
                  ? "/admin"
                  : `/admin?status=${encodeURIComponent(option)}`;
              return (
                <Link
                  key={option}
                  href={href}
                  scroll={false}
              className={`rounded-full border px-4 py-2 text-xs uppercase tracking-[0.3em] transition duration-200 ${
                    isActive
                  ? "border-white text-white"
                  : "border-white/20 text-muted hover:border-white/60 hover:text-white active:scale-95"
                  }`}
                >
                  {option.toUpperCase()}
                </Link>
              );
            })}
          </div>
          <Link
            href="/admin/raffles/new"
            className="inline-flex items-center justify-center rounded-full border border-accent px-6 py-3 text-xs font-semibold uppercase tracking-[0.3em] text-accent transition hover:bg-accent/10"
          >
            New Raffle
          </Link>
        </div>
      </div>

      <div className="space-y-4">
        {items.map((raffle) => {
          const thumbnail =
            raffle.image_urls?.[0] ?? raffle.image_url ?? "/placeholder.jpg";

          return (
            <div
              key={raffle.id}
              className="rounded-3xl border border-white/10 bg-white/5 p-6 text-sm"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-4">
                  <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-2xl border border-white/10 bg-black/20">
                    <img
                      src={thumbnail}
                      alt={`${raffle.title} thumbnail`}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div>
                    <p className="text-lg font-semibold tracking-widest text-foreground">
                      {raffle.title}
                    </p>
                    <p className="text-xs uppercase tracking-[0.4em] text-muted">
                      Status: {raffle.status} · Priority: {raffle.sort_priority ?? "—"}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-[0.4em] text-white/40">
                      <span>ID: {raffle.id}</span>
                      <CopyButton text={raffle.id} />
                    </div>
                  </div>
                </div>
                <div className="flex flex-col gap-2 text-sm text-foreground/80 sm:items-end">
                  {raffle.opens_at && (
                    <p>Opens {formatDate(raffle.opens_at)}</p>
                  )}
                  <p>Closes {formatDate(raffle.closes_at)}</p>
                  {raffle.slug && (
                    <Link
                      href={`/raffles/${raffle.slug}`}
                      className="text-xs uppercase tracking-[0.3em] text-accent underline-offset-4 hover:underline"
                    >
                      View public page
                    </Link>
                  )}
                  <Link
                    href={`/admin/raffles/${raffle.id}`}
                    className="text-xs uppercase tracking-[0.3em] text-foreground underline-offset-4 hover:underline"
                  >
                    Manage raffle
                  </Link>
                </div>
              </div>

              <form
                action={updateRaffleStatus}
                className="mt-4 flex flex-wrap gap-3"
              >
                <input type="hidden" name="raffleId" value={raffle.id} />
                {["draft", "upcoming", "active", "closed"].map((statusOption) => {
                  const isCurrent = raffle.status === statusOption;
                  const baseClasses =
                    "rounded-full border px-4 py-2 text-xs uppercase tracking-[0.3em] transition duration-200 active:scale-95";
                  const stateClass = isCurrent
                    ? "border-white text-white"
                    : "border-white/20 text-muted hover:border-white/60 hover:text-white";

                  return (
                    <button
                      key={statusOption}
                      type="submit"
                      name="status"
                      value={statusOption}
                      disabled={isCurrent}
                      className={`${baseClasses} ${stateClass}`}
                    >
                      {statusOption.toUpperCase()}
                    </button>
                  );
                })}
              </form>
            </div>
          );
        })}

        {items.length === 0 && (
          <p className="rounded-3xl border border-white/10 bg-white/5 p-10 text-center text-xs uppercase tracking-[0.4em] text-muted">
            No raffles yet.
          </p>
        )}
      </div>
    </section>
  );
}

