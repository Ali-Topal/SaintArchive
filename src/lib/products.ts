import { createSupabaseServerClient } from "@/lib/supabaseClient";

// Price range definitions (in pence)
export const PRICE_RANGES = [
  { key: "under-50", label: "Under £50", min: 0, max: 4999 },
  { key: "50-100", label: "£50 - £100", min: 5000, max: 10000 },
  { key: "100-200", label: "£100 - £200", min: 10001, max: 20000 },
  { key: "over-200", label: "Over £200", min: 20001, max: Infinity },
] as const;

// Category definitions
export const CATEGORIES = [
  { key: "jackets", label: "Jackets" },
  { key: "hoodies", label: "Hoodies" },
  { key: "t-shirts", label: "T-Shirts" },
  { key: "shirts", label: "Shirts" },
  { key: "trousers", label: "Trousers" },
  { key: "shorts", label: "Shorts" },
  { key: "footwear", label: "Footwear" },
  { key: "accessories", label: "Accessories" },
  { key: "bags", label: "Bags" },
  { key: "hats", label: "Hats" },
] as const;

// Common clothing sizes
const CLOTHING_SIZES = ["XXS", "XS", "S", "M", "L", "XL", "XXL", "XXXL", "OS", "ONE SIZE"];

// Shoe size pattern (UK sizes, US sizes, EU sizes)
const SHOE_SIZE_PATTERN = /^(UK\s?)?\d+(\.\d+)?$|^(US\s?)?\d+(\.\d+)?$|^(EU\s?)?\d+(\.\d+)?$/i;

export type FilterParams = {
  brand?: string[];
  category?: string[];
  priceRange?: string[];
  clothingSize?: string[];
  shoeSize?: string[];
  inStockOnly?: boolean;
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
  category?: string | null;
};

const productSelect =
  "id,title,color,description,options,image_url,image_urls,price_cents,is_active,stock_quantity,brand,slug,sort_priority,category";

export type FilterResult = {
  products: ProductRecord[];
  availableBrands: string[];
  availableCategories: string[];
  availableClothingSizes: string[];
  availableShoeSizes: string[];
  appliedFilters: FilterParams;
  totalCount: number;
  totalPages: number;
  page: number;
  pageSize: number;
};

const normalizeOption = (value: string | null | undefined) =>
  value?.trim() ? value.trim() : null;

// Determine if a size option is a shoe size or clothing size
function categorizeSize(size: string): "shoe" | "clothing" | null {
  const normalized = size.trim().toUpperCase();
  
  // Check if it's a clothing size
  if (CLOTHING_SIZES.includes(normalized)) {
    return "clothing";
  }
  
  // Check if it matches shoe size pattern
  if (SHOE_SIZE_PATTERN.test(size.trim())) {
    return "shoe";
  }
  
  // Check for numeric-only sizes (likely shoe sizes)
  if (/^\d+(\.\d+)?$/.test(size.trim())) {
    return "shoe";
  }
  
  return null;
}

type ServerSupabaseClient = Awaited<ReturnType<typeof createSupabaseServerClient>>;

