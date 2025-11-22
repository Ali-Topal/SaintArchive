import { createSupabaseServerClient } from "@/lib/supabaseClient";

export type FilterParams = {
  brand?: string[];
  category?: string[];
  size?: string[];
};

export type RaffleRecord = {
  id: string;
  title: string;
  color: string | null;
  description: string;
  options: string[] | null;
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

const raffleSelect =
  "id,title,color,description,options,image_url,image_urls,ticket_price_cents,closes_at,status,max_tickets,max_entries_per_user,brand,slug,sort_priority";

type FilterResult = {
  raffles: RaffleRecord[];
  availableBrands: string[];
  appliedFilters: FilterParams;
  totalCount: number;
  totalPages: number;
  page: number;
  pageSize: number;
};

const normalizeOption = (value: string | null | undefined) =>
  value?.trim() ? value.trim() : null;

type ServerSupabaseClient = Awaited<ReturnType<typeof createSupabaseServerClient>>;

export async function getFilteredRaffles(
  filters: FilterParams = {},
  page = 1,
  pageSize = 9,
  existingClient?: ServerSupabaseClient
): Promise<FilterResult> {
  const supabase =
    existingClient ?? (await createSupabaseServerClient());

  const { data: brandRows, error: brandsError } = await supabase
    .from("raffles")
    .select("brand")
    .eq("status", "active");

  if (brandsError) {
    console.error("[raffles] Failed to fetch brands:", brandsError.message);
  }

  const availableBrands = Array.from(
    new Set(
      (brandRows ?? [])
        .map((row) => normalizeOption(row.brand))
        .filter((brand): brand is string => Boolean(brand))
    )
  ).sort((a, b) => a.localeCompare(b));

  const brandLookup = new Map(
    availableBrands.map((brand) => [brand.toLowerCase(), brand])
  );

  const sanitizedBrands =
    filters.brand
      ?.map((value) => brandLookup.get(value.toLowerCase()))
      .filter((value): value is string => typeof value === "string") ?? [];

  const buildQuery = () => {
    let query = supabase
      .from("raffles")
      .select(raffleSelect, { count: "exact" })
      .eq("status", "active")
      .order("sort_priority", { ascending: true, nullsFirst: true })
      .order("closes_at", { ascending: true, nullsFirst: false });

    if (sanitizedBrands.length) {
      query = query.in("brand", sanitizedBrands);
    }

    return query;
  };

  const safePage = Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
  const safePageSize =
    Number.isFinite(pageSize) && pageSize > 0 ? Math.floor(pageSize) : 9;
  let currentPage = safePage;
  let from = (currentPage - 1) * safePageSize;
  let to = from + safePageSize - 1;

  const initialResult = await buildQuery().range(from, to);
  let raffles = initialResult.data ?? [];
  let count = initialResult.count ?? raffles.length;

  if (initialResult.error) {
    console.error("[raffles] Failed to fetch raffles:", initialResult.error.message);
  }

  if (count > 0 && from >= count) {
    currentPage = Math.max(1, Math.ceil(count / safePageSize));
    from = (currentPage - 1) * safePageSize;
    to = from + safePageSize - 1;

    const retry = await buildQuery().range(from, to);
    raffles = retry.data ?? [];
    count = retry.count ?? count;

    if (retry.error) {
      console.error("[raffles] Failed to fetch raffles:", retry.error.message);
    }
  }

  const totalCount = count ?? raffles.length ?? 0;
  const totalPages =
    totalCount > 0 ? Math.max(1, Math.ceil(totalCount / safePageSize)) : 1;

  return {
    raffles: raffles ?? [],
    availableBrands,
    appliedFilters: {
      brand: sanitizedBrands,
      category: filters.category ?? [],
      size: filters.size ?? [],
    },
    totalCount,
    totalPages,
    page: currentPage,
    pageSize: safePageSize,
  };
}

