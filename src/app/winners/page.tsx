import Link from "next/link";
import RaffleCard from "@/components/RaffleCard";
import { createSupabaseServerClient } from "@/lib/supabaseClient";

type WinnersRaffle = {
  id: string;
  title: string;
  image_url: string | null;
  image_urls: string[] | null;
  closes_at: string | null;
  status: string;
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

export const revalidate = 60;

const parsePageNumber = (value?: string | string[]) => {
  const raw = Array.isArray(value) ? value[0] : value;
  if (!raw) return 1;
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : 1;
};

type WinnersPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function WinnersPage({ searchParams }: WinnersPageProps = {}) {
  const resolvedSearchParams =
    searchParams !== undefined
      ? await searchParams
      : ({} as Record<string, string | string[] | undefined>);

  const supabase = await createSupabaseServerClient();
  const requestedPage = parsePageNumber(resolvedSearchParams.page);
  const pageSize = 9;

  const buildQuery = () => {
    return supabase
      .from("raffles")
      .select(
        "id,title,image_url,image_urls,closes_at,status,winners:raffle_winners(id,email,instagram_handle,size,created_at)",
        { count: "exact" }
      )
      .order("closes_at", { ascending: false });
  };

  const { data, error, count: initialCount } = await buildQuery();

  if (error) {
    console.error("[winners] Failed to load raffles:", error.message);
  }

  const raffles: WinnersRaffle[] = data ?? [];
  let totalCount = initialCount ?? raffles.length;

  const nowDate = new Date();
  const filteredRaffles = raffles.filter((raffle) => {
    const hasWinnerInfo = (raffle.winners?.length ?? 0) > 0;
    if (raffle.status === "closed") {
      return true;
    }
    if (hasWinnerInfo && raffle.closes_at) {
      return new Date(raffle.closes_at) <= nowDate;
    }
    return false;
  });

  totalCount = filteredRaffles.length;
  const totalPages = totalCount > 0 ? Math.max(1, Math.ceil(totalCount / pageSize)) : 1;
  const currentPage = Math.min(Math.max(1, requestedPage), totalPages);

  const from = (currentPage - 1) * pageSize;
  const to = from + pageSize - 1;

  const items = filteredRaffles.slice(from, to + 1);

  const firstItemIndex = totalCount === 0 ? 0 : from + 1;
  const lastItemIndex = totalCount === 0 ? 0 : Math.min(totalCount, to + 1);

  const buildPageHref = (targetPage: number) => {
    const params = new URLSearchParams();
    Object.entries(resolvedSearchParams).forEach(([key, value]) => {
      if (!value || key === "page") {
        return;
      }
      if (Array.isArray(value)) {
        value.forEach((entry) => params.append(key, entry));
      } else {
        params.append(key, value);
      }
    });

    if (targetPage > 1) {
      params.set("page", String(targetPage));
    }

    const query = params.toString();
    return query ? `/winners?${query}` : "/winners";
  };

  const hasPrevPage = currentPage > 1;
  const hasNextPage = currentPage < totalPages;

  return (
    <section className="space-y-10 py-16">
      <div className="space-y-3">
        <p className="text-sm uppercase tracking-[0.3em] text-accent">Winners</p>
        <h1 className="text-3xl font-light tracking-widest text-foreground">
          Closed drops & crowned winners
        </h1>
      </div>

      {items.length === 0 ? (
        <div className="rounded-3xl border border-white/10 bg-white/5 p-12 text-center text-sm uppercase tracking-[0.3em] text-muted">
          No raffles have closed yet.
        </div>
      ) : (
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {items.map((raffle) => (
            <RaffleCard
              key={raffle.id}
              title={raffle.title}
              imageUrl={raffle.image_urls?.[0] ?? raffle.image_url}
              closesAt={raffle.closes_at}
              winners={raffle.winners ?? []}
            />
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <nav className="flex flex-col items-center gap-4 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-muted">
            Showing {firstItemIndex}-{lastItemIndex} of {totalCount}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <Link
              href={buildPageHref(currentPage - 1)}
              aria-disabled={!hasPrevPage}
              aria-label="Previous page"
              className={`flex h-9 w-9 items-center justify-center rounded-full border border-white/20 text-lg text-white transition hover:border-white/60 ${
                hasPrevPage ? "" : "pointer-events-none opacity-40"
              }`}
            >
              &larr;
            </Link>
            {Array.from({ length: totalPages }, (_, index) => index + 1).map((pageNumber) => (
              <Link
                key={pageNumber}
                href={buildPageHref(pageNumber)}
                aria-current={pageNumber === currentPage ? "page" : undefined}
                className={`flex h-9 min-w-[2.25rem] items-center justify-center rounded-full border px-3 text-xs uppercase tracking-[0.3em] transition ${
                  pageNumber === currentPage
                    ? "border-white bg-white text-black"
                    : "border-white/20 text-white hover:border-white/60"
                }`}
              >
                {pageNumber}
              </Link>
            ))}
            <Link
              href={buildPageHref(currentPage + 1)}
              aria-disabled={!hasNextPage}
              aria-label="Next page"
              className={`flex h-9 w-9 items-center justify-center rounded-full border border-white/20 text-lg text-white transition hover:border-white/60 ${
                hasNextPage ? "" : "pointer-events-none opacity-40"
              }`}
            >
              &rarr;
            </Link>
          </div>
        </nav>
      )}
    </section>
  );
}

