import Link from "next/link";
import CountdownTimer from "@/components/CountdownTimer";
import EnterDrawTrigger from "@/components/EnterDrawTrigger";
import Filters from "@/components/Filters";
import LatestWinnerCard from "@/components/LatestWinnerCard";
import NewsletterForm from "@/components/NewsletterForm";
import RaffleGrid from "@/components/RaffleGrid";
import RaffleHero from "@/components/RaffleHero";
import RaffleImageCarousel from "@/components/RaffleImageCarousel";
import RaffleTeaserLocked from "@/components/RaffleTeaserLocked";
import { getFilteredRaffles, type FilterParams, type RaffleRecord } from "@/lib/raffles";
import { createSupabaseServerClient } from "@/lib/supabaseClient";

type SearchParamRecord = Record<string, string | string[] | undefined>;

const priceFormatter = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP",
});

const parseParamValues = (value?: string | string[]): string[] => {
  if (!value) {
    return [];
  }
  if (Array.isArray(value)) {
    return value
      .map((item) => item?.trim())
      .filter((item): item is string => Boolean(item));
  }
  return value
    .split(",")
    .map((item) => item?.trim())
    .filter((item): item is string => Boolean(item));
};

const buildFilterInput = (params: SearchParamRecord): FilterParams => ({
  brand: parseParamValues(params.brand),
  category: parseParamValues(params.category),
  size: parseParamValues(params.size),
});

const buildFilterGroups = (brands: string[]) =>
  [
    {
      key: "brand",
      label: "Brands",
      options: brands.map((brand) => ({ value: brand, label: brand })),
    },
  ].filter((group) => group.options.length > 0);

const createEntriesCountMap = (entries: Array<{ raffle_id: string; total: number }>) => {
  const map = new Map<string, number>();
  entries.forEach(({ raffle_id, total }) => {
    map.set(raffle_id, Number(total) || 0);
  });
  return map;
};

const isRaffleOpen = (raffle: RaffleRecord, reference: Date) => {
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
  return closeDate > reference;
};

type RaffleListProps = {
  searchParams?: SearchParamRecord;
};

