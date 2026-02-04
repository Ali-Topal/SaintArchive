import Image from "next/image";
import Link from "next/link";
import Filters from "@/components/Filters";
import AnimatedContent from "@/components/AnimatedContent";
import { getFilteredProducts, PRICE_RANGES, CATEGORIES, type FilterParams, type ProductRecord } from "@/lib/products";
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

const parseBoolParam = (value?: string | string[]): boolean => {
  if (!value) return false;
  const val = Array.isArray(value) ? value[0] : value;
  return val === "true" || val === "1";
};

const buildFilterInput = (params: SearchParamRecord): FilterParams => ({
  brand: parseParamValues(params.brand),
  category: parseParamValues(params.category),
  priceRange: parseParamValues(params.price),
  clothingSize: parseParamValues(params.clothingSize),
  shoeSize: parseParamValues(params.shoeSize),
  inStockOnly: parseBoolParam(params.inStock),
});

type FilterGroup = {
  key: string;
  label: string;
  options: { value: string; label: string }[];
};

const buildFilterGroups = (
  brands: string[],
  categories: string[],
  clothingSizes: string[],
  shoeSizes: string[]
): FilterGroup[] => {
  const groups: FilterGroup[] = [];

  // Category filter
  if (categories.length > 0) {
    const categoryOptions = categories.map((cat) => {
      const categoryDef = CATEGORIES.find((c) => c.key === cat);
      return { value: cat, label: categoryDef?.label ?? cat };
    });
    groups.push({ key: "category", label: "Category", options: categoryOptions });
  }

  // Brand filter
  if (brands.length > 0) {
    groups.push({
      key: "brand",
      label: "Brand",
      options: brands.map((brand) => ({ value: brand, label: brand })),
    });
  }

  // Price range filter
  groups.push({
    key: "price",
    label: "Price",
    options: PRICE_RANGES.map((range) => ({ value: range.key, label: range.label })),
  });

  // Clothing size filter
  if (clothingSizes.length > 0) {
    groups.push({
      key: "clothingSize",
      label: "Clothing Size",
      options: clothingSizes.map((size) => ({ value: size, label: size })),
    });
  }

  // Shoe size filter
  if (shoeSizes.length > 0) {
    groups.push({
      key: "shoeSize",
      label: "Shoe Size",
      options: shoeSizes.map((size) => ({ value: size, label: size })),
    });
  }

  return groups.filter((group) => group.options.length > 0);
};

type ProductListProps = {
  searchParams?: SearchParamRecord;
};

