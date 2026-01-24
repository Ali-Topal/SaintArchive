import { notFound, redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabaseClient";
import CheckoutForm from "@/components/CheckoutForm";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

type ProductData = {
  id: string;
  title: string;
  color: string | null;
  price_cents: number;
  stock_quantity: number;
  is_active: boolean;
  options: string[] | null;
  image_url: string | null;
  image_urls: string[] | null;
};

export default async function CheckoutPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const productIdParam = params?.product;
  const productId = typeof productIdParam === "string" ? productIdParam : undefined;
  const sizeParam = params?.size;
  const preselectedSize = typeof sizeParam === "string" ? sizeParam : undefined;
  const qtyParam = params?.qty;
  const preselectedQty = typeof qtyParam === "string" ? parseInt(qtyParam, 10) : 1;

  if (!productId) {
    redirect("/");
  }

  const supabase = await createSupabaseServerClient();

  const { data: product, error } = await supabase
    .from("products")
    .select("id,title,color,price_cents,stock_quantity,is_active,options,image_url,image_urls")
    .eq("id", productId)
    .maybeSingle<ProductData>();

  if (error || !product) {
    notFound();
  }

  if (!product.is_active) {
    return (
      <section className="mx-auto max-w-3xl space-y-4 px-4 py-16 text-white/80">
        <h1 className="text-3xl font-semibold text-white">Product unavailable</h1>
        <p>This product is no longer available for purchase.</p>
      </section>
    );
  }

  if (product.stock_quantity === 0) {
    return (
      <section className="mx-auto max-w-3xl space-y-4 px-4 py-16 text-white/80">
        <h1 className="text-3xl font-semibold text-white">Out of stock</h1>
        <p>This product is currently out of stock. Please check back later.</p>
      </section>
    );
  }

  const imageUrl = product.image_urls?.[0] ?? product.image_url ?? null;
  const options = product.options?.filter((v): v is string => !!v?.trim()) ?? [];

  return (
    <section className="mx-auto max-w-4xl px-4 py-10">
      <div className="mb-8">
        <p className="text-xs uppercase tracking-[0.3em] text-white/50">Checkout</p>
        <h1 className="text-3xl font-semibold text-white">Complete your order</h1>
      </div>

      <CheckoutForm
        productId={product.id}
        productTitle={product.title}
        productColor={product.color}
        productPriceCents={product.price_cents}
        productImageUrl={imageUrl}
        productOptions={options}
        maxQuantity={Math.min(product.stock_quantity, 10)}
        preselectedSize={preselectedSize}
        preselectedQuantity={Math.min(preselectedQty, product.stock_quantity, 10)}
      />
    </section>
  );
}