export default async function RaffleList({ searchParams = {} }: RaffleListProps) {
  const supabase = await createSupabaseServerClient();
  const filters = buildFilterInput(searchParams);
  const { raffles: activeRaffles, availableBrands, appliedFilters } =
    await getFilteredRaffles(filters, supabase);

  const selectedFilters = {
    brand: appliedFilters.brand ?? [],
  };

  if (!activeRaffles.length) {
    return (
      <div className="space-y-6 lg:space-y-16">
        <Filters groups={buildFilterGroups(availableBrands)} selected={selectedFilters} />
        <section className="flex min-h-[40vh] items-center justify-center rounded-[32px] border border-white/10 bg-white/5/20 px-8 py-16 text-center">
          <p className="text-base uppercase tracking-[0.4em] text-muted">
            {appliedFilters.brand?.length
              ? `No active drops for ${appliedFilters.brand.join(", ")}`
              : "No active drop right now. Follow @saintarchive88 for the next one."}
          </p>
        </section>
      </div>
    );
  }

  const heroRaffle = activeRaffles[0];
  const additionalActive = activeRaffles.slice(1);

  const activeIds = activeRaffles.map((raffle) => raffle.id);
  const entriesCountMap = new Map<string, number>();

  if (activeIds.length > 0) {
    const { data: entryRows, error: entriesError } = await supabase.rpc("get_entries_totals", {
      ids: activeIds,
    });

    if (entriesError) {
      console.error("[homepage] Failed to fetch entries counts:", entriesError.message);
    }

    if (entryRows) {
      createEntriesCountMap(entryRows).forEach((value, key) => entriesCountMap.set(key, value));
    }
  }

  const heroEntries = heroRaffle ? entriesCountMap.get(heroRaffle.id) ?? 0 : 0;
  const now = new Date();
  const heroIsOpen = heroRaffle ? isRaffleOpen(heroRaffle, now) : false;

  const { data: nextDrop } = await supabase
    .from("raffles")
    .select("id,title,color,image_url,image_urls,closes_at,status")
    .eq("status", "upcoming")
    .order("closes_at", { ascending: true })
    .limit(1)
    .maybeSingle<RaffleRecord>();

  const { data: latestWinner } = await supabase
    .from("raffle_winners")
    .select(
      "id,email,instagram_handle,size,created_at,raffle:raffles(id,title,image_url,image_urls,closes_at,status)"
    )
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle<{
      id: string;
      email: string | null;
      instagram_handle: string | null;
      size: string | null;
      created_at: string;
      raffle: {
        id: string;
        title: string;
        image_url: string | null;
        image_urls: string[] | null;
        closes_at: string | null;
        status: string;
      } | null;
    }>();

  let pastDrops: Array<{
    id: string;
    title: string;
    image_url: string | null;
    image_urls: string[] | null;
    closes_at: string | null;
    slug?: string | null;
  }> = [];

  const latestWinnerRaffleId = latestWinner?.raffle?.id;

  if (latestWinnerRaffleId) {
    const { data: past } = await supabase
      .from("raffles")
      .select("id,title,image_url,image_urls,closes_at,slug")
      .eq("status", "closed")
      .neq("id", latestWinnerRaffleId)
      .order("closes_at", { ascending: false })
      .limit(6);
    pastDrops = past ?? [];
  } else {
    const { data: past } = await supabase
      .from("raffles")
      .select("id,title,image_url,image_urls,closes_at,slug")
      .eq("status", "closed")
      .order("closes_at", { ascending: false })
      .limit(6);
    pastDrops = past ?? [];
  }

  return (
    <div className="space-y-6 lg:space-y-16">
      <Filters groups={buildFilterGroups(availableBrands)} selected={selectedFilters} />
      <RaffleHero
        raffleId={heroRaffle.id}
        title={heroRaffle.title}
        color={heroRaffle.color}
        options={heroRaffle.options}
        description={heroRaffle.description}
        imageUrl={heroRaffle.image_url ?? ""}
        imageUrls={heroRaffle.image_urls ?? undefined}
        ticketPriceCents={heroRaffle.ticket_price_cents}
        closesAt={heroRaffle.closes_at ?? undefined}
        entriesCount={heroEntries ?? 0}
        enterEnabled={heroIsOpen}
        maxEntriesPerUser={heroRaffle.max_entries_per_user ?? undefined}
        detailHref={heroRaffle.slug ? `/raffles/${heroRaffle.slug}` : `/raffles/${heroRaffle.id}`}
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
            const detailHref = raffle.slug ? `/raffles/${raffle.slug}` : `/raffles/${raffle.id}`;
            const cardImages =
              raffle.image_urls && raffle.image_urls.length > 0
                ? raffle.image_urls
                : raffle.image_url
                  ? [raffle.image_url]
                  : [];

            const raffleIsOpen = isRaffleOpen(raffle, now);

            return (
              <article
                key={raffle.id}
                className="flex h-full flex-col rounded-2xl border border-neutral-800 bg-[#050505] p-6 transition hover:border-white"
              >
                <Link href={detailHref} className="flex flex-1 flex-col gap-5">
                  <div className="overflow-hidden rounded-xl border border-neutral-800">
                    {cardImages.length > 0 ? (
                      <RaffleImageCarousel images={cardImages} title={raffle.title} showControls={false} />
                    ) : (
                      <div
                        className="flex aspect-square w-full items-center justify-center rounded-xl bg-black/30 text-white/70"
                        style={{ aspectRatio: "1 / 1" }}
                      >
                        Image coming soon
                      </div>
                    )}
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
                    <div className="flex flex-col gap-3">
                      <div>
                        <h3 className="text-2xl font-semibold text-white">{raffle.title}</h3>
                        {raffle.color && (
                          <p className="text-xs uppercase tracking-[0.3em] text-white/60">{raffle.color}</p>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-4 text-left">
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
                  <div className="mt-auto rounded-xl border border-white/10 bg-[#020202] px-5 py-4">
                    <p className="text-xs uppercase text-white/60">Countdown</p>
                    <div className="flex items-center justify-center">
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
                  </div>
                </Link>
                <div className="mt-4 flex flex-col gap-3">
                  <Link
                    href={detailHref}
                    className="inline-flex w-full items-center justify-center rounded-full border border-white/40 px-6 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white transition hover:border-white"
                  >
                    View details
                  </Link>
                  {raffleIsOpen ? (
                    <EnterDrawTrigger
                      raffleId={raffle.id}
                      title={raffle.title}
                      ticketPriceCents={raffle.ticket_price_cents}
                      maxEntriesPerUser={raffle.max_entries_per_user ?? undefined}
                      options={raffle.options}
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

      {latestWinner?.raffle && (
        <LatestWinnerCard
          title={latestWinner.raffle.title}
          imageUrl={
            latestWinner.raffle.image_urls?.[0] ?? latestWinner.raffle.image_url
          }
          closesAt={latestWinner.raffle.closes_at ?? undefined}
          winnerEmail={latestWinner.email ?? undefined}
          winnerInstagramHandle={latestWinner.instagram_handle ?? undefined}
          winnerSize={latestWinner.size ?? undefined}
        />
      )}

      {pastDrops.length > 0 && (
        <section className="space-y-4 rounded-2xl border border-neutral-800 bg-[#0b0b0b] p-6">
          <div className="flex flex-col gap-2">
            <p className="text-xs uppercase text-white/60">Past drops</p>
            <h2 className="text-2xl font-semibold text-white">Archive of crowned winners</h2>
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
          <h2 className="text-2xl font-semibold text-white">Get first access to new drops before they go public.</h2>
        </div>
        <div className="mx-auto max-w-2xl">
          <NewsletterForm showHeading={false} />
        </div>
      </section>
    </div>
  );
}

