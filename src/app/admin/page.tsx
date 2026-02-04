import Link from "next/link";
import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import DraggableProductList from "@/components/DraggableProductList";

const priceFormatter = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP",
});

const formatDate = (value: string | null) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) return "—";
  return date.toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
};

async function toggleProductActiveAction(productId: string, currentActive: boolean) {
  "use server";

  if (!productId) {
    throw new Error("Missing product ID");
  }

  const supabase = supabaseAdmin();
  const { error } = await supabase
    .from("products")
    .update({ is_active: !currentActive })
    .eq("id", productId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/");
  revalidatePath("/admin");
}

async function updateOrderStatus(formData: FormData) {
  "use server";

  const orderId = formData.get("orderId")?.toString();
  const status = formData.get("status")?.toString();

  if (!orderId || !status) {
    throw new Error("Missing parameters");
  }

  const supabase = supabaseAdmin();
  const { error } = await supabase
    .from("orders")
    .update({ status })
    .eq("id", orderId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/admin");
}

type AdminPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdminPage({ searchParams }: AdminPageProps = {}) {
  const resolvedSearchParams =
    searchParams !== undefined
      ? await searchParams
      : ({} as Record<string, string | string[] | undefined>);

  const viewRaw = resolvedSearchParams.view;
  const view = Array.isArray(viewRaw) ? viewRaw[0] : viewRaw ?? "products";

  const statusFilterRaw = resolvedSearchParams.status;
  const statusFilter = Array.isArray(statusFilterRaw)
    ? statusFilterRaw[0]
    : statusFilterRaw ?? "all";

  const supabase = supabaseAdmin();

  // Fetch products
  const { data: products, error: productsError } = await supabase
    .from("products")
    .select("id,title,slug,brand,price_cents,stock_quantity,is_active,image_url,image_urls,sort_priority")
    .order("sort_priority", { ascending: true, nullsFirst: true })
    .order("title", { ascending: true });

  if (productsError) {
    console.error("[admin] Failed to load products:", productsError.message);
  }

  // Fetch orders with product info
  let ordersQuery = supabase
    .from("orders")
    .select(`
      id,
      order_number,
      email,
      quantity,
      size,
      total_amount_cents,
      status,
      shipping_name,
      shipping_city,
      shipping_postcode,
      shipping_method,
      created_at,
      product:products(id, title)
    `)
    .order("created_at", { ascending: false });

  if (statusFilter !== "all") {
    ordersQuery = ordersQuery.eq("status", statusFilter);
  }

  const { data: orders, error: ordersError } = await ordersQuery;

  if (ordersError) {
    console.error("[admin] Failed to load orders:", ordersError.message);
  }

  const productItems = products ?? [];
  const orderItems = orders ?? [];

  const orderStatuses = ["all", "pending_payment", "paid", "processing", "shipped", "delivered", "cancelled"];

  return (
    <section className="space-y-8 py-10">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.6em] text-muted">Admin</p>
          <h1 className="text-3xl font-light tracking-widest text-foreground">
            Dashboard
          </h1>
        </div>
      </div>

      {/* View Tabs */}
      <div className="flex gap-2 border-b border-white/10 pb-4">
        <Link
          href="/admin?view=products"
          className={`rounded-full border px-6 py-2 text-sm uppercase tracking-[0.2em] transition ${
            view === "products"
              ? "border-white bg-white text-black"
              : "border-white/20 text-white hover:border-white/40"
          }`}
        >
          Products ({productItems.length})
        </Link>
        <Link
          href="/admin?view=orders"
          className={`rounded-full border px-6 py-2 text-sm uppercase tracking-[0.2em] transition ${
            view === "orders"
              ? "border-white bg-white text-black"
              : "border-white/20 text-white hover:border-white/40"
          }`}
        >
          Orders ({orderItems.length})
        </Link>
      </div>

      {/* Products View */}
      {view === "products" && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Link
              href="/admin/products/new"
              className="inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-black transition hover:bg-white/90"
            >
              + New Product
            </Link>
          </div>

          {productItems.length === 0 ? (
            <p className="rounded-2xl border border-white/10 bg-white/5 p-10 text-center text-xs uppercase tracking-[0.3em] text-muted">
              No products yet.
            </p>
          ) : (
            <DraggableProductList
              initialProducts={productItems}
              onToggleActive={toggleProductActiveAction}
            />
          )}
        </div>
      )}

      {/* Orders View */}
      {view === "orders" && (
        <div className="space-y-4">
          {/* Status Filter */}
          <div className="flex flex-wrap gap-2">
            {orderStatuses.map((status) => {
              const isActive = statusFilter === status;
              const href = status === "all"
                ? "/admin?view=orders"
                : `/admin?view=orders&status=${status}`;
              return (
                <Link
                  key={status}
                  href={href}
                  className={`rounded-full border px-4 py-2 text-xs uppercase tracking-[0.2em] transition ${
                    isActive
                      ? "border-white bg-white text-black"
                      : "border-white/20 text-white/70 hover:border-white/40"
                  }`}
                >
                  {status.replace("_", " ")}
                </Link>
              );
            })}
          </div>

          {orderItems.length === 0 ? (
            <p className="rounded-2xl border border-white/10 bg-white/5 p-10 text-center text-xs uppercase tracking-[0.3em] text-muted">
              No orders found.
            </p>
          ) : (
            <div className="space-y-3">
              {orderItems.map((order) => {
                const productData = order.product as { id: string; title: string } | { id: string; title: string }[] | null;
                const product = Array.isArray(productData) ? productData[0] : productData;
                const statusColors: Record<string, string> = {
                  pending_payment: "bg-amber-500/20 text-amber-400",
                  paid: "bg-blue-500/20 text-blue-400",
                  processing: "bg-purple-500/20 text-purple-400",
                  shipped: "bg-cyan-500/20 text-cyan-400",
                  delivered: "bg-green-500/20 text-green-400",
                  cancelled: "bg-red-500/20 text-red-400",
                };

                return (
                  <div
                    key={order.id}
                    className="rounded-2xl border border-white/10 bg-white/5 p-5"
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-3">
                          <span className="font-mono text-lg font-semibold text-white">
                            {order.order_number}
                          </span>
                          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusColors[order.status] ?? "bg-white/10 text-white/60"}`}>
                            {order.status.replace("_", " ")}
                          </span>
                        </div>
                        <p className="text-sm text-white/80">
                          {product?.title ?? "Unknown Product"}
                          {order.size && ` · Size: ${order.size}`}
                          {` · Qty: ${order.quantity}`}
                        </p>
                        <p className="text-sm text-white/60">
                          {order.email}
                        </p>
                        <p className="text-xs text-white/50">
                          {order.shipping_name} · {order.shipping_city}, {order.shipping_postcode}
                          {order.shipping_method === "next_day" && " · Next Day"}
                        </p>
                        <p className="text-xs text-white/40">
                          {formatDate(order.created_at)}
                        </p>
                      </div>

                      <div className="flex flex-col items-end gap-3">
                        <p className="text-xl font-semibold text-white">
                          {priceFormatter.format(order.total_amount_cents / 100)}
                        </p>
                        
                        <form action={updateOrderStatus} className="flex flex-wrap gap-2">
                          <input type="hidden" name="orderId" value={order.id} />
                          {order.status === "pending_payment" && (
                            <button
                              type="submit"
                              name="status"
                              value="paid"
                              className="rounded-full border border-green-500/30 bg-green-500/10 px-4 py-2 text-xs uppercase tracking-[0.2em] text-green-400 transition hover:bg-green-500/20"
                            >
                              Mark Paid
                            </button>
                          )}
                          {order.status === "paid" && (
                            <button
                              type="submit"
                              name="status"
                              value="processing"
                              className="rounded-full border border-purple-500/30 bg-purple-500/10 px-4 py-2 text-xs uppercase tracking-[0.2em] text-purple-400 transition hover:bg-purple-500/20"
                            >
                              Processing
                            </button>
                          )}
                          {order.status === "processing" && (
                            <button
                              type="submit"
                              name="status"
                              value="shipped"
                              className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-4 py-2 text-xs uppercase tracking-[0.2em] text-cyan-400 transition hover:bg-cyan-500/20"
                            >
                              Mark Shipped
                            </button>
                          )}
                          {order.status === "shipped" && (
                            <button
                              type="submit"
                              name="status"
                              value="delivered"
                              className="rounded-full border border-green-500/30 bg-green-500/10 px-4 py-2 text-xs uppercase tracking-[0.2em] text-green-400 transition hover:bg-green-500/20"
                            >
                              Mark Delivered
                            </button>
                          )}
                          {!["cancelled", "delivered"].includes(order.status) && (
                            <button
                              type="submit"
                              name="status"
                              value="cancelled"
                              className="rounded-full border border-red-500/30 px-4 py-2 text-xs uppercase tracking-[0.2em] text-red-400 transition hover:bg-red-500/10"
                            >
                              Cancel
                            </button>
                          )}
                        </form>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
