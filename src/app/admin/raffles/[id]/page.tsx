import Link from "next/link";
import { notFound } from "next/navigation";
import { revalidatePath } from "next/cache";
import ImageUploaderList from "@/components/ImageUploaderField";
import { createSupabaseServerClient } from "@/lib/supabaseClient";

const ADMIN_KEY = process.env.ADMIN_KEY;

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const formatDateTime = (value: string | null) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) return "";
  return date.toISOString().slice(0, 16);
};

async function updateRaffleAction(formData: FormData) {
  "use server";

  const key = formData.get("adminKey")?.toString();
  if (!ADMIN_KEY || key !== ADMIN_KEY) {
    throw new Error("Unauthorized");
  }

  const raffleId = formData.get("raffleId")?.toString();
  if (!raffleId) {
    throw new Error("Missing raffle id");
  }

  const rawSlug = formData.get("slug")?.toString().trim() ?? "";
  const sortPriorityRaw = formData.get("sort_priority")?.toString().trim();
  const sortPriority =
    sortPriorityRaw && sortPriorityRaw.length > 0 ? Number(sortPriorityRaw) : null;

  const payload = {
    title: formData.get("title")?.toString().trim() ?? "",
    description: formData.get("description")?.toString().trim() ?? "",
    image_urls: formData
      .getAll("image_urls")
      .map((value) => value?.toString().trim() ?? "")
      .filter((value): value is string => value.length > 0),
    ticket_price_cents: Number(formData.get("ticket_price_cents")),
    max_tickets:
      formData.get("max_tickets")?.toString().trim() === ""
        ? null
        : Number(formData.get("max_tickets")),
    closes_at: (() => {
      const raw = formData.get("closes_at")?.toString();
      if (!raw) return null;
      const date = new Date(raw);
      return Number.isNaN(date.valueOf()) ? null : date.toISOString();
    })(),
    status: formData.get("status")?.toString() ?? "draft",
    sort_priority: sortPriority,
  };

  if (!payload.title || !rawSlug || !payload.description) {
    throw new Error("Title, slug, and description are required.");
  }

  if (!Number.isFinite(payload.ticket_price_cents)) {
    throw new Error("Ticket price invalid.");
  }

  const normalizeSlug = (value: string) =>
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");

  const baseSlug = normalizeSlug(rawSlug);
  if (!baseSlug) {
    throw new Error("Slug could not be generated. Please provide a valid slug.");
  }

  const supabase = await createSupabaseServerClient();
  let finalSlug = baseSlug;
  let suffix = 1;

  while (true) {
    const { count, error: slugError } = await supabase
      .from("raffles")
      .select("id", { count: "exact", head: true })
      .eq("slug", finalSlug)
      .neq("id", raffleId);

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
    .from("raffles")
    .update({
      ...payload,
      slug: finalSlug,
      image_url: payload.image_urls[0] ?? null,
    })
    .eq("id", raffleId);

  if (error) {
    throw new Error(error.message);
  }

  const slug = finalSlug;
  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/winners");
  if (slug) {
    revalidatePath(`/raffles/${slug}`);
  }
}

async function updateWinnerAction(formData: FormData) {
  "use server";

  const key = formData.get("adminKey")?.toString();
  if (!ADMIN_KEY || key !== ADMIN_KEY) {
    throw new Error("Unauthorized");
  }

  const raffleId = formData.get("raffleId")?.toString();
  if (!raffleId) {
    throw new Error("Missing raffle id");
  }

  const winnerEmail = formData.get("winner_email")?.toString().trim() || null;
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("raffles")
    .update({ winner_email: winnerEmail })
    .eq("id", raffleId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/admin");
  revalidatePath("/winners");
}

async function setWinnerFromEntryAction(formData: FormData) {
  "use server";

  const key = formData.get("adminKey")?.toString();
  if (!ADMIN_KEY || key !== ADMIN_KEY) {
    throw new Error("Unauthorized");
  }

  const raffleId = formData.get("raffleId")?.toString();
  const email = formData.get("email")?.toString();

  if (!raffleId || !email) {
    throw new Error("Missing data");
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("raffles")
    .update({ winner_email: email })
    .eq("id", raffleId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/admin");
  revalidatePath("/winners");
}

async function addManualEntryAction(formData: FormData) {
  "use server";

  const key = formData.get("adminKey")?.toString();
  if (!ADMIN_KEY || key !== ADMIN_KEY) {
    throw new Error("Unauthorized");
  }

  const raffleId = formData.get("raffleId")?.toString();
  const raffleSlug = formData.get("raffleSlug")?.toString();
  const email = formData.get("email")?.toString().trim().toLowerCase();
  const ticketCountValue = formData.get("ticket_count")?.toString();
  const ticketCount = ticketCountValue ? Number(ticketCountValue) : NaN;

  if (!raffleId || !email || !Number.isFinite(ticketCount) || ticketCount < 1) {
    throw new Error("Email and ticket count are required.");
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("entries").insert({
    raffle_id: raffleId,
    email,
    ticket_count: ticketCount,
    stripe_session_id: `manual-${Date.now()}`,
    stripe_customer_id: null,
    stripe_payment_intent_id: null,
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/admin");
  if (raffleSlug) {
    revalidatePath(`/raffles/${raffleSlug}`);
  }
}

async function removeEntryAction(formData: FormData) {
  "use server";

  const key = formData.get("adminKey")?.toString();
  if (!ADMIN_KEY || key !== ADMIN_KEY) {
    throw new Error("Unauthorized");
  }

  const entryId = formData.get("entryId")?.toString();
  const raffleSlug = formData.get("raffleSlug")?.toString();

  if (!entryId) {
    throw new Error("Missing entry id");
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("entries").delete().eq("id", entryId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/admin");
  if (raffleSlug) {
    revalidatePath(`/raffles/${raffleSlug}`);
  }
}

export default async function ManageRafflePage({
  params,
  searchParams,
}: PageProps) {
  const { id } = await params;
  const sp = await searchParams;
  const providedKey =
    typeof sp?.key === "string" ? sp.key : undefined;

  if (!ADMIN_KEY || providedKey !== ADMIN_KEY) {
    return (
      <section className="flex min-h-[50vh] items-center justify-center text-sm uppercase tracking-[0.4em] text-muted">
        Unauthorized
      </section>
    );
  }

  const supabase = await createSupabaseServerClient();

  const { data: raffle, error } = await supabase
    .from("raffles")
    .select(
      "id,title,slug,description,image_url,image_urls,ticket_price_cents,max_tickets,closes_at,status,winner_email,sort_priority"
    )
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("[admin-raffle] Failed to fetch raffle:", error.message);
  }

  if (!raffle) {
    notFound();
  }

  const { data: entries } = await supabase
    .from("entries")
    .select("id,email,ticket_count,created_at,stripe_session_id")
    .eq("raffle_id", id)
    .order("created_at", { ascending: false });

  return (
    <section className="space-y-10 py-16">
      <div className="flex flex-col gap-2">
        <Link
          href={`/admin?key=${providedKey}`}
          className="text-xs uppercase tracking-[0.3em] text-muted underline-offset-4 hover:underline"
        >
          ← Back to admin
        </Link>
        <h1 className="text-3xl font-light tracking-widest text-foreground">
          Edit “{raffle.title}”
        </h1>
        <p className="text-sm uppercase tracking-[0.3em] text-muted">
          Status — {raffle.status.toUpperCase()}
        </p>
      </div>

      <form
        action={updateRaffleAction}
        className="space-y-6 rounded-3xl border border-white/10 bg-white/5 p-8"
      >
        <input type="hidden" name="adminKey" value={providedKey} />
        <input type="hidden" name="raffleId" value={raffle.id} />
        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-2 text-sm">
            <span className="text-muted uppercase tracking-[0.3em]">
              Title
            </span>
            <input
              name="title"
              defaultValue={raffle.title}
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
              defaultValue={raffle.slug}
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
            defaultValue={raffle.description}
            rows={4}
            required
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
            initialUrls={
              raffle.image_urls && raffle.image_urls.length > 0
                ? raffle.image_urls
                : raffle.image_url
                ? [raffle.image_url]
                : []
            }
          />
        </div>
        <label className="space-y-2 text-sm">
            <span className="text-muted uppercase tracking-[0.3em]">
              Status
            </span>
            <select
              name="status"
              defaultValue={raffle.status}
              className="w-full rounded-2xl border border-white/15 bg-transparent px-4 py-3 text-foreground focus:border-accent focus:outline-none"
            >
              <option value="draft">Draft</option>
              <option value="active">Active</option>
              <option value="closed">Closed</option>
            </select>
          </label>

        <div className="grid gap-4 md:grid-cols-3">
          <label className="space-y-2 text-sm">
            <span className="text-muted uppercase tracking-[0.3em]">
              Ticket price (pence)
            </span>
            <input
              type="number"
              min={100}
              name="ticket_price_cents"
              defaultValue={raffle.ticket_price_cents ?? 0}
              required
              className="w-full rounded-2xl border border-white/15 bg-transparent px-4 py-3 text-foreground focus:border-accent focus:outline-none"
            />
          </label>
          <label className="space-y-2 text-sm">
            <span className="text-muted uppercase tracking-[0.3em]">
              Max tickets
            </span>
            <input
              type="number"
              min={1}
              name="max_tickets"
              defaultValue={raffle.max_tickets ?? ""}
              className="w-full rounded-2xl border border-white/15 bg-transparent px-4 py-3 text-foreground focus:border-accent focus:outline-none"
            />
          </label>
          <label className="space-y-2 text-sm">
            <span className="text-muted uppercase tracking-[0.3em]">
              Closes at
            </span>
            <input
              type="datetime-local"
              name="closes_at"
              defaultValue={formatDateTime(raffle.closes_at)}
              className="w-full rounded-2xl border border-white/15 bg-transparent px-4 py-3 text-foreground focus:border-accent focus:outline-none"
            />
          </label>
                  <label className="space-y-2 text-sm">
                    <span className="text-muted uppercase tracking-[0.3em]">
                      Display priority
                    </span>
                    <input
                      type="number"
                      name="sort_priority"
                      defaultValue={raffle.sort_priority ?? ""}
                      className="w-full rounded-2xl border border-white/15 bg-transparent px-4 py-3 text-foreground focus:border-accent focus:outline-none"
                    />
                  </label>
        </div>

        <button
          type="submit"
          className="inline-flex items-center justify-center rounded-full bg-accent px-8 py-3 text-sm font-semibold uppercase tracking-[0.3em] text-background transition hover:opacity-90"
        >
          Save changes
        </button>
      </form>

      <form
        action={updateWinnerAction}
        className="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-8"
      >
        <input type="hidden" name="adminKey" value={providedKey} />
        <input type="hidden" name="raffleId" value={raffle.id} />
        <p className="text-sm uppercase tracking-[0.4em] text-muted">
          Winner email
        </p>
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <input
            name="winner_email"
            type="email"
            defaultValue={raffle.winner_email ?? ""}
            placeholder="leave blank to clear"
            className="flex-1 rounded-2xl border border-white/15 bg-transparent px-4 py-3 text-foreground focus:border-accent focus:outline-none"
          />
          <button
            type="submit"
            className="rounded-full border border-white/20 px-6 py-3 text-xs uppercase tracking-[0.3em] text-foreground transition hover:border-white/40"
          >
            Save winner
          </button>
        </div>
      </form>

      <div className="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-8">
        <div>
          <p className="text-sm uppercase tracking-[0.4em] text-muted">
            Entries ({entries?.length ?? 0})
          </p>
          <p className="text-xs text-foreground/70">
            Click “Set as winner” to assign an entry’s email.
          </p>
        </div>
                <form
                  action={addManualEntryAction}
                  className="grid gap-4 rounded-2xl border border-white/10 bg-white/5 p-4 md:grid-cols-[2fr_1fr_auto]"
                >
                  <input type="hidden" name="adminKey" value={providedKey} />
                  <input type="hidden" name="raffleId" value={raffle.id} />
                  <input type="hidden" name="raffleSlug" value={raffle.slug ?? ""} />
                  <label className="space-y-2 text-sm">
                    <span className="text-muted uppercase tracking-[0.3em]">
                      Email
                    </span>
                    <input
                      type="email"
                      name="email"
                      required
                      className="w-full rounded-2xl border border-white/15 bg-transparent px-4 py-3 text-foreground focus:border-accent focus:outline-none"
                    />
                  </label>
                  <label className="space-y-2 text-sm">
                    <span className="text-muted uppercase tracking-[0.3em]">
                      Tickets
                    </span>
                    <input
                      type="number"
                      min={1}
                      name="ticket_count"
                      required
                      className="w-full rounded-2xl border border-white/15 bg-transparent px-4 py-3 text-foreground focus:border-accent focus:outline-none"
                    />
                  </label>
                  <button
                    type="submit"
                    className="self-end rounded-full border border-accent px-6 py-3 text-xs font-semibold uppercase tracking-[0.3em] text-accent transition hover:bg-accent/10"
                  >
                    Add entry
                  </button>
                </form>
        {entries && entries.length > 0 ? (
          <div className="space-y-3">
            {entries.map((entry) => (
              <div
                key={entry.id}
                className="flex flex-col gap-2 rounded-2xl border border-white/10 bg-black/20 p-4 text-sm md:flex-row md:items-center md:justify-between"
              >
                <div>
                  <p className="font-medium text-foreground">
                    {entry.email}
                  </p>
                  <p className="text-xs uppercase tracking-[0.3em] text-muted">
                    {entry.ticket_count} ticket(s) •{" "}
                    {new Date(entry.created_at).toLocaleString("en-GB", {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs text-foreground/60">
                    Session: {entry.stripe_session_id ?? "—"}
                  </span>
                  <form action={setWinnerFromEntryAction}>
                    <input type="hidden" name="adminKey" value={providedKey} />
                    <input type="hidden" name="raffleId" value={raffle.id} />
                    <input type="hidden" name="email" value={entry.email} />
                    <button
                      type="submit"
                      className="rounded-full border border-accent px-4 py-2 text-xs uppercase tracking-[0.3em] text-accent transition hover:bg-accent/10"
                    >
                      Set as winner
                    </button>
                  </form>
                  <form action={removeEntryAction}>
                    <input type="hidden" name="adminKey" value={providedKey} />
                    <input type="hidden" name="entryId" value={entry.id} />
                    <input type="hidden" name="raffleSlug" value={raffle.slug ?? ""} />
                    <button
                      type="submit"
                      className="rounded-full border border-red-400/50 px-4 py-2 text-xs uppercase tracking-[0.3em] text-red-300 transition hover:border-red-400 hover:text-red-200"
                    >
                      Delete
                    </button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="rounded-2xl border border-white/10 p-6 text-center text-xs uppercase tracking-[0.4em] text-muted">
            No entries yet.
          </p>
        )}
      </div>
    </section>
  );
}

