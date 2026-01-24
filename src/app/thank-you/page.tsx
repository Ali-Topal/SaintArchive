import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabaseClient";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export const revalidate = 0;

const currencyFormatter = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP",
});

const PAYPAL_USERNAME = "CenchSaint";

export default async function ThankYouPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const orderNumberParam = params?.order;
  const orderNumber =
    typeof orderNumberParam === "string" ? orderNumberParam : undefined;

  if (!orderNumber) {
    return (
      <section className="mx-auto max-w-3xl space-y-4 px-4 py-16 text-white/80">
        <h1 className="text-3xl font-semibold text-white">Order not found.</h1>
        <p>Missing order number. Please return to the homepage and try again.</p>
        <Link href="/" className="text-sm uppercase tracking-[0.3em] text-white hover:underline">
          Back to shop
        </Link>
      </section>
    );
  }

  const supabase = await createSupabaseServerClient();
  
  const { data: order, error } = await supabase
    .from("orders")
    .select(`
      id,
      order_number,
      email,
      quantity,
      size,
      total_amount_cents,
      shipping_method,
      shipping_name,
      shipping_address,
      shipping_city,
      shipping_postcode,
      status,
      product:products(id, title, price_cents, image_url, image_urls)
    `)
    .eq("order_number", orderNumber)
    .maybeSingle();

  if (error || !order) {
    console.error("[thank-you] Failed to retrieve order:", error?.message);
    return (
      <section className="mx-auto max-w-3xl space-y-4 px-4 py-16 text-white/80">
        <h1 className="text-3xl font-semibold text-white">Order not found.</h1>
        <p>We couldn't find an order with that number. Please check your email or contact support.</p>
        <Link href="/" className="text-sm uppercase tracking-[0.3em] text-white hover:underline">
          Back to shop
        </Link>
      </section>
    );
  }

  const productData = order.product as {
    id: string;
    title: string;
    price_cents: number;
    image_url: string | null;
    image_urls: string[] | null;
  } | {
    id: string;
    title: string;
    price_cents: number;
    image_url: string | null;
    image_urls: string[] | null;
  }[] | null;
  const product = Array.isArray(productData) ? productData[0] : productData;

  const productTitle = product?.title ?? "Your order";
  const totalAmount = currencyFormatter.format(order.total_amount_cents / 100);
  const isPendingPayment = order.status === "pending_payment";

  return (
    <section className="mx-auto max-w-3xl space-y-8 px-4 py-16 text-white/80">
      <div className="space-y-3">
        <p className="text-xs uppercase tracking-[0.3em] text-white/50">
          {isPendingPayment ? "Order placed" : "Order confirmed"}
        </p>
        <h1 className="text-4xl font-semibold text-white">
          {isPendingPayment ? "Almost there!" : "Thank you!"}
        </h1>
        <p>
          We've sent a confirmation to <span className="text-white">{order.email}</span>
        </p>
      </div>

      {/* Order Summary */}
      <div className="rounded-2xl border border-white/10 bg-black/20 p-6 text-sm text-white/80">
        <p className="text-xs uppercase tracking-[0.3em] text-white/60">Order details</p>
        <h2 className="text-2xl font-semibold text-white">{productTitle}</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-[0.3em] text-white/60">Order number</p>
            <p className="text-xl font-semibold text-white font-mono">{order.order_number}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-[0.3em] text-white/60">Total</p>
            <p className="text-2xl font-semibold text-white">{totalAmount}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-[0.3em] text-white/60">Quantity</p>
            <p className="text-xl font-semibold text-white">{order.quantity}</p>
          </div>
          {order.size && (
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-[0.3em] text-white/60">Size</p>
              <p className="text-xl font-semibold text-white">{order.size}</p>
            </div>
          )}
        </div>
      </div>

      {/* Shipping Details */}
      <div className="rounded-2xl border border-white/10 bg-black/20 p-6 text-sm text-white/80">
        <p className="text-xs uppercase tracking-[0.3em] text-white/60">Shipping to</p>
        <div className="mt-2 text-white">
          <p className="font-semibold">{order.shipping_name}</p>
          <p>{order.shipping_address}</p>
          <p>{order.shipping_city}, {order.shipping_postcode}</p>
        </div>
        <p className="mt-3 text-xs text-white/50">
          {order.shipping_method === "next_day" ? "Next Day Delivery" : "Standard Delivery (3-5 days)"}
        </p>
      </div>

      {/* PayPal Payment Instructions - Only show if pending payment */}
      {isPendingPayment && (
        <div className="rounded-2xl border-2 border-amber-500/50 bg-amber-500/10 p-6 space-y-4">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-amber-500 animate-pulse" />
            <p className="text-xs uppercase tracking-[0.3em] text-amber-400">Payment required</p>
          </div>
          <h3 className="text-xl font-semibold text-white">Complete your payment via PayPal</h3>
          <div className="space-y-3 text-sm text-white/80">
            <p>To complete your order, please send payment via PayPal:</p>
            <ol className="list-decimal list-inside space-y-2">
              <li>
                Go to{" "}
                <a
                  href={`https://paypal.me/${PAYPAL_USERNAME}/${(order.total_amount_cents / 100).toFixed(2)}GBP`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white underline hover:text-amber-400"
                >
                  PayPal.me/{PAYPAL_USERNAME}
                </a>
              </li>
              <li>Send <span className="font-semibold text-white">{totalAmount}</span></li>
              <li>
                Add your order number as the reference:{" "}
                <span className="font-mono font-semibold text-white">{order.order_number}</span>
              </li>
            </ol>
          </div>
          <a
            href={`https://paypal.me/${PAYPAL_USERNAME}/${(order.total_amount_cents / 100).toFixed(2)}GBP`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex w-full items-center justify-center rounded-full bg-[#0070ba] px-6 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-[#005ea6]"
          >
            Pay with PayPal
          </a>
          <p className="text-xs text-white/50 text-center">
            Your order will be processed once payment is confirmed.
          </p>
        </div>
      )}

      {/* Status for paid orders */}
      {!isPendingPayment && (
        <div className="rounded-2xl border border-green-500/30 bg-green-500/10 p-6">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-green-500" />
            <p className="text-sm text-green-400">
              {order.status === "paid" && "Payment received - Processing your order"}
              {order.status === "processing" && "Your order is being prepared"}
              {order.status === "shipped" && "Your order has been shipped"}
              {order.status === "delivered" && "Your order has been delivered"}
            </p>
          </div>
        </div>
      )}

      <div className="pt-4">
        <Link
          href="/"
          className="text-xs uppercase tracking-[0.3em] text-white hover:underline"
        >
          Continue shopping
        </Link>
      </div>
    </section>
  );
}
