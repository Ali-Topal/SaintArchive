import Image from "next/image";
import Link from "next/link";
import Filters from "@/components/Filters";
import NewsletterForm from "@/components/NewsletterForm";
import { getFilteredProducts, type FilterParams, type ProductRecord } from "@/lib/products";
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
});

const buildFilterGroups = (brands: string[]) =>
  [
    {
      key: "brand",
      label: "Brands",
      options: brands.map((brand) => ({ value: brand, label: brand })),
    },
  ].filter((group) => group.options.length > 0);

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
  const pageSize = 12;

  const {
    products,
    availableBrands,
    appliedFilters,
    totalCount,
    totalPages,
    page: currentPage,
    pageSize: resolvedPageSize,
  } = await getFilteredProducts(filters, pageNumber, pageSize, supabase);

  const selectedFilters = {
    brand: appliedFilters.brand ?? [],
  };

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
        <Filters groups={buildFilterGroups(availableBrands)} selected={selectedFilters} />
        <section className="flex min-h-[40vh] items-center justify-center rounded-[32px] border border-white/10 bg-white/5/20 px-8 py-16 text-center">
          <p className="text-base uppercase tracking-[0.4em] text-muted">
            {appliedFilters.brand?.length
              ? `No products found for ${appliedFilters.brand.join(", ")}`
              : "No products available right now. Check back soon."}
          </p>
        </section>
      </div>
    );
  }

  // Feature the first product as hero
  const heroProduct = products[0];
  const gridProducts = products.slice(1);

  return (
    <div className="space-y-6 lg:space-y-16">
      <Filters groups={buildFilterGroups(availableBrands)} selected={selectedFilters} />

      {/* Hero Product */}
      <ProductHero product={heroProduct} />

      {/* Product Grid */}
      {gridProducts.length > 0 && (
        <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {gridProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </section>
      )}

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

      {/* Newsletter Section */}
      <section className="space-y-4 rounded-2xl border border-neutral-800 bg-[#0b0b0b] p-6 text-center">
        <div className="space-y-2">
          <p className="text-xs uppercase text-white/60">Stay in the loop</p>
          <h2 className="text-2xl font-semibold text-white">Get first access to new drops.</h2>
        </div>
        <div className="mx-auto max-w-2xl">
          <NewsletterForm showHeading={false} />
        </div>
      </section>
    </div>
  );
}

// Hero Product Component
function ProductHero({ product }: { product: ProductRecord }) {
  const detailHref = product.slug ? `/products/${product.slug}` : `/products/${product.id}`;
  const coverImage = product.image_urls?.[0] ?? product.image_url ?? null;
  const isOutOfStock = product.stock_quantity === 0;

  return (
    <article className="grid gap-8 rounded-3xl border border-neutral-800 bg-[#050505] p-6 lg:grid-cols-2 lg:p-8">
      {/* Image */}
      <Link href={detailHref} className="relative overflow-hidden rounded-2xl border border-neutral-800">
        {coverImage ? (
          <div className="relative aspect-square w-full">
            <Image
              src={coverImage}
              alt={product.title}
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover transition-transform duration-500 hover:scale-105"
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
      </Link>

      {/* Details */}
      <div className="flex flex-col justify-center space-y-6">
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

        <div className="flex flex-col gap-3 sm:flex-row">
          <Link
            href={detailHref}
            className="inline-flex flex-1 items-center justify-center rounded-full border border-white/40 px-6 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-white transition hover:border-white"
          >
            View Details
          </Link>
          {isOutOfStock ? (
            <span className="inline-flex flex-1 items-center justify-center rounded-full border border-white/20 px-6 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-white/50">
              Out of Stock
            </span>
          ) : (
            <Link
              href={`/checkout?product=${product.id}`}
              className="inline-flex flex-1 items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-black transition hover:bg-white/90"
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
    <article className="group flex h-full flex-col rounded-2xl border border-neutral-800 bg-[#050505] transition hover:border-white/30">
      <Link href={detailHref} className="flex flex-1 flex-col">
        {/* Image */}
        <div className="relative overflow-hidden rounded-t-2xl border-b border-neutral-800">
          {coverImage ? (
            <div className="relative aspect-square w-full">
              <Image
                src={coverImage}
                alt={product.title}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
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

        {/* Details */}
        <div className="flex flex-1 flex-col p-5">
          <div className="flex-1 space-y-2">
            {product.brand && (
              <p className="text-xs uppercase tracking-[0.3em] text-white/50">{product.brand}</p>
            )}
            <h3 className="text-lg font-semibold text-white">{product.title}</h3>
            {product.color && (
              <p className="text-xs uppercase tracking-[0.2em] text-white/50">{product.color}</p>
            )}
          </div>
          <p className="mt-4 text-xl font-semibold text-white">
            {priceFormatter.format(product.price_cents / 100)}
          </p>
        </div>
      </Link>

      {/* Actions */}
      <div className="p-5 pt-0">
        {isOutOfStock ? (
          <span className="inline-flex w-full items-center justify-center rounded-full border border-white/20 px-6 py-2.5 text-xs font-semibold uppercase tracking-[0.2em] text-white/50">
            Out of Stock
          </span>
        ) : (
          <Link
            href={`/checkout?product=${product.id}`}
            className="inline-flex w-full items-center justify-center rounded-full bg-white px-6 py-2.5 text-xs font-semibold uppercase tracking-[0.2em] text-black transition hover:bg-white/90"
          >
            Buy Now
          </Link>
        )}
      </div>
    </article>
  );
}
