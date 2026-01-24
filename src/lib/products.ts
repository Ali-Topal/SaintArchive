import { createSupabaseServerClient } from "@/lib/supabaseClient";

export type FilterParams = {
  brand?: string[];
  category?: string[];
};

export type ProductRecord = {
  id: string;
  title: string;
  color: string | null;
  description: string;
  options: string[] | null;
  image_url: string | null;
  image_urls: string[] | null;
  price_cents: number;
  is_active: boolean;
  stock_quantity: number;
  brand: string | null;
  slug?: string | null;
  sort_priority: number | null;
};

const productSelect =
  "id,title,color,description,options,image_url,image_urls,price_cents,is_active,stock_quantity,brand,slug,sort_priority";

type FilterResult = {
  products: ProductRecord[];
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

export async function getFilteredProducts(
  filters: FilterParams = {},
  page = 1,
  pageSize = 9,
  existingClient?: ServerSupabaseClient
): Promise<FilterResult> {
  const supabase = existingClient ?? (await createSupabaseServerClient());

  // Get available brands from active products
  const { data: brandRows, error: brandsError } = await supabase
    .from("products")
    .select("brand")
    .eq("is_active", true);

  if (brandsError) {
    console.error("[products] Failed to fetch brands:", brandsError.message);
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
      .from("products")
      .select(productSelect, { count: "exact" })
      .eq("is_active", true)
      .order("sort_priority", { ascending: true, nullsFirst: true })
      .order("title", { ascending: true });

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
  let products = initialResult.data ?? [];
  let count = initialResult.count ?? products.length;

  if (initialResult.error) {
    console.error("[products] Failed to fetch products:", initialResult.error.message);
  }

  if (count > 0 && from >= count) {
    currentPage = Math.max(1, Math.ceil(count / safePageSize));
    from = (currentPage - 1) * safePageSize;
    to = from + safePageSize - 1;

    const retry = await buildQuery().range(from, to);
    products = retry.data ?? [];
    count = retry.count ?? count;

    if (retry.error) {
      console.error("[products] Failed to fetch products:", retry.error.message);
    }
  }

  const totalCount = count ?? products.length ?? 0;
  const totalPages =
    totalCount > 0 ? Math.max(1, Math.ceil(totalCount / safePageSize)) : 1;

  return {
    products: products ?? [],
    availableBrands,
    appliedFilters: {
      brand: sanitizedBrands,
      category: filters.category ?? [],
    },
    totalCount,
    totalPages,
    page: currentPage,
    pageSize: safePageSize,
  };
}
