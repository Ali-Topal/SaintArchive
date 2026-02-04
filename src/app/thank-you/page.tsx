import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import CopyButton from "@/components/CopyButton";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export const revalidate = 0;

const currencyFormatter = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP",
});

const PAYPAL_USERNAME = "CenchSaint";

type OrderWithProduct = {
  id: string;
  order_number: string;
  email: string;
  quantity: number;
  size: string | null;
  total_amount_cents: number;
  shipping_method: string;
  shipping_name: string;
  shipping_address: string;
  shipping_city: string;
  shipping_postcode: string;
  status: string;
  product: {
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
};

export default async function ThankYouPage({ searchParams }: PageProps) {
  const params = await searchParams;
  
  // Support both single order (?order=XXX) and multiple orders (?orders=XXX,YYY)
  const singleOrder = typeof params?.order === "string" ? params.order : undefined;
  const multipleOrders = typeof params?.orders === "string" ? params.orders : undefined;
  
  const orderNumbers = multipleOrders 
    ? multipleOrders.split(",").filter(Boolean)
    : singleOrder 
      ? [singleOrder] 
      : [];

  if (orderNumbers.length === 0) {
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

  const supabase = supabaseAdmin();
  
  const { data: orders, error } = await supabase
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
    .in("order_number", orderNumbers);

  if (error || !orders || orders.length === 0) {
    console.error("[thank-you] Failed to retrieve orders:", error?.message);
    return (
      <section className="mx-auto max-w-3xl space-y-4 px-4 py-16 text-white/80">
        <h1 className="text-3xl font-semibold text-white">Order not found.</h1>
        <p>We couldn't find orders with those numbers. Please check your email or contact support.</p>
        <Link href="/" className="text-sm uppercase tracking-[0.3em] text-white hover:underline">
          Back to shop
        </Link>
      </section>
    );
  }

  // Calculate totals
  const totalAmountCents = orders.reduce((sum, o) => sum + o.total_amount_cents, 0);
  const totalAmount = currencyFormatter.format(totalAmountCents / 100);
  const isPendingPayment = orders.some((o) => o.status === "pending_payment");
  const firstOrder = orders[0] as OrderWithProduct;
  const isMultipleOrders = orders.length > 1;

  // Get product info helper
  const getProductTitle = (order: OrderWithProduct) => {
    const productData = order.product;
    const product = Array.isArray(productData) ? productData[0] : productData;
    return product?.title ?? "Unknown Product";
  };

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
          We've sent a confirmation to <span className="text-white">{firstOrder.email}</span>
        </p>
      </div>

      {/* Order Summary */}
      <div className="rounded-2xl border border-white/10 bg-black/20 p-6 space-y-4">
        <p className="text-xs uppercase tracking-[0.3em] text-white/60">
          {isMultipleOrders ? `${orders.length} items in your order` : "Order details"}
        </p>
        
        {orders.map((order) => {
          const typedOrder = order as OrderWithProduct;
          return (
            <div key={order.id} className="flex justify-between items-start border-b border-white/10 pb-4 last:border-0 last:pb-0">
              <div>
                <h3 className="font-semibold text-white">{getProductTitle(typedOrder)}</h3>
                <p className="text-sm text-white/60">
                  {order.size && `Size: ${order.size} · `}
                  Qty: {order.quantity}
                </p>
                <p className="text-xs text-white/40 font-mono">{order.order_number}</p>
              </div>
              <p className="font-semibold text-white">
                {currencyFormatter.format(order.total_amount_cents / 100)}
              </p>
            </div>
          );
        })}

        {isMultipleOrders && (
          <div className="flex justify-between items-center pt-2 border-t border-white/10">
            <p className="font-semibold text-white">Total</p>
            <p className="text-2xl font-semibold text-white">{totalAmount}</p>
          </div>
        )}
        
        {!isMultipleOrders && (
          <div className="grid gap-4 sm:grid-cols-2 pt-2">
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.3em] text-white/60">Order number</p>
              <div className="flex items-center gap-3">
                <p className="text-xl font-semibold text-white font-mono">{firstOrder.order_number}</p>
                <CopyButton text={firstOrder.order_number} />
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-[0.3em] text-white/60">Total</p>
              <p className="text-2xl font-semibold text-white">{totalAmount}</p>
            </div>
          </div>
        )}
      </div>

      {/* Shipping Details */}
      <div className="rounded-2xl border border-white/10 bg-black/20 p-6 text-sm text-white/80">
        <p className="text-xs uppercase tracking-[0.3em] text-white/60">Shipping to</p>
        <div className="mt-2 text-white">
          <p className="font-semibold">{firstOrder.shipping_name}</p>
          <p>{firstOrder.shipping_address}</p>
          <p>{firstOrder.shipping_city}, {firstOrder.shipping_postcode}</p>
        </div>
        <p className="mt-3 text-xs text-white/50">
          {firstOrder.shipping_method === "next_day" ? "Next Day Delivery" : "Standard Delivery (3-5 days)"}
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
            <ol className="list-decimal list-inside space-y-3">
              <li>
                Open{" "}
                <a
                  href="https://www.paypal.com/myaccount/transfer/send"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white underline hover:text-amber-400"
                >
                  PayPal
                </a>
                {" "}and select <span className="text-white">Send</span>
              </li>
              <li>
                Send to:{" "}
                <span className="font-semibold text-white">@{PAYPAL_USERNAME}</span>
              </li>
              <li>
                Amount:{" "}
                <span className="font-semibold text-white">{totalAmount}</span>
              </li>
              <li>Select <span className="font-semibold text-white">Friends & Family</span> as payment type</li>
              <li>
                Add your order number{isMultipleOrders ? "s" : ""} as the note:{" "}
                <span className="font-mono font-semibold text-white">
                  {orderNumbers.join(", ")}
                </span>
                <CopyButton text={orderNumbers.join(", ")} className="ml-2" small />
              </li>
            </ol>
          </div>
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 text-xs text-amber-200/80 space-y-2">
            <p className="font-semibold text-amber-300">Important:</p>
            <p>Please send as <span className="font-semibold">Friends & Family</span> and include your order number in the note so we can match your payment.</p>
            <p>Payments not sent via Friends & Family will be refunded. If there's any issue with your order, we handle all returns and refunds directly through our system.</p>
          </div>
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
              Payment received - Processing your order
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