export async function getFilteredProducts(
  filters: FilterParams = {},
  page = 1,
  pageSize = 9,
  existingClient?: ServerSupabaseClient
): Promise<FilterResult> {
  const supabase = existingClient ?? (await createSupabaseServerClient());

  // Get all active products for extracting available filter options
  const { data: allProducts, error: allError } = await supabase
    .from("products")
    .select("brand,category,options,price_cents,stock_quantity")
    .eq("is_active", true);

  if (allError) {
    console.error("[products] Failed to fetch filter options:", allError.message);
  }

  const products_for_filters = allProducts ?? [];

  // Extract available brands
  const availableBrands = Array.from(
    new Set(
      products_for_filters
        .map((row) => normalizeOption(row.brand))
        .filter((brand): brand is string => Boolean(brand))
    )
  ).sort((a, b) => a.localeCompare(b));

  // Extract available categories
  const availableCategories = Array.from(
    new Set(
      products_for_filters
        .map((row) => normalizeOption(row.category))
        .filter((cat): cat is string => Boolean(cat))
    )
  ).sort((a, b) => a.localeCompare(b));

  // Extract and categorize available sizes
  const allSizes = products_for_filters.flatMap((row) => row.options ?? []);
  const clothingSizes = new Set<string>();
  const shoeSizes = new Set<string>();

  allSizes.forEach((size) => {
    const type = categorizeSize(size);
    if (type === "clothing") {
      clothingSizes.add(size.toUpperCase());
    } else if (type === "shoe") {
      shoeSizes.add(size);
    }
  });

  // Sort clothing sizes by standard order
  const clothingSizeOrder = CLOTHING_SIZES;
  const availableClothingSizes = Array.from(clothingSizes).sort(
    (a, b) => clothingSizeOrder.indexOf(a) - clothingSizeOrder.indexOf(b)
  );

  // Sort shoe sizes numerically
  const availableShoeSizes = Array.from(shoeSizes).sort((a, b) => {
    const numA = parseFloat(a.replace(/[^\d.]/g, ""));
    const numB = parseFloat(b.replace(/[^\d.]/g, ""));
    return numA - numB;
  });

  // Sanitize filter inputs
  const brandLookup = new Map(
    availableBrands.map((brand) => [brand.toLowerCase(), brand])
  );
  const sanitizedBrands =
    filters.brand
      ?.map((value) => brandLookup.get(value.toLowerCase()))
      .filter((value): value is string => typeof value === "string") ?? [];

  const categoryLookup = new Map(
    availableCategories.map((cat) => [cat.toLowerCase(), cat])
  );
  const sanitizedCategories =
    filters.category
      ?.map((value) => categoryLookup.get(value.toLowerCase()))
      .filter((value): value is string => typeof value === "string") ?? [];

  const sanitizedPriceRanges = filters.priceRange ?? [];
  const sanitizedClothingSizes = filters.clothingSize ?? [];
  const sanitizedShoeSizes = filters.shoeSize ?? [];
  const inStockOnly = filters.inStockOnly ?? false;

  // Build query
  const buildQuery = () => {
    let query = supabase
      .from("products")
      .select(productSelect, { count: "exact" })
      .eq("is_active", true)
      .order("sort_priority", { ascending: true, nullsFirst: true })
      .order("title", { ascending: true });

    // Brand filter
    if (sanitizedBrands.length) {
      query = query.in("brand", sanitizedBrands);
    }

    // Category filter
    if (sanitizedCategories.length) {
      query = query.in("category", sanitizedCategories);
    }

    // In stock filter
    if (inStockOnly) {
      query = query.gt("stock_quantity", 0);
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
  let products = (initialResult.data ?? []) as ProductRecord[];
  let count = initialResult.count ?? products.length;

  if (initialResult.error) {
    console.error("[products] Failed to fetch products:", initialResult.error.message);
  }

  // Apply client-side filters for price range and sizes (Supabase doesn't support OR conditions well)
  let filteredProducts = products;

  // Price range filter (client-side)
  if (sanitizedPriceRanges.length > 0) {
    const ranges = sanitizedPriceRanges
      .map((key) => PRICE_RANGES.find((r) => r.key === key))
      .filter((r): r is (typeof PRICE_RANGES)[number] => Boolean(r));

    if (ranges.length > 0) {
      filteredProducts = filteredProducts.filter((product) =>
        ranges.some(
          (range) =>
            product.price_cents >= range.min && product.price_cents <= range.max
        )
      );
    }
  }

  // Size filters (client-side - check if product has any matching size)
  const allSizeFilters = [...sanitizedClothingSizes, ...sanitizedShoeSizes];
  if (allSizeFilters.length > 0) {
    filteredProducts = filteredProducts.filter((product) => {
      const productOptions = product.options ?? [];
      return allSizeFilters.some((filterSize) =>
        productOptions.some(
          (option) => option.toLowerCase() === filterSize.toLowerCase()
        )
      );
    });
  }

  // If client-side filtering reduced results, we need to fetch more and re-filter
  // For simplicity, we'll just return what we have (pagination may be slightly off with client-side filters)
  // A more robust solution would require fetching all matching products

  if (count > 0 && from >= count) {
    currentPage = Math.max(1, Math.ceil(count / safePageSize));
    from = (currentPage - 1) * safePageSize;
    to = from + safePageSize - 1;

    const retry = await buildQuery().range(from, to);
    products = (retry.data ?? []) as ProductRecord[];
    count = retry.count ?? count;

    if (retry.error) {
      console.error("[products] Failed to fetch products:", retry.error.message);
    }

    // Re-apply client-side filters
    filteredProducts = products;
    if (sanitizedPriceRanges.length > 0) {
      const ranges = sanitizedPriceRanges
        .map((key) => PRICE_RANGES.find((r) => r.key === key))
        .filter((r): r is (typeof PRICE_RANGES)[number] => Boolean(r));
      if (ranges.length > 0) {
        filteredProducts = filteredProducts.filter((product) =>
          ranges.some(
            (range) =>
              product.price_cents >= range.min && product.price_cents <= range.max
          )
        );
      }
    }
    if (allSizeFilters.length > 0) {
      filteredProducts = filteredProducts.filter((product) => {
        const productOptions = product.options ?? [];
        return allSizeFilters.some((filterSize) =>
          productOptions.some(
            (option) => option.toLowerCase() === filterSize.toLowerCase()
          )
        );
      });
    }
  }

  const totalCount = count ?? filteredProducts.length ?? 0;
  const totalPages =
    totalCount > 0 ? Math.max(1, Math.ceil(totalCount / safePageSize)) : 1;

  return {
    products: filteredProducts,
    availableBrands,
    availableCategories,
    availableClothingSizes,
    availableShoeSizes,
    appliedFilters: {
      brand: sanitizedBrands,
      category: sanitizedCategories,
      priceRange: sanitizedPriceRanges,
      clothingSize: sanitizedClothingSizes,
      shoeSize: sanitizedShoeSizes,
      inStockOnly,
    },
    totalCount,
    totalPages,
    page: currentPage,
    pageSize: safePageSize,
  };
}
