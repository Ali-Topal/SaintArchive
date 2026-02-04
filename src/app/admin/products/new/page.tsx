import Link from "next/link";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import ImageUploaderList from "@/components/ImageUploaderField";
import OptionsInput from "@/components/OptionsInput";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

async function createProduct(formData: FormData) {
  "use server";

  const title = formData.get("title")?.toString().trim() ?? "";
  const rawSlug = formData.get("slug")?.toString().trim() ?? "";
  const brand = formData.get("brand")?.toString().trim() ?? "";
  const color = formData.get("color")?.toString().trim() ?? "";
  const category = formData.get("category")?.toString().trim() || null;
  const description = formData.get("description")?.toString().trim() ?? "";
  const imageUrls = formData
    .getAll("image_urls")
    .map((value) => value?.toString().trim() ?? "")
    .filter((value): value is string => value.length > 0);
  const primaryImage = imageUrls[0] ?? null;
  const priceCents = Number(formData.get("price_cents"));
  const stockQuantity = Number(formData.get("stock_quantity"));
  const sortPriorityRaw = formData.get("sort_priority")?.toString().trim();
  const sortPriority =
    sortPriorityRaw && sortPriorityRaw.length > 0 ? Number(sortPriorityRaw) : null;
  const isActive = formData.get("is_active") === "true";
  const options =
    formData
      .getAll("options")
      .map((value) => value?.toString().trim() ?? "")
      .filter((value): value is string => value.length > 0) ?? [];

  if (!title || !rawSlug || !description) {
    throw new Error("Title, slug, and description are required.");
  }

  if (!Number.isFinite(priceCents) || priceCents <= 0) {
    throw new Error("Price must be greater than 0.");
  }

  if (!Number.isFinite(stockQuantity) || stockQuantity < 0) {
    throw new Error("Stock quantity must be 0 or greater.");
  }

  const normalizeSlug = (value: string) =>
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");

  const baseSlug = normalizeSlug(rawSlug) || normalizeSlug(title) || rawSlug;
  if (!baseSlug) {
    throw new Error("Slug could not be generated. Please provide a valid slug.");
  }

  const supabase = supabaseAdmin();
  let finalSlug = baseSlug;
  let suffix = 1;

  // Ensure slug uniqueness
  while (true) {
    const { count, error: slugError } = await supabase
      .from("products")
      .select("id", { count: "exact", head: true })
      .eq("slug", finalSlug);

    if (slugError) {
      throw new Error(slugError.message);
    }

    if (!count || count === 0) {
      break;
    }

    finalSlug = `${baseSlug}-${suffix}`;
    suffix += 1;
  }

  const { error } = await supabase.from("products").insert({
    title,
    slug: finalSlug,
    description,
    brand: brand || null,
    color: color || null,
    category,
    options,
    image_url: primaryImage,
    image_urls: imageUrls,
    price_cents: priceCents,
    stock_quantity: stockQuantity,
    sort_priority: sortPriority,
    is_active: isActive,
  });

  if (error) {
    if (error.code === "23505") {
      throw new Error("Slug already exists. Choose a different slug.");
    }
    throw new Error(error.message);
  }

  revalidatePath("/");
  revalidatePath("/admin");

  redirect("/admin?view=products");
}

export default async function NewProductPage() {
  return (
    <section className="space-y-8 py-10">
      <div className="flex flex-col gap-2">
        <Link
          href="/admin?view=products"
          className="text-xs uppercase tracking-[0.3em] text-muted hover:text-white"
        >
          ← Back to products
        </Link>
        <h1 className="text-3xl font-light tracking-widest text-foreground">
          New Product
        </h1>
      </div>

      <form
        action={createProduct}
        className="space-y-6 rounded-2xl border border-white/10 bg-white/5 p-8"
      >
        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-2 text-sm">
            <span className="text-muted uppercase tracking-[0.2em]">
              Title <span className="text-red-400">*</span>
            </span>
            <input
              name="title"
              required
              placeholder="e.g. Supreme Box Logo Hoodie"
              className="w-full rounded-xl border border-white/15 bg-transparent px-4 py-3 text-foreground focus:border-white focus:outline-none"
            />
          </label>

          <label className="space-y-2 text-sm">
            <span className="text-muted uppercase tracking-[0.2em]">
              Slug <span className="text-red-400">*</span>
            </span>
            <input
              name="slug"
              required
              placeholder="e.g. supreme-box-logo-hoodie"
              className="w-full rounded-xl border border-white/15 bg-transparent px-4 py-3 text-foreground focus:border-white focus:outline-none"
            />
          </label>

          <label className="space-y-2 text-sm">
            <span className="text-muted uppercase tracking-[0.2em]">Brand</span>
            <input
              name="brand"
              placeholder="e.g. Supreme"
              className="w-full rounded-xl border border-white/15 bg-transparent px-4 py-3 text-foreground focus:border-white focus:outline-none"
            />
          </label>

          <label className="space-y-2 text-sm">
            <span className="text-muted uppercase tracking-[0.2em]">Colour</span>
            <input
              name="color"
              placeholder="e.g. Navy / Olive"
              className="w-full rounded-xl border border-white/15 bg-transparent px-4 py-3 text-foreground focus:border-white focus:outline-none"
            />
          </label>

          <label className="space-y-2 text-sm">
            <span className="text-muted uppercase tracking-[0.2em]">Category</span>
            <select
              name="category"
              defaultValue=""
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
            required
            rows={4}
            placeholder="Product description. First line appears as intro, rest as details."
            className="w-full rounded-xl border border-white/15 bg-transparent px-4 py-3 text-foreground focus:border-white focus:outline-none"
          />
        </label>

        <OptionsInput name="options" initialOptions={[]} label="Size Options" />

        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.2em] text-muted">
            Product Images
          </p>
          <ImageUploaderList name="image_urls" initialUrls={[]} />
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <label className="space-y-2 text-sm">
            <span className="text-muted uppercase tracking-[0.2em]">
              Price (pence) <span className="text-red-400">*</span>
            </span>
            <input
              type="number"
              name="price_cents"
              required
              min={1}
              placeholder="e.g. 9999 for £99.99"
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
              required
              min={0}
              defaultValue={0}
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
            defaultChecked
            className="h-5 w-5 rounded border-white/20 bg-transparent accent-white"
          />
          <span className="text-white">Active (visible on website)</span>
        </label>

        <button
          type="submit"
          className="inline-flex items-center justify-center rounded-full bg-white px-8 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-black transition hover:bg-white/90"
        >
          Create Product
        </button>
      </form>
    </section>
  );
}
