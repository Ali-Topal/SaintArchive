import { notFound } from "next/navigation";
import BackToDropsButton from "@/components/BackToDropsButton";
import ScrollToTop from "@/components/ScrollToTop";
import ProductActions from "@/components/ProductActions";
import ImageGallery from "@/components/ImageGallery";
import { createSupabaseServerClient } from "@/lib/supabaseClient";

type ProductBySlug = {
  id: string;
  title: string;
  color: string | null;
  description: string;
  options: string[] | null;
  brand: string | null;
  image_url: string | null;
  image_urls: string[] | null;
  price_cents: number;
  is_active: boolean;
  stock_quantity: number;
};

type PageProps = {
  params: Promise<{ slug: string }>;
};

export const revalidate = 60;

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const priceFormatter = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP",
});

export default async function ProductDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const supabase = await createSupabaseServerClient();

  // Try to find by slug first
  const { data: productBySlug, error: slugError } = await supabase
    .from("products")
    .select(
      "id,title,color,description,options,brand,image_url,image_urls,price_cents,is_active,stock_quantity"
    )
    .eq("slug", slug)
    .maybeSingle<ProductBySlug>();

  let product = productBySlug;

  // If not found by slug and slug looks like UUID, try by ID
  const slugLooksLikeUuid = uuidPattern.test(slug);

  if (!product && slugLooksLikeUuid) {
    const { data: productById, error: idError } = await supabase
      .from("products")
      .select(
        "id,title,color,description,options,brand,image_url,image_urls,price_cents,is_active,stock_quantity"
      )
      .eq("id", slug)
      .maybeSingle<ProductBySlug>();

    if (idError) {
      console.error("[product-detail] Failed to load product by id:", idError.message);
    }

    product = productById ?? null;
  }

  if (!product) {
    if (slugError) {
      console.error("[product-detail] Failed to load product:", slugError.message);
    }
    notFound();
  }

  const displayImages =
    product.image_urls && product.image_urls.length > 0
      ? product.image_urls
      : product.image_url
        ? [product.image_url]
        : [];

  const descriptionBlocks = product.description
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  const introCopy = descriptionBlocks[0] ?? "Product details coming soon.";
  const detailCopy = descriptionBlocks.length > 1 ? descriptionBlocks.slice(1) : [];

  const optionList =
    product.options?.map((value) => value?.trim()).filter((value): value is string => !!value) ?? [];

  const isOutOfStock = product.stock_quantity === 0;
  const isInactive = !product.is_active;

  return (
    <div className="mx-auto max-w-5xl space-y-10 px-4 py-10 text-white md:px-6">
      <ScrollToTop />
      <BackToDropsButton />

      <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        {/* Image Gallery */}
        <ImageGallery
          images={displayImages}
          title={product.title}
          isOutOfStock={isOutOfStock}
          isInactive={isInactive}
        />

        {/* Product Info */}
        <div className="space-y-6">
          <div className="space-y-3">
            {product.brand && (
              <p className="text-xs uppercase tracking-[0.4em] text-white/50">{product.brand}</p>
            )}
            <div>
              <h1 className="text-3xl font-semibold text-white">{product.title}</h1>
              {product.color && (
                <p className="text-sm uppercase tracking-[0.3em] text-white/60">{product.color}</p>
              )}
            </div>
            <p className="text-base text-white/80">{introCopy}</p>
          </div>

          {/* Price */}
          <div className="rounded-xl border-2 border-neutral-800 px-5 py-4">
            <p className="text-xs uppercase text-white/60">Price</p>
            <p className="text-3xl font-semibold text-white">
              {priceFormatter.format(product.price_cents / 100)}
            </p>
          </div>

          {/* Stock Status */}
          <div className="rounded-xl border-2 border-neutral-800 px-5 py-4">
            <p className="text-xs uppercase text-white/60">Availability</p>
            {isInactive ? (
              <p className="text-lg text-white/50">This product is no longer available</p>
            ) : isOutOfStock ? (
              <p className="text-lg text-red-400">Out of Stock</p>
            ) : product.stock_quantity <= 5 ? (
              <p className="text-lg text-amber-400">Only {product.stock_quantity} left</p>
            ) : (
              <p className="text-lg text-green-400">In Stock</p>
            )}
          </div>

          {/* Product Actions (Size, Quantity, Add to Cart, Buy Now) */}
          <ProductActions
            productId={product.id}
            title={product.title}
            slug={slug}
            priceCents={product.price_cents}
            stockQuantity={product.stock_quantity}
            isActive={product.is_active}
            options={optionList}
            imageUrl={displayImages[0]}
          />
        </div>
      </div>

      {/* Product Details */}
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

      {/* Shipping Info */}
      <section className="rounded-xl border-2 border-neutral-800 px-5 py-4">
        <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-white/60">
          Shipping
        </h3>
        <div className="mt-3 space-y-2 text-sm text-white/80">
          <p>• Free standard delivery (3-5 business days)</p>
          <p>• Next day delivery available at checkout</p>
          <p>• UK shipping only</p>
        </div>
      </section>
    </div>
  );
}