export default async function ProductList({ searchParams = {} }: ProductListProps) {
  const supabase = await createSupabaseServerClient();
  const filters = buildFilterInput(searchParams);
  const rawPageParam = searchParams.page;
  const pageParam = Array.isArray(rawPageParam) ? rawPageParam[0] : rawPageParam;
  const requestedPage = pageParam ? Number(pageParam) : 1;
  const pageNumber = Number.isFinite(requestedPage) && requestedPage > 0 ? Math.floor(requestedPage) : 1;
  const pageSize = 13; // 1 hero + 12 grid items (4 complete rows of 3)

  const {
    products,
    availableBrands,
    availableCategories,
    availableClothingSizes,
    availableShoeSizes,
    appliedFilters,
    totalCount,
    totalPages,
    page: currentPage,
    pageSize: resolvedPageSize,
  } = await getFilteredProducts(filters, pageNumber, pageSize, supabase);

  const selectedFilters = {
    brand: appliedFilters.brand ?? [],
    category: appliedFilters.category ?? [],
    price: appliedFilters.priceRange ?? [],
    clothingSize: appliedFilters.clothingSize ?? [],
    shoeSize: appliedFilters.shoeSize ?? [],
  };

  const inStockOnly = appliedFilters.inStockOnly ?? false;

  const buildPageHref = (targetPage: number) => {
    const params = new URLSearchParams();
    Object.entries(searchParams).forEach(([key, value]) => {
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
    return query ? `/?${query}` : "/";
  };

  const hasPrevPage = currentPage > 1;
  const hasNextPage = currentPage < totalPages;
  const firstItemIndex = totalCount === 0 ? 0 : (currentPage - 1) * resolvedPageSize + 1;
  const lastItemIndex =
    totalCount === 0 ? 0 : Math.min(totalCount, currentPage * resolvedPageSize);

  if (!products.length) {
    return (
      <div className="space-y-6 lg:space-y-16">
        <Filters
          groups={buildFilterGroups(availableBrands, availableCategories, availableClothingSizes, availableShoeSizes)}
          selected={selectedFilters}
          inStockOnly={inStockOnly}
        />
        <section className="flex min-h-[40vh] items-center justify-center rounded-[32px] border border-white/10 bg-white/5/20 px-8 py-16 text-center">
          <p className="text-base uppercase tracking-[0.4em] text-muted">
            No products match your filters. Try adjusting your selection.
          </p>
        </section>
      </div>
    );
  }

  // Feature the first product as hero (desktop/tablet only)
  const heroProduct = products[0];
  const gridProducts = products.slice(1);

  return (
    <div className="space-y-6 lg:space-y-16">
      <Filters
        groups={buildFilterGroups(availableBrands, availableCategories, availableClothingSizes, availableShoeSizes)}
        selected={selectedFilters}
        inStockOnly={inStockOnly}
      />

      {/* Hero Product - Hidden on mobile */}
      <div className="hidden md:block">
        <AnimatedContent
          distance={20}
          direction="vertical"
          duration={0.8}
          ease="power2.out"
          initialOpacity={0}
          animateOpacity
          threshold={0.8}
        >
          <ProductHero product={heroProduct} />
        </AnimatedContent>
      </div>

      {/* Product Grid - On mobile shows ALL products, on desktop shows all except hero */}
      <section className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3">
        {/* First product as card on mobile only */}
        <div className="md:hidden">
          <AnimatedContent
            distance={30}
            direction="vertical"
            duration={1}
            ease="power2.out"
            initialOpacity={0}
            animateOpacity
            threshold={0.05}
          >
            <ProductCard product={heroProduct} />
          </AnimatedContent>
        </div>
        
        {/* Remaining products - hide last item on mobile to keep even grid */}
        {gridProducts.map((product, index) => {
          const isLastItem = index === gridProducts.length - 1;
          return (
            <AnimatedContent
              key={product.id}
              distance={30}
              direction="vertical"
              duration={1}
              ease="power2.out"
              initialOpacity={0}
              animateOpacity
              threshold={0.05}
              delay={index * 0.03}
              className={isLastItem ? "hidden md:block" : ""}
            >
              <ProductCard product={product} />
            </AnimatedContent>
          );
        })}
      </section>

      {/* Pagination */}
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

    </div>
  );
}

// Hero Product Component
function ProductHero({ product }: { product: ProductRecord }) {
  const detailHref = product.slug ? `/products/${product.slug}` : `/products/${product.id}`;
  const coverImage = product.image_urls?.[0] ?? product.image_url ?? null;
  const isOutOfStock = product.stock_quantity === 0;

  return (
    <article className="group relative grid gap-8 rounded-3xl border-2 border-neutral-800 bg-black/40 backdrop-blur-sm p-6 transition hover:border-white/30 lg:grid-cols-2 lg:p-8">
      {/* Card link - covers entire card */}
      <Link href={detailHref} className="absolute inset-0 z-0" aria-label={`View ${product.title}`} />
      
      {/* Image */}
      <div className="pointer-events-none relative z-10 overflow-hidden rounded-2xl border border-neutral-800">
        {coverImage ? (
          <div className="relative aspect-square w-full">
            <Image
              src={coverImage}
              alt={product.title}
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              priority
            />
          </div>
        ) : (
          <div className="flex aspect-square w-full items-center justify-center bg-black/30 text-white/70">
            Image coming soon
          </div>
        )}
        {isOutOfStock && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60">
            <span className="rounded-full bg-white/10 px-6 py-2 text-sm font-semibold uppercase tracking-[0.3em] text-white backdrop-blur-sm">
              Out of Stock
            </span>
          </div>
        )}
      </div>

      {/* Details */}
      <div className="pointer-events-none relative z-10 flex flex-col justify-center space-y-4 py-2">
        <div className="space-y-3">
          {product.brand && (
            <p className="text-xs uppercase tracking-[0.4em] text-white/50">{product.brand}</p>
          )}
          <h2 className="text-3xl font-semibold text-white lg:text-4xl">{product.title}</h2>
          {product.color && (
            <p className="text-sm uppercase tracking-[0.3em] text-white/60">{product.color}</p>
          )}
        </div>

        <p className="text-3xl font-semibold text-white">
          {priceFormatter.format(product.price_cents / 100)}
        </p>

        {product.description && (
          <p className="text-base text-white/70 line-clamp-3">
            {product.description.split("\n")[0]}
          </p>
        )}

        {/* Options Preview */}
        {product.options && product.options.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.3em] text-white/50">Available Sizes</p>
            <div className="flex flex-wrap gap-2">
              {product.options.slice(0, 6).map((option) => (
                <span
                  key={option}
                  className="rounded-md border border-white/20 px-3 py-1 text-sm text-white/70"
                >
                  {option}
                </span>
              ))}
              {product.options.length > 6 && (
                <span className="text-sm text-white/50">+{product.options.length - 6} more</span>
              )}
            </div>
          </div>
        )}

        {/* Buy Now Button - inside details */}
        <div className="flex flex-col gap-3 pt-2 sm:flex-row">
          {isOutOfStock ? (
            <span className="inline-flex flex-1 items-center justify-center rounded-full border border-white/20 px-6 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-white/50">
              Out of Stock
            </span>
          ) : (
            <Link
              href={`/checkout?product=${product.id}`}
              className="pointer-events-auto relative z-20 inline-flex flex-1 items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-black transition hover:bg-white/90"
            >
              Buy Now
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}

// Product Card Component
function ProductCard({ product }: { product: ProductRecord }) {
  const detailHref = product.slug ? `/products/${product.slug}` : `/products/${product.id}`;
  const coverImage = product.image_urls?.[0] ?? product.image_url ?? null;
  const isOutOfStock = product.stock_quantity === 0;

  return (
    <article className="group flex h-full flex-col rounded-xl border border-neutral-800 bg-black/40 backdrop-blur-sm transition hover:border-white/30 sm:rounded-2xl sm:border-2">
      <Link href={detailHref} className="flex flex-1 flex-col">
        {/* Image */}
        <div className="p-2 pb-0 sm:p-4 sm:pb-0">
          <div className="relative overflow-hidden rounded-lg sm:rounded-xl">
            {coverImage ? (
              <div className="relative aspect-square w-full">
                <Image
                  src={coverImage}
                  alt={product.title}
                  fill
                  sizes="(max-width: 768px) 50vw, 33vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                />
              </div>
            ) : (
              <div className="flex aspect-square w-full items-center justify-center bg-black/30 text-white/70">
                Image coming soon
              </div>
            )}
            {isOutOfStock && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                <span className="rounded-full bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-white backdrop-blur-sm">
                  Out of Stock
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Details */}
        <div className="flex flex-1 flex-col p-3 sm:p-5">
          <div className="flex-1 space-y-1 sm:space-y-2">
            {product.brand && (
              <p className="text-[10px] uppercase tracking-[0.2em] text-white/50 sm:text-xs sm:tracking-[0.3em]">{product.brand}</p>
            )}
            <h3 className="text-sm font-semibold text-white sm:text-lg">{product.title}</h3>
            {product.color && (
              <p className="text-[10px] uppercase tracking-[0.15em] text-white/50 sm:text-xs sm:tracking-[0.2em]">{product.color}</p>
            )}
          </div>
          <p className="mt-3 text-base font-semibold text-white sm:mt-4 sm:text-xl">
            {priceFormatter.format(product.price_cents / 100)}
          </p>
        </div>
      </Link>

      {/* Actions */}
      <div className="p-3 pt-0 sm:p-5 sm:pt-0">
        {isOutOfStock ? (
          <span className="inline-flex w-full items-center justify-center rounded-full border border-white/20 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.15em] text-white/50 sm:px-6 sm:py-2.5 sm:text-xs sm:tracking-[0.2em]">
            Out of Stock
          </span>
        ) : (
          <Link
            href={`/checkout?product=${product.id}`}
            className="inline-flex w-full items-center justify-center rounded-full bg-white px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.15em] text-black transition hover:bg-white/90 sm:px-6 sm:py-2.5 sm:text-xs sm:tracking-[0.2em]"
          >
            Buy Now
          </Link>
        )}
      </div>
    </article>
  );
}
