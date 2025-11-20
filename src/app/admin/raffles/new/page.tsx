import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import ImageUploaderList from "@/components/ImageUploaderField";
import { createSupabaseServerClient } from "@/lib/supabaseClient";

type NewRafflePageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const ADMIN_KEY = process.env.ADMIN_KEY;

async function createRaffle(formData: FormData) {
  "use server";

  const key = formData.get("adminKey")?.toString();

  if (!ADMIN_KEY || key !== ADMIN_KEY) {
    throw new Error("Unauthorized");
  }

  const title = formData.get("title")?.toString().trim() ?? "";
  const rawSlug = formData.get("slug")?.toString().trim() ?? "";
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

  if (!title || !rawSlug || !description || !Number.isFinite(ticketPrice)) {
    throw new Error("Missing required fields.");
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

  const supabase = await createSupabaseServerClient();
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
    image_url: primaryImage,
    image_urls: imageUrls,
    ticket_price_cents: ticketPrice,
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

  redirect(`/admin?key=${key}`);
}

export default async function NewRafflePage({
  searchParams,
}: NewRafflePageProps) {
  const params = await searchParams;
  const providedKey =
    typeof params?.key === "string" ? params.key : undefined;

  if (!ADMIN_KEY || providedKey !== ADMIN_KEY) {
    return (
      <section className="flex min-h-[50vh] items-center justify-center text-sm uppercase tracking-[0.4em] text-muted">
        Unauthorized
      </section>
    );
  }

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
        <input type="hidden" name="adminKey" value={providedKey} />
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
            adminKey={providedKey}
            initialUrls={[]}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-2 text-sm">
            <span className="text-muted uppercase tracking-[0.3em]">
              Ticket Price (pence)
            </span>
            <input
              type="number"
              min={100}
              name="ticket_price_cents"
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

