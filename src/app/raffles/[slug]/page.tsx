import Link from "next/link";
import { notFound } from "next/navigation";
import CountdownTimer from "@/components/CountdownTimer";
import EnterDrawTrigger from "@/components/EnterDrawTrigger";
import RaffleImageCarousel from "@/components/RaffleImageCarousel";
import ScrollToTop from "@/components/ScrollToTop";
import { createSupabaseServerClient } from "@/lib/supabaseClient";

type RaffleBySlug = {
  id: string;
  title: string;
  color: string | null;
  description: string;
  options: string[] | null;
  brand: string | null;
  image_url: string | null;
  image_urls: string[] | null;
  ticket_price_cents: number;
  closes_at: string | null;
  status: string;
  winner_email: string | null;
  winner_instagram_handle: string | null;
  max_entries_per_user: number | null;
  winners:
    | Array<{
        id: string;
        email: string | null;
        instagram_handle: string | null;
        size: string | null;
        created_at: string;
      }>
    | null;
};

type PageProps = {
  params: Promise<{ slug: string }>;
};

export const revalidate = 60;

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export default async function RaffleDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const supabase = await createSupabaseServerClient();

  const { data: raffleBySlug, error: slugError } = await supabase
    .from("raffles")
    .select(
      "id,title,color,description,options,brand,image_url,image_urls,ticket_price_cents,closes_at,status,winner_email,winner_instagram_handle,max_entries_per_user,winners:raffle_winners(id,email,instagram_handle,size,created_at)"
    )
    .eq("slug", slug)
    .maybeSingle<RaffleBySlug>();

  let raffle = raffleBySlug;

  const slugLooksLikeUuid = uuidPattern.test(slug);

  if (!raffle && slugLooksLikeUuid) {
    const { data: raffleById, error: idError } = await supabase
      .from("raffles")
      .select(
        "id,title,color,description,options,brand,image_url,image_urls,ticket_price_cents,closes_at,status,winner_email,winner_instagram_handle,max_entries_per_user,winners:raffle_winners(id,email,instagram_handle,size,created_at)"
      )
      .eq("id", slug)
      .maybeSingle<RaffleBySlug>();

    if (idError) {
      console.error("[raffle-detail] Failed to load raffle by id:", idError.message);
    }

    raffle = raffleById ?? null;
  } else if (!raffle) {
    console.warn("[raffle-detail] Skipping id lookup, slug is not a UUID:", slug);
  }

  if (!raffle) {
    if (slugError) {
      console.error("[raffle-detail] Failed to load raffle:", slugError.message);
    }
    notFound();
  }

  const { data: entryRows, error: entryError } = await supabase.rpc(
    "get_entries_totals",
    { ids: [raffle.id] }
  );
  if (entryError) {
    console.error("[raffle-detail] Failed to load entry totals:", entryError.message);
  }
  const entriesCount = Number(entryRows?.[0]?.total ?? 0);
  const winnersList = raffle.winners ?? [];

  const displayImages =
    raffle.image_urls && raffle.image_urls.length > 0
      ? raffle.image_urls
      : raffle.image_url
        ? [raffle.image_url]
        : [];

  const priceFormatter = new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
  });
  const now = new Date();
  const closesAt = raffle.closes_at ?? undefined;
  const closesDate = closesAt ? new Date(closesAt) : null;
  const isClosed =
    raffle.status === "closed" ||
    (closesDate && !Number.isNaN(closesDate.valueOf()) && closesDate <= now);
  const closesDisplay = closesAt
    ? new Date(closesAt).toLocaleString("en-GB", {
        weekday: "short",
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "TBA";
  const descriptionBlocks = raffle.description
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  const introCopy = descriptionBlocks[0] ?? "Prize details coming soon.";
  const detailCopy =
    descriptionBlocks.length > 1 ? descriptionBlocks.slice(1) : [];
  const optionList =
    raffle.options?.map((value) => value?.trim()).filter((value): value is string => !!value) ??
    [];

  return (
    <div className="mx-auto max-w-5xl space-y-10 px-4 py-10 text-white md:px-6">
      <ScrollToTop />
      <Link href="/" className="text-sm text-white/60 hover:text-white">
        ← Back to Drops
      </Link>

      <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="flex h-full items-center justify-center rounded-md bg-black/20 p-2">
          {displayImages.length > 0 ? (
            <RaffleImageCarousel images={displayImages} title={raffle.title} />
          ) : (
            <div className="flex aspect-square w-full items-center justify-center rounded-md bg-black/40 text-white/60">
              Image coming soon
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="space-y-3">
            <p className="text-xs uppercase tracking-[0.3em] text-white/60">
              Drop
            </p>
            <div>
              <h1 className="text-3xl font-semibold text-white">{raffle.title}</h1>
              {raffle.color && (
                <p className="text-sm uppercase tracking-[0.3em] text-white/60">
                  {raffle.color}
                </p>
              )}
            </div>
            <p className="text-base text-white/80">{introCopy}</p>
          </div>

          <div className="rounded-md border border-[#333] px-5 py-4">
            <div className="flex flex-wrap items-center gap-6">
              <div>
                <p className="text-xs uppercase text-white/60">Ticket price</p>
                <p className="text-2xl font-semibold text-white">
                  {priceFormatter.format(raffle.ticket_price_cents / 100)}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase text-white/60">Entries</p>
                <p className="text-2xl font-semibold text-white">
                  {entriesCount.toLocaleString("en-GB")}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-md border border-[#333] px-5 py-4">
            <p className="text-xs uppercase text-white/60">Countdown</p>
            {isClosed ? (
              <p className="text-lg text-white">Closed</p>
            ) : closesAt ? (
              <CountdownTimer
                targetDate={closesAt}
                className="justify-start text-white"
              />
            ) : (
              <p className="text-lg text-white">Closing date TBA</p>
            )}
          </div>

          <p className="text-xs text-white/60">Closes {closesDisplay}</p>

          {optionList.length > 0 && (
            <section className="space-y-2 rounded-md border border-[#333] px-5 py-4">
              <p className="text-xs uppercase tracking-[0.3em] text-white/60">
                Options
              </p>
              <div className="flex flex-wrap gap-2">
                {optionList.map((option) => (
                  <span
                    key={option}
                    className="rounded-full border border-white/20 px-4 py-1 text-sm text-white/80"
                  >
                    {option}
                  </span>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>

      <section className="rounded-md border border-[#333] px-5 py-5">
        <p className="text-xs uppercase text-white/60">Enter the draw</p>
        <div className="mt-3">
          {isClosed ? (
            <button
              type="button"
              disabled
              className="inline-flex w-full items-center justify-center rounded-full border border-white/30 px-6 py-3 text-sm font-semibold uppercase tracking-[0.3em] text-white/60"
            >
              Entries closed
            </button>
          ) : (
            <EnterDrawTrigger
              raffleId={raffle.id}
              title={raffle.title}
              ticketPriceCents={raffle.ticket_price_cents}
              maxEntriesPerUser={raffle.max_entries_per_user ?? undefined}
              options={optionList}
              buttonLabel="Enter draw"
              buttonClassName="inline-flex w-full items-center justify-center rounded-full border border-white/30 bg-white px-6 py-3 text-sm font-semibold uppercase tracking-[0.3em] text-black transition hover:opacity-90"
            />
          )}
        </div>
      </section>

  {detailCopy.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-white">Details</h2>
          <div className="space-y-3 text-white/80">
            {detailCopy.map((paragraph, index) => (
              <p key={`detail-${index}`}>{paragraph}</p>
            ))}
          </div>
        </section>
      )}

      <section className="space-y-3 rounded-md border border-[#333] px-5 py-4">
        <h3 className="text-sm uppercase tracking-[0.3em] text-white/60">
          Winners
        </h3>
        {winnersList.length > 0 ? (
          <div className="space-y-3 text-white">
            {winnersList.map((winner) => (
              <div key={winner.id}>
                <p className="text-lg font-semibold">
                  {formatWinner(winner.instagram_handle, winner.email)}
                </p>
                <p className="text-sm text-white/60">
                  {winner.size ? `Size: ${winner.size} • ` : ""}
                  Added{" "}
                  {new Date(winner.created_at).toLocaleString("en-GB", {
                    day: "numeric",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-white/70">
            Winner will be announced after the draw closes.
          </p>
        )}
      </section>

      <section className="rounded-md border-t border-[#333] pt-6">
        <p className="text-xs text-white/60">
          Winners are selected at random. You will receive your entry confirmation by email.
        </p>
      </section>
    </div>
  );
}

function formatWinner(handle: string | null, email: string | null): string {
  if (handle) {
    return handle.startsWith("@") ? handle : `@${handle}`;
  }
  if (!email) return "Winner TBA";
  const [user, domain] = email.split("@");
  if (!user || !domain) return "Winner TBA";
  const maskedUser =
    user.length <= 1 ? `${user}*` : `${user[0]}${"*".repeat(Math.max(user.length - 1, 1))}`;
  return `${maskedUser}@${domain}`;
}

