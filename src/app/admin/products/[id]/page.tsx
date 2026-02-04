import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import ImageUploaderList from "@/components/ImageUploaderField";
import OptionsInput from "@/components/OptionsInput";
import Toast from "@/components/Toast";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

type PageProps = {
  params: Promise<{ id: string }>;
};

async function updateProduct(formData: FormData) {
  "use server";

  const productId = formData.get("productId")?.toString();
  if (!productId) {
    throw new Error("Missing product ID");
  }

  const rawSlug = formData.get("slug")?.toString().trim() ?? "";
  const sortPriorityRaw = formData.get("sort_priority")?.toString().trim();
  const sortPriority =
    sortPriorityRaw && sortPriorityRaw.length > 0 ? Number(sortPriorityRaw) : null;

  const category = formData.get("category")?.toString().trim() || null;

  const payload = {
    title: formData.get("title")?.toString().trim() ?? "",
    brand: formData.get("brand")?.toString().trim() ?? "",
    color: formData.get("color")?.toString().trim() ?? "",
    category,
    options: formData
      .getAll("options")
      .map((value) => value?.toString().trim() ?? "")
      .filter((value): value is string => value.length > 0),
    description: formData.get("description")?.toString().trim() ?? "",
    image_urls: formData
      .getAll("image_urls")
      .map((value) => value?.toString().trim() ?? "")
      .filter((value): value is string => value.length > 0),
    price_cents: Number(formData.get("price_cents")),
    stock_quantity: Number(formData.get("stock_quantity")),
    is_active: formData.get("is_active") === "true",
    sort_priority: sortPriority,
  };

  if (!payload.title || !rawSlug || !payload.description) {
    throw new Error("Title, slug, and description are required.");
  }

  if (!Number.isFinite(payload.price_cents) || payload.price_cents <= 0) {
    throw new Error("Price must be greater than 0.");
  }

  if (!Number.isFinite(payload.stock_quantity) || payload.stock_quantity < 0) {
    throw new Error("Stock quantity must be 0 or greater.");
  }

  const normalizeSlug = (value: string) =>
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");

  const baseSlug = normalizeSlug(rawSlug);
  if (!baseSlug) {
    throw new Error("Invalid slug.");
  }

  const supabase = supabaseAdmin();
  let finalSlug = baseSlug;
  let suffix = 1;

  // Ensure slug uniqueness (excluding current product)
  while (true) {
    const { count, error: slugError } = await supabase
      .from("products")
      .select("id", { count: "exact", head: true })
      .eq("slug", finalSlug)
      .neq("id", productId);

    if (slugError) {
      throw new Error(slugError.message);
    }

    if (!count || count === 0) {
      break;
    }

    finalSlug = `${baseSlug}-${suffix}`;
    suffix += 1;
  }

  const { error } = await supabase
    .from("products")
    .update({
      ...payload,
      brand: payload.brand || null,
      color: payload.color || null,
      options: payload.options ?? [],
      slug: finalSlug,
      image_url: payload.image_urls[0] ?? null,
    })
    .eq("id", productId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath(`/products/${finalSlug}`);

  const cookieStore = await cookies();
  cookieStore.set({
    name: "admin-toast",
    value: "saved",
    path: `/admin/products/${productId}`,
    maxAge: 10,
  });

  redirect(`/admin/products/${productId}`);
}

async function deleteProduct(formData: FormData) {
  "use server";

  const productId = formData.get("productId")?.toString();
  if (!productId) {
    throw new Error("Missing product ID");
  }

  const supabase = supabaseAdmin();

  // Check for existing orders
  const { count: orderCount } = await supabase
    .from("orders")
    .select("id", { count: "exact", head: true })
    .eq("product_id", productId);

  if (orderCount && orderCount > 0) {
    throw new Error("Cannot delete product with existing orders. Deactivate it instead.");
  }

  const { error } = await supabase
    .from("products")
    .delete()
    .eq("id", productId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/");
  revalidatePath("/admin");

  redirect("/admin?view=products");
}

export default async function EditProductPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = supabaseAdmin();
  const cookieStore = await cookies();
  const toastCookie = cookieStore.get("admin-toast");
  const showSuccessToast = toastCookie?.value === "saved";

  const { data: product, error } = await supabase
    .from("products")
    .select(
      "id,title,slug,brand,color,category,options,description,image_url,image_urls,price_cents,stock_quantity,is_active,sort_priority"
    )
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("[admin-product] Failed to fetch product:", error.message);
  }

  if (!product) {
    notFound();
  }

  // Get order count for this product
  const { count: orderCount } = await supabase
    .from("orders")
    .select("id", { count: "exact", head: true })
    .eq("product_id", id);

  return (
    <>
      {showSuccessToast && (
        <Toast message="Changes saved" cookiePath={`/admin/products/${product.id}`} />
      )}
      
      <section className="space-y-8 py-10">
        <div className="flex flex-col gap-2">
          <Link
            href="/admin?view=products"
            className="text-xs uppercase tracking-[0.3em] text-muted hover:text-white"
          >
            ← Back to products
          </Link>
          <h1 className="text-3xl font-light tracking-widest text-foreground">
            Edit "{product.title}"
          </h1>
          <div className="flex items-center gap-3 text-sm">
            <span className={`rounded-full px-3 py-1 text-xs ${
              product.is_active 
                ? "bg-green-500/20 text-green-400" 
                : "bg-red-500/20 text-red-400"
            }`}>
              {product.is_active ? "Active" : "Inactive"}
            </span>
            <span className="text-white/50">
              Stock: {product.stock_quantity}
            </span>
            <span className="text-white/50">
              Orders: {orderCount ?? 0}
            </span>
          </div>
        </div>

        <form
          action={updateProduct}
          className="space-y-6 rounded-2xl border border-white/10 bg-white/5 p-8"
        >
          <input type="hidden" name="productId" value={product.id} />

          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2 text-sm">
              <span className="text-muted uppercase tracking-[0.2em]">
                Title <span className="text-red-400">*</span>
              </span>
              <input
                name="title"
                defaultValue={product.title}
                required
                className="w-full rounded-xl border border-white/15 bg-transparent px-4 py-3 text-foreground focus:border-white focus:outline-none"
              />
            </label>

            <label className="space-y-2 text-sm">
              <span className="text-muted uppercase tracking-[0.2em]">
                Slug <span className="text-red-400">*</span>
              </span>
              <input
                name="slug"
                defaultValue={product.slug}
                required
                className="w-full rounded-xl border border-white/15 bg-transparent px-4 py-3 text-foreground focus:border-white focus:outline-none"
              />
            </label>

            <label className="space-y-2 text-sm">
              <span className="text-muted uppercase tracking-[0.2em]">Brand</span>
              <input
                name="brand"
                defaultValue={product.brand ?? ""}
                placeholder="e.g. Supreme"
                className="w-full rounded-xl border border-white/15 bg-transparent px-4 py-3 text-foreground focus:border-white focus:outline-none"
              />
            </label>

            <label className="space-y-2 text-sm">
              <span className="text-muted uppercase tracking-[0.2em]">Colour</span>
              <input
                name="color"
                defaultValue={product.color ?? ""}
                placeholder="e.g. Navy / Olive"
                className="w-full rounded-xl border border-white/15 bg-transparent px-4 py-3 text-foreground focus:border-white focus:outline-none"
              />
            </label>

            <label className="space-y-2 text-sm">
              <span className="text-muted uppercase tracking-[0.2em]">Category</span>
              <select
                name="category"
                defaultValue={product.category ?? ""}
                className="w-full rounded-xl border border-white/15 bg-transparent px-4 py-3 text-foreground focus:border-white focus:outline-none"
              >
                <option value="" className="bg-neutral-900">No Category</option>
                <option value="jackets" className="bg-neutral-900">Jackets</option>
                <option value="hoodies" className="bg-neutral-900">Hoodies</option>
                <option value="t-shirts" className="bg-neutral-900">T-Shirts</option>
                <option value="shirts" className="bg-neutral-900">Shirts</option>
                <option value="trousers" className="bg-neutral-900">Trousers</option>
                <option value="shorts" className="bg-neutral-900">Shorts</option>
                <option value="footwear" className="bg-neutral-900">Footwear</option>
                <option value="accessories" className="bg-neutral-900">Accessories</option>
                <option value="bags" className="bg-neutral-900">Bags</option>
                <option value="hats" className="bg-neutral-900">Hats</option>
              </select>
            </label>
          </div>

          <label className="space-y-2 text-sm block">
            <span className="text-muted uppercase tracking-[0.2em]">
              Description <span className="text-red-400">*</span>
            </span>
            <textarea
              name="description"
              defaultValue={product.description}
              required
              rows={4}
              className="w-full rounded-xl border border-white/15 bg-transparent px-4 py-3 text-foreground focus:border-white focus:outline-none"
            />
          </label>

          <OptionsInput
            name="options"
            initialOptions={product.options ?? []}
            label="Size Options"
          />

          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.2em] text-muted">
              Product Images
            </p>
            <ImageUploaderList
              name="image_urls"
              initialUrls={
                product.image_urls && product.image_urls.length > 0
                  ? product.image_urls
                  : product.image_url
                    ? [product.image_url]
                    : []
              }
            />
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <label className="space-y-2 text-sm">
              <span className="text-muted uppercase tracking-[0.2em]">
                Price (pence) <span className="text-red-400">*</span>
              </span>
              <input
                type="number"
                name="price_cents"
                defaultValue={product.price_cents}
                required
                min={1}
                className="w-full rounded-xl border border-white/15 bg-transparent px-4 py-3 text-foreground focus:border-white focus:outline-none"
              />
            </label>

            <label className="space-y-2 text-sm">
              <span className="text-muted uppercase tracking-[0.2em]">
                Stock Quantity <span className="text-red-400">*</span>
              </span>
              <input
                type="number"
                name="stock_quantity"
                defaultValue={product.stock_quantity}
                required
                min={0}
                className="w-full rounded-xl border border-white/15 bg-transparent px-4 py-3 text-foreground focus:border-white focus:outline-none"
              />
            </label>

            <label className="space-y-2 text-sm">
              <span className="text-muted uppercase tracking-[0.2em]">
                Display Priority
              </span>
              <input
                type="number"
                name="sort_priority"
                defaultValue={product.sort_priority ?? ""}
                placeholder="Lower = first"
                className="w-full rounded-xl border border-white/15 bg-transparent px-4 py-3 text-foreground focus:border-white focus:outline-none"
              />
            </label>
          </div>

          <label className="flex items-center gap-3 text-sm">
            <input
              type="checkbox"
              name="is_active"
              value="true"
              defaultChecked={product.is_active}
              className="h-5 w-5 rounded border-white/20 bg-transparent accent-white"
            />
            <span className="text-white">Active (visible on website)</span>
          </label>

          <div className="flex flex-wrap gap-4">
            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-full bg-white px-8 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-black transition hover:bg-white/90"
            >
              Save Changes
            </button>
            <Link
              href={`/products/${product.slug ?? product.id}`}
              className="inline-flex items-center justify-center rounded-full border border-white/20 px-8 py-3 text-sm uppercase tracking-[0.2em] text-white transition hover:border-white/40"
            >
              View Product
            </Link>
          </div>
        </form>

        {/* Danger Zone */}
        <div className="rounded-2xl border border-red-500/30 bg-red-500/5 p-6 space-y-4">
          <h2 className="text-lg font-semibold text-red-400">Danger Zone</h2>
          <p className="text-sm text-white/60">
            {(orderCount ?? 0) > 0
              ? "This product has orders and cannot be deleted. You can deactivate it instead."
              : "Permanently delete this product. This action cannot be undone."}
          </p>
          <form action={deleteProduct}>
            <input type="hidden" name="productId" value={product.id} />
            <button
              type="submit"
              disabled={(orderCount ?? 0) > 0}
              className="rounded-full border border-red-500/50 px-6 py-2 text-sm uppercase tracking-[0.2em] text-red-400 transition hover:bg-red-500/10 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Delete Product
            </button>
          </form>
        </div>
      </section>
    </>
  );
}
