import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import ImageUploaderList from "@/components/ImageUploaderField";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

async function createRaffle(formData: FormData) {
  "use server";

  const title = formData.get("title")?.toString().trim() ?? "";
  const rawSlug = formData.get("slug")?.toString().trim() ?? "";
  const brand = formData.get("brand")?.toString().trim() ?? "";
  const color = formData.get("color")?.toString().trim() ?? "";
  const description = formData.get("description")?.toString().trim() ?? "";
  const imageUrls = formData
    .getAll("image_urls")
    .map((value) => value?.toString().trim() ?? "")
    .filter((value): value is string => value.length > 0);
  const primaryImage = imageUrls[0] ?? null;
  const ticketPrice = Number(formData.get("ticket_price_cents"));
  const closesAtRaw = formData.get("closes_at")?.toString() || "";
  const closesAt = closesAtRaw ? new Date(closesAtRaw) : null;
  const maxTicketsRaw = formData.get("max_tickets")?.toString().trim();
  const maxTickets =
    maxTicketsRaw && maxTicketsRaw.length > 0 ? Number(maxTicketsRaw) : null;
  const sortPriorityRaw = formData.get("sort_priority")?.toString().trim();
  const sortPriority =
    sortPriorityRaw && sortPriorityRaw.length > 0 ? Number(sortPriorityRaw) : null;
  const maxEntriesPerUser = Number(formData.get("max_entries_per_user"));

  if (
    !title ||
    !rawSlug ||
    !description ||
    !Number.isFinite(ticketPrice) ||
    !Number.isFinite(maxEntriesPerUser)
  ) {
    throw new Error("Missing required fields.");
  }

  if (maxEntriesPerUser < 1) {
    throw new Error("Max entries per user must be at least 1.");
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
  // Ensure slug uniqueness before insert to avoid constraint violation
  while (true) {
    const { count, error: slugError } = await supabase
      .from("raffles")
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

  const { error } = await supabase.from("raffles").insert({
    title,
    slug: finalSlug,
    description,
    brand: brand || null,
    color: color || null,
    image_url: primaryImage,
    image_urls: imageUrls,
    ticket_price_cents: ticketPrice,
    max_entries_per_user: maxEntriesPerUser,
    closes_at: closesAt && !Number.isNaN(closesAt.valueOf())
      ? closesAt.toISOString()
      : null,
    max_tickets: maxTickets,
    sort_priority: sortPriority,
    status: "draft",
  });

  if (error) {
    if (error.code === "23505") {
      throw new Error("Slug already exists. Choose a different slug.");
    }
    throw new Error(error.message);
  }

  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/winners");

  redirect("/admin");
}

export default async function NewRafflePage() {
  return (
    <section className="space-y-10 py-16">
      <div>
        <p className="text-xs uppercase tracking-[0.6em] text-muted">
          Admin
        </p>
        <h1 className="text-3xl font-light tracking-widest text-foreground">
          New Raffle
        </h1>
      </div>

      <form
        action={createRaffle}
        className="space-y-6 rounded-3xl border border-white/10 bg-white/5 p-8"
      >
        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-2 text-sm">
            <span className="text-muted uppercase tracking-[0.3em]">
              Title
            </span>
            <input
              name="title"
              required
              className="w-full rounded-2xl border border-white/15 bg-transparent px-4 py-3 text-foreground focus:border-accent focus:outline-none"
            />
          </label>

          <label className="space-y-2 text-sm">
            <span className="text-muted uppercase tracking-[0.3em]">
              Slug
            </span>
            <input
              name="slug"
              required
              className="w-full rounded-2xl border border-white/15 bg-transparent px-4 py-3 text-foreground focus:border-accent focus:outline-none"
            />
          </label>

          <label className="space-y-2 text-sm">
            <span className="text-muted uppercase tracking-[0.3em]">
              Brand
            </span>
            <input
              name="brand"
              placeholder="e.g. Supreme"
              className="w-full rounded-2xl border border-white/15 bg-transparent px-4 py-3 text-foreground focus:border-accent focus:outline-none"
            />
          </label>

          <label className="space-y-2 text-sm">
            <span className="text-muted uppercase tracking-[0.3em]">
              Colour
            </span>
            <input
              name="color"
              placeholder="e.g. Navy / Olive"
              className="w-full rounded-2xl border border-white/15 bg-transparent px-4 py-3 text-foreground focus:border-accent focus:outline-none"
            />
          </label>
        </div>

        <label className="space-y-2 text-sm block">
          <span className="text-muted uppercase tracking-[0.3em]">
            Description
          </span>
          <textarea
            name="description"
            required
            rows={4}
            className="w-full rounded-2xl border border-white/15 bg-transparent px-4 py-3 text-foreground focus:border-accent focus:outline-none"
          />
        </label>

        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.3em] text-muted">
            Gallery images
          </p>
          <ImageUploaderList
            name="image_urls"
            initialUrls={[]}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <label className="space-y-2 text-sm">
            <span className="text-muted uppercase tracking-[0.3em]">
              Ticket Price (pence)
            </span>
            <input
              type="number"
              name="ticket_price_cents"
              required
              className="w-full rounded-2xl border border-white/15 bg-transparent px-4 py-3 text-foreground focus:border-accent focus:outline-none"
            />
          </label>

          <label className="space-y-2 text-sm">
            <span className="text-muted uppercase tracking-[0.3em]">
              Max entries per user
            </span>
            <input
              type="number"
              min={1}
              name="max_entries_per_user"
              defaultValue={20}
              required
              className="w-full rounded-2xl border border-white/15 bg-transparent px-4 py-3 text-foreground focus:border-accent focus:outline-none"
            />
          </label>

          <label className="space-y-2 text-sm">
            <span className="text-muted uppercase tracking-[0.3em]">
              Closes At
            </span>
            <input
              type="datetime-local"
              name="closes_at"
              className="w-full rounded-2xl border border-white/15 bg-transparent px-4 py-3 text-foreground focus:border-accent focus:outline-none"
            />
          </label>
        </div>

        <label className="space-y-2 text-sm block">
          <span className="text-muted uppercase tracking-[0.3em]">
            Max Tickets
          </span>
          <input
            type="number"
            min={1}
            name="max_tickets"
            className="w-full rounded-2xl border border-white/15 bg-transparent px-4 py-3 text-foreground focus:border-accent focus:outline-none"
          />
        </label>

        <label className="space-y-2 text-sm block">
          <span className="text-muted uppercase tracking-[0.3em]">
            Display Priority (lower = earlier)
          </span>
          <input
            type="number"
            name="sort_priority"
            className="w-full rounded-2xl border border-white/15 bg-transparent px-4 py-3 text-foreground focus:border-accent focus:outline-none"
          />
        </label>

        <button
          type="submit"
          className="inline-flex items-center justify-center rounded-full bg-accent px-8 py-3 text-sm font-semibold uppercase tracking-[0.3em] text-background transition hover:opacity-90"
        >
          Create raffle
        </button>
      </form>
    </section>
  );
}

