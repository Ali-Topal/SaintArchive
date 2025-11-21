/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import CountdownTimer from "@/components/CountdownTimer";
import EnterDrawTrigger from "@/components/EnterDrawTrigger";
import LatestWinnerCard from "@/components/LatestWinnerCard";
import NewsletterForm from "@/components/NewsletterForm";
import RaffleGrid from "@/components/RaffleGrid";
import RaffleHero from "@/components/RaffleHero";
import RaffleTeaserLocked from "@/components/RaffleTeaserLocked";
import BrandFilter from "@/components/BrandFilter";
import { createSupabaseServerClient } from "@/lib/supabaseClient";

export const revalidate = 0;

type RaffleRecord = {
  id: string;
  title: string;
  description: string;
  image_url: string | null;
  image_urls: string[] | null;
  ticket_price_cents: number;
  closes_at: string | null;
  status: string;
  max_tickets: number | null;
  max_entries_per_user: number | null;
  brand: string | null;
  slug?: string | null;
  sort_priority: number | null;
};

type EntriesRow = {
  raffle_id: string;
};

type HighlightRaffle = {
  id: string;
  title: string;
  image_url: string | null;
  image_urls: string[] | null;
  closes_at: string | null;
  winner_email: string | null;
  winner_instagram_handle: string | null;
};

const priceFormatter = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP",
});

type HomePageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function HomePage({
  searchParams,
}: HomePageProps = {}) {
  const supabase = await createSupabaseServerClient();

  const {
    data: activeRaffles,
    error: activeError,
  } = await supabase
    .from("raffles")
    .select(
      "id,title,description,image_url,image_urls,ticket_price_cents,closes_at,status,max_tickets,max_entries_per_user,brand,slug,sort_priority"
    )
    .eq("status", "active")
    .order("sort_priority", { ascending: true, nullsFirst: true })
    .order("closes_at", { ascending: true, nullsFirst: false })
    .returns<RaffleRecord[]>();

  if (activeError) {
    console.error("[homepage] Failed to fetch raffles:", activeError.message);
  }

  if (!activeRaffles || activeRaffles.length === 0) {
    return (
      <section className="flex min-h-[60vh] items-center justify-center text-center rounded-[32px] border border-white/10 bg-white/5/20 px-8 py-24">
        <p className="text-base uppercase tracking-[0.5em] text-muted">
          No active drop right now. Follow @saintarchive88 for the next one.
        </p>
      </section>
    );
  }

  const availableBrands = Array.from(
    new Set(
      activeRaffles
        .map((raffle) => raffle.brand?.trim())
        .filter((brand): brand is string => !!brand)
    )
  ).sort((a, b) => a.localeCompare(b));

  const params =
    searchParams !== undefined ? await searchParams : ({} as Record<string, string | string[] | undefined>);
  const rawParam = params.brand;
  const selectedBrandRaw = Array.isArray(rawParam)
    ? rawParam[0]
    : rawParam;
  const normalizedBrand = selectedBrandRaw?.toLowerCase();
  const filteredRaffles =
    normalizedBrand && activeRaffles.length
      ? activeRaffles.filter(
          (raffle) =>
            raffle.brand?.toLowerCase() === normalizedBrand
        )
      : activeRaffles;

  if (!filteredRaffles || filteredRaffles.length === 0) {
    return (
      <div className="space-y-10">
        <BrandFilter
          brands={availableBrands}
          activeBrand={selectedBrandRaw}
        />
        <section className="flex min-h-[40vh] items-center justify-center rounded-[32px] border border-white/10 bg-white/5/20 px-8 py-16 text-center">
          <p className="text-base uppercase tracking-[0.4em] text-muted">
            {selectedBrandRaw
              ? `No active drops for ${selectedBrandRaw}`
              : "No active drop right now. Follow @saintarchive88 for the next one."}
          </p>
        </section>
      </div>
    );
  }

  const now = new Date();
  const isRaffleOpen = (raffle: RaffleRecord) => {
    if (raffle.status !== "active") {
      return false;
    }
    if (!raffle.closes_at) {
      return true;
    }
    const closeDate = new Date(raffle.closes_at);
    if (Number.isNaN(closeDate.valueOf())) {
      return true;
    }
    return closeDate > now;
  };

  const heroRaffle = filteredRaffles[0];
  const additionalActive = filteredRaffles.slice(1);
  const heroIsOpen = isRaffleOpen(heroRaffle);

  const activeIds = filteredRaffles.map((raffle) => raffle.id);
  const entriesCountMap = new Map<string, number>();

  if (activeIds.length > 0) {
    const { data: entriesRows, error: entriesError } = await supabase
      .from("entries")
      .select("raffle_id")
      .in("raffle_id", activeIds)
      .returns<EntriesRow[]>();

    if (entriesError) {
      console.error("[homepage] Failed to fetch entries counts:", entriesError.message);
    }

    entriesRows?.forEach((row) => {
      entriesCountMap.set(row.raffle_id, (entriesCountMap.get(row.raffle_id) ?? 0) + 1);
    });
  }

  let heroEntries = 0;
  if (heroRaffle) {
    const { count = 0, error: heroEntriesError } = await supabase
      .from("entries")
      .select("id", { count: "exact", head: true })
      .eq("raffle_id", heroRaffle.id);

    if (heroEntriesError) {
      console.error("[homepage] Failed to count hero entries:", heroEntriesError.message);
    }
    heroEntries = count ?? 0;
  }

  const { data: nextDrop } = await supabase
    .from("raffles")
    .select("id,title,image_url,image_urls,closes_at,status")
    .eq("status", "upcoming")
    .order("closes_at", { ascending: true })
    .limit(1)
    .maybeSingle<HighlightRaffle>();

  const { data: latestWinner } = await supabase
    .from("raffles")
    .select(
      "id,title,image_url,image_urls,closes_at,winner_email,winner_instagram_handle,status"
    )
    .eq("status", "closed")
    .order("closes_at", { ascending: false })
    .limit(1)
    .maybeSingle<HighlightRaffle>();

  let pastDrops: Array<{
    id: string;
    title: string;
    image_url: string | null;
    image_urls: string[] | null;
    closes_at: string | null;
    slug?: string | null;
  }> = [];

  if (latestWinner?.id) {
    const { data: past } = await supabase
      .from("raffles")
      .select("id,title,image_url,image_urls,closes_at,slug")
      .eq("status", "closed")
      .neq("id", latestWinner.id)
      .order("closes_at", { ascending: false })
      .limit(6);
    pastDrops = past ?? [];
  }

  return (
    <div className="space-y-16">
      <BrandFilter brands={availableBrands} activeBrand={selectedBrandRaw} />
      <RaffleHero
        raffleId={heroRaffle.id}
        title={heroRaffle.title}
        description={heroRaffle.description}
        imageUrl={heroRaffle.image_url ?? ""}
        imageUrls={heroRaffle.image_urls ?? undefined}
        ticketPriceCents={heroRaffle.ticket_price_cents}
        closesAt={heroRaffle.closes_at ?? undefined}
        entriesCount={heroEntries ?? 0}
        enterEnabled={heroIsOpen}
        maxEntriesPerUser={heroRaffle.max_entries_per_user ?? undefined}
        detailHref={
          heroRaffle.slug ? `/raffles/${heroRaffle.slug}` : `/raffles/${heroRaffle.id}`
        }
      />

      {nextDrop && (
        <RaffleTeaserLocked
          title={nextDrop.title}
          imageUrl={nextDrop.image_url}
          closesAt={nextDrop.closes_at ?? undefined}
        />
      )}

      {additionalActive.length > 0 && (
        <section className="grid gap-6 md:grid-cols-2">
          {additionalActive.map((raffle) => {
            const detailHref = raffle.slug
              ? `/raffles/${raffle.slug}`
              : `/raffles/${raffle.id}`;

            return (
              <article
                key={raffle.id}
                className="rounded-2xl border border-neutral-800 bg-[#050505] p-6 transition hover:border-white"
              >
                <Link
                  href={detailHref}
                  className="flex flex-col gap-5"
                >
                  <div className="rounded-xl border border-neutral-800">
                    <img
                      src={
                        raffle.image_urls?.[0] ??
                        raffle.image_url ??
                        "/placeholder.jpg"
                      }
                      alt={raffle.title}
                      className="w-full rounded-xl object-cover"
                      style={{ aspectRatio: "1 / 1" }}
                    />
                  </div>
                  <div className="space-y-3">
                    <p className="text-xs uppercase text-white/60">
                      Closes{" "}
                      {raffle.closes_at
                        ? new Date(raffle.closes_at).toLocaleDateString("en-GB", {
                            day: "numeric",
                            month: "short",
                          })
                        : "TBA"}
                    </p>
                    <div className="flex flex-wrap items-end justify-between gap-4">
                      <h3 className="text-2xl font-semibold text-white">
                        {raffle.title}
                      </h3>
                      <div className="flex flex-wrap items-center gap-4 text-right">
                        <div>
                          <p className="text-xs uppercase text-white/50">Ticket price</p>
                          <p className="text-lg font-semibold text-white">
                            {priceFormatter.format(raffle.ticket_price_cents / 100)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs uppercase text-white/50">Entries</p>
                          <p className="text-lg font-semibold text-white">
                            {(entriesCountMap.get(raffle.id) ?? 0).toLocaleString("en-GB")}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-[#020202] px-5 py-4">
                    <p className="text-xs uppercase text-white/60">Countdown</p>
                    {raffle.closes_at ? (
                      <CountdownTimer
                        targetDate={raffle.closes_at}
                        variant="compact"
                        className="justify-center text-white"
                      />
                    ) : (
                      <p className="text-base text-white">Closing date TBA</p>
                    )}
                  </div>
                </Link>
                <div className="mt-4 flex flex-col gap-3">
                  <Link
                    href={detailHref}
                    className="inline-flex w-full items-center justify-center rounded-full border border-white/40 px-6 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white transition hover:border-white"
                  >
                    View details
                  </Link>
                  {isRaffleOpen(raffle) ? (
                    <EnterDrawTrigger
                      raffleId={raffle.id}
                      title={raffle.title}
                      ticketPriceCents={raffle.ticket_price_cents}
                      maxEntriesPerUser={raffle.max_entries_per_user ?? undefined}
                      buttonLabel="Enter draw"
                      buttonClassName="inline-flex w-full items-center justify-center rounded-full border border-white/30 bg-white px-6 py-3 text-xs font-semibold uppercase tracking-[0.3em] text-black transition hover:opacity-90"
                    />
                  ) : (
                    <div className="inline-flex w-full items-center justify-center rounded-full border border-white/20 px-6 py-2 text-xs uppercase tracking-[0.2em] text-white/70">
                      Entries closed
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </section>
      )}

      {latestWinner && (
        <LatestWinnerCard
          title={latestWinner.title}
          imageUrl={latestWinner.image_urls?.[0] ?? latestWinner.image_url}
          closesAt={latestWinner.closes_at ?? undefined}
        winnerEmail={latestWinner.winner_email ?? undefined}
        winnerInstagramHandle={latestWinner.winner_instagram_handle ?? undefined}
        />
      )}

      {pastDrops.length > 0 && (
        <section className="space-y-4 rounded-2xl border border-neutral-800 bg-[#0b0b0b] p-6">
          <div className="flex flex-col gap-2">
            <p className="text-xs uppercase text-white/60">Past drops</p>
            <h2 className="text-2xl font-semibold text-white">
              Archive of crowned winners
            </h2>
          </div>
          <RaffleGrid
            items={pastDrops.map((drop) => ({
              ...drop,
              image_url: drop.image_urls?.[0] ?? drop.image_url,
            }))}
          />
        </section>
      )}

      <section className="space-y-4 rounded-2xl border border-neutral-800 bg-[#0b0b0b] p-6 text-center">
        <div className="space-y-2">
          <p className="text-xs uppercase text-white/60">Stay in the circle</p>
          <h2 className="text-2xl font-semibold text-white">
            Get first access to new drops before they go public.
          </h2>
        </div>
        <div className="mx-auto max-w-2xl">
          <NewsletterForm showHeading={false} />
        </div>
      </section>
    </div>
  );
}
