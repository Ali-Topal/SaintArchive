import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import ImageUploaderList from "@/components/ImageUploaderField";
import OptionsInput from "@/components/OptionsInput";
import Toast from "@/components/Toast";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

type SupabaseServiceClient = ReturnType<typeof supabaseAdmin>;

async function syncPrimaryWinner(client: SupabaseServiceClient, raffleId: string) {
  const { data: primary } = await client
    .from("raffle_winners")
    .select("email,instagram_handle")
    .eq("raffle_id", raffleId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  const { error } = await client
    .from("raffles")
    .update({
      winner_email: primary?.email ?? null,
      winner_instagram_handle: primary?.instagram_handle ?? null,
    })
    .eq("id", raffleId);

  if (error) {
    throw new Error(error.message);
  }
}

type PageProps = {
  params: Promise<{ id: string }>;
};

const formatDateTime = (value: string | null) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) return "";
  return date.toISOString().slice(0, 16);
};

async function updateRaffleAction(formData: FormData) {
  "use server";

  const raffleId = formData.get("raffleId")?.toString();
  if (!raffleId) {
    throw new Error("Missing raffle id");
  }

  const rawSlug = formData.get("slug")?.toString().trim() ?? "";
  const sortPriorityRaw = formData.get("sort_priority")?.toString().trim();
  const sortPriority =
    sortPriorityRaw && sortPriorityRaw.length > 0 ? Number(sortPriorityRaw) : null;

  const maxEntriesPerUser = Number(formData.get("max_entries_per_user"));

  const payload = {
    title: formData.get("title")?.toString().trim() ?? "",
    brand: formData.get("brand")?.toString().trim() ?? "",
    color: formData.get("color")?.toString().trim() ?? "",
    options: formData
      .getAll("options")
      .map((value) => value?.toString().trim() ?? "")
      .filter((value): value is string => value.length > 0),
    description: formData.get("description")?.toString().trim() ?? "",
    image_urls: formData
      .getAll("image_urls")
      .map((value) => value?.toString().trim() ?? "")
      .filter((value): value is string => value.length > 0),
    ticket_price_cents: Number(formData.get("ticket_price_cents")),
    max_entries_per_user: maxEntriesPerUser,
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

  if (
    !Number.isFinite(payload.ticket_price_cents) ||
    !Number.isFinite(payload.max_entries_per_user)
  ) {
    throw new Error("Ticket price invalid.");
  }

  if ((payload.max_entries_per_user ?? 0) < 1) {
    throw new Error("Max entries per user must be at least 1.");
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

  const supabase = supabaseAdmin();
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
      brand: payload.brand || null,
      color: payload.color || null,
      options: payload.options ?? [],
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
  const cookieStore = await cookies();
  cookieStore.set({
    name: "admin-toast",
    value: "saved",
    path: `/admin/raffles/${raffleId}`,
    maxAge: 10,
  });
  redirect(`/admin/raffles/${raffleId}`);
}

async function addWinnerAction(formData: FormData) {
  "use server";

  const raffleId = formData.get("raffleId")?.toString();
  const raffleSlug = formData.get("raffleSlug")?.toString();
  if (!raffleId) {
    throw new Error("Missing raffle id");
  }

  const winnerEmail = formData.get("winner_email")?.toString().trim();
  const winnerInstagramHandle =
    formData.get("winner_instagram_handle")?.toString().trim() || null;
  const selectedSize = formData.get("size")?.toString().trim() || "";
  const customSize = formData.get("custom_size")?.toString().trim() || "";
  const sizeValue = customSize || selectedSize || null;

  if (!winnerEmail) {
    throw new Error("Winner email is required.");
  }

  const supabase = supabaseAdmin();
  const { error } = await supabase.from("raffle_winners").insert({
    raffle_id: raffleId,
    email: winnerEmail,
    instagram_handle: winnerInstagramHandle,
    size: sizeValue,
  });

  if (error) {
    throw new Error(error.message);
  }

  await syncPrimaryWinner(supabase, raffleId);

  revalidatePath("/admin");
  revalidatePath("/winners");
  if (raffleSlug) {
    revalidatePath(`/raffles/${raffleSlug}`);
  }
}

async function removeWinnerAction(formData: FormData) {
  "use server";

  const winnerId = formData.get("winnerId")?.toString();
  const raffleId = formData.get("raffleId")?.toString();
  const raffleSlug = formData.get("raffleSlug")?.toString();

  if (!winnerId || !raffleId) {
    throw new Error("Missing data");
  }

  const supabase = supabaseAdmin();
  const { error } = await supabase.from("raffle_winners").delete().eq("id", winnerId);

  if (error) {
    throw new Error(error.message);
  }

  await syncPrimaryWinner(supabase, raffleId);
  revalidatePath("/admin");
  revalidatePath("/winners");
  if (raffleSlug) {
    revalidatePath(`/raffles/${raffleSlug}`);
  }
}

async function setWinnerFromEntryAction(formData: FormData) {
  "use server";

  const raffleId = formData.get("raffleId")?.toString();
  const entryId = formData.get("entryId")?.toString();
  const raffleSlug = formData.get("raffleSlug")?.toString();
  const requestedSize = formData.get("size")?.toString().trim() || "";

  if (!raffleId || !entryId) {
    throw new Error("Missing data");
  }

  const supabase = supabaseAdmin();

  const { data: entry, error: entryError } = await supabase
    .from("entries")
    .select("email,instagram_handle,size")
    .eq("id", entryId)
    .maybeSingle();

  if (entryError || !entry) {
    throw new Error(entryError?.message ?? "Entry not found.");
  }

  const finalSize = requestedSize || entry.size || null;

  const { error } = await supabase.from("raffle_winners").insert({
    raffle_id: raffleId,
    entry_id: entryId,
    email: entry.email,
    instagram_handle: entry.instagram_handle ?? null,
    size: finalSize,
  });

  if (error) {
    throw new Error(error.message);
  }

  await syncPrimaryWinner(supabase, raffleId);

  revalidatePath("/admin");
  revalidatePath("/winners");
  if (raffleSlug) {
    revalidatePath(`/raffles/${raffleSlug}`);
  }
}

async function addManualEntryAction(formData: FormData) {
  "use server";

  const raffleId = formData.get("raffleId")?.toString();
  const raffleSlug = formData.get("raffleSlug")?.toString();
  const email = formData.get("email")?.toString().trim().toLowerCase();
  const instagramHandle = formData.get("instagram_handle")?.toString().trim();
  const ticketCountValue = formData.get("ticket_count")?.toString();
  const ticketCount = ticketCountValue ? Number(ticketCountValue) : NaN;

  if (
    !raffleId ||
    !email ||
    !Number.isFinite(ticketCount) ||
    ticketCount < 1 ||
    !instagramHandle
  ) {
    throw new Error("Email, Instagram handle, and ticket count are required.");
  }

  const supabase = supabaseAdmin();
  const { error } = await supabase.from("entries").insert({
    raffle_id: raffleId,
    email,
    ticket_count: ticketCount,
    instagram_handle: instagramHandle,
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

async function generateRandomEntriesAction(formData: FormData) {
  "use server";

  const raffleId = formData.get("raffleId")?.toString();
  const raffleSlug = formData.get("raffleSlug")?.toString();
  const countRaw = formData.get("entry_count")?.toString();
  const count = countRaw ? Number(countRaw) : NaN;

  if (!raffleId || !Number.isFinite(count) || count < 1 || count > 1000) {
    throw new Error("Enter a valid amount (1-1000).");
  }

  const supabase = supabaseAdmin();
  const now = Date.now();
  const entriesPayload = Array.from({ length: count }).map((_, idx) => {
    const unique = `${now}-${idx}-${Math.floor(Math.random() * 1_000_000)}`;
    return {
      raffle_id: raffleId,
      email: `auto-${unique}@saintarchive.test`,
      instagram_handle: `auto_${unique}`,
      ticket_count: Math.max(1, Math.floor(Math.random() * 5) + 1),
      stripe_session_id: `auto-${unique}`,
      stripe_customer_id: null,
      stripe_payment_intent_id: null,
    };
  });

  const { error } = await supabase.from("entries").insert(entriesPayload);
  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/admin");
  if (raffleSlug) {
    revalidatePath(`/raffles/${raffleSlug}`);
  }
  const cookieStore = await cookies();
  cookieStore.set({
    name: "admin-toast",
    value: `generated-${count}`,
    path: `/admin/raffles/${raffleId}`,
    maxAge: 10,
  });
  redirect(`/admin/raffles/${raffleId}`);
}

async function removeEntryAction(formData: FormData) {
  "use server";

  const entryId = formData.get("entryId")?.toString();
  const raffleSlug = formData.get("raffleSlug")?.toString();

  if (!entryId) {
    throw new Error("Missing entry id");
  }

  const supabase = supabaseAdmin();
  const { error } = await supabase.from("entries").delete().eq("id", entryId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/admin");
  if (raffleSlug) {
    revalidatePath(`/raffles/${raffleSlug}`);
  }
}

export default async function ManageRafflePage({ params }: PageProps) {
  const { id } = await params;
  const supabase = supabaseAdmin();
  const cookieStore = await cookies();
  const toastCookie = cookieStore.get("admin-toast");
  const toastValue = toastCookie?.value ?? null;
  const showSuccessToast =
    toastValue === "saved" || (toastValue?.startsWith("generated-") ?? false);

  const { data: raffle, error } = await supabase
    .from("raffles")
    .select(
      "id,title,slug,brand,color,options,description,image_url,image_urls,ticket_price_cents,max_entries_per_user,max_tickets,closes_at,status,winner_email,winner_instagram_handle,sort_priority"
    )
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("[admin-raffle] Failed to fetch raffle:", error.message);
  }

  if (!raffle) {
    notFound();
  }

  const {
    data: entries,
  }: {
    data:
      | Array<{
          id: string;
          email: string;
          instagram_handle: string | null;
          ticket_count: number;
          created_at: string;
          stripe_session_id: string | null;
          size: string | null;
        }>
      | null;
  } = await supabase
    .from("entries")
    .select("id,email,instagram_handle,ticket_count,created_at,stripe_session_id,size")
    .eq("raffle_id", id)
    .order("created_at", { ascending: false });

  const {
    data: winners,
  }: {
    data:
      | Array<{
          id: string;
          email: string;
          instagram_handle: string | null;
          size: string | null;
          created_at: string;
        }>
      | null;
  } = await supabase
    .from("raffle_winners")
    .select("id,email,instagram_handle,size,created_at")
    .eq("raffle_id", id)
    .order("created_at", { ascending: false });

  const sizeOptions = raffle.options ?? [];

  return (
    <>
      {showSuccessToast && (
        <Toast
          message={
            toastValue?.startsWith("generated-")
              ? `Generated ${toastValue.split("-")[1]} entries`
              : "Changes saved"
          }
          cookiePath={`/admin/raffles/${raffle.id}`}
        />
      )}
      <section className="space-y-10 py-16">
      <div className="flex flex-col gap-2">
        <Link
          href="/admin"
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

          <label className="space-y-2 text-sm">
            <span className="text-muted uppercase tracking-[0.3em]">
              Brand
            </span>
            <input
              name="brand"
              defaultValue={raffle.brand ?? ""}
              className="w-full rounded-2xl border border-white/15 bg-transparent px-4 py-3 text-foreground focus:border-accent focus:outline-none"
              placeholder="e.g. Supreme"
            />
          </label>

          <label className="space-y-2 text-sm">
            <span className="text-muted uppercase tracking-[0.3em]">
              Colour
            </span>
            <input
              name="color"
              defaultValue={raffle.color ?? ""}
              className="w-full rounded-2xl border border-white/15 bg-transparent px-4 py-3 text-foreground focus:border-accent focus:outline-none"
              placeholder="e.g. Navy / Olive"
            />
          </label>
        </div>

        <OptionsInput
          name="options"
          initialOptions={raffle.options ?? []}
          label="Options"
        />

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
              initialUrls={
                raffle.image_urls && raffle.image_urls.length > 0
                  ? raffle.image_urls
                  : raffle.image_url
                    ? [raffle.image_url]
                    : []
              }
            />
        </div>
          <label className="space-y-2 text-sm block pb-4">
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

        <div className="grid gap-4 md:grid-cols-4">
          <label className="space-y-2 text-sm">
            <span className="text-muted uppercase tracking-[0.3em]">
              Ticket price (pence)
            </span>
            <input
              type="number"
              name="ticket_price_cents"
              defaultValue={raffle.ticket_price_cents ?? 0}
              required
              className="w-full rounded-2xl border border-white/15 bg-transparent px-4 py-3 text-foreground focus:border-accent focus:outline-none"
            />
          </label>
          <label className="space-y-2 text-sm">
            <span className="text-muted uppercase tracking-[0.3em]">
              Max entries p/user
            </span>
            <input
              type="number"
              min={1}
              name="max_entries_per_user"
              defaultValue={raffle.max_entries_per_user ?? 20}
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
          className="inline-flex items-center justify-center rounded-full border border-transparent bg-accent px-8 py-3 text-sm font-semibold uppercase tracking-[0.3em] text-background transition duration-200 hover:border-white/30 hover:shadow-[0_0_20px_rgba(255,255,255,0.15)] active:scale-95"
        >
          Save changes
        </button>
      </form>

      <div className="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-8">
        <p className="text-sm uppercase tracking-[0.4em] text-muted">
          Winners ({winners?.length ?? 0})
        </p>
        <form
          action={addWinnerAction}
          className="grid gap-4 rounded-2xl border border-white/10 bg-white/5 p-4 md:grid-cols-2"
        >
          <input type="hidden" name="raffleId" value={raffle.id} />
          <input type="hidden" name="raffleSlug" value={raffle.slug ?? ""} />
          <label className="space-y-2 text-sm">
            <span className="text-muted uppercase tracking-[0.3em]">
              Email
            </span>
            <input
              name="winner_email"
              type="email"
              required
              className="w-full rounded-2xl border border-white/15 bg-transparent px-4 py-3 text-foreground focus:border-accent focus:outline-none"
            />
          </label>
          <label className="space-y-2 text-sm">
            <span className="text-muted uppercase tracking-[0.3em]">
              Instagram
            </span>
            <input
              name="winner_instagram_handle"
              type="text"
              placeholder="@username"
              className="w-full rounded-2xl border border-white/15 bg-transparent px-4 py-3 text-foreground focus:border-accent focus:outline-none"
            />
          </label>
          <label className="space-y-2 text-sm md:col-span-2">
            <span className="text-muted uppercase tracking-[0.3em]">
              Size won
            </span>
            <div className="grid gap-3 md:grid-cols-2">
              {sizeOptions.length > 0 ? (
                <>
                  <select
                    name="size"
                    defaultValue=""
                    className="w-full rounded-2xl border border-white/15 bg-transparent px-4 py-3 text-foreground focus:border-accent focus:outline-none"
                  >
                    <option value="">Select size (optional)</option>
                    {sizeOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                  <input
                    name="custom_size"
                    placeholder="Or type a custom size"
                    className="w-full rounded-2xl border border-white/15 bg-transparent px-4 py-3 text-foreground focus:border-accent focus:outline-none"
                  />
                </>
              ) : (
                <input
                  name="size"
                  placeholder="Optional size (e.g. UK9)"
                  className="w-full rounded-2xl border border-white/15 bg-transparent px-4 py-3 text-foreground focus:border-accent focus:outline-none"
                />
              )}
            </div>
            <p className="text-xs text-foreground/60">
              Custom size overrides the dropdown selection.
            </p>
          </label>
          <div className="md:col-span-2">
            <button
              type="submit"
              className="rounded-full border border-white/20 px-6 py-3 text-xs uppercase tracking-[0.3em] text-foreground transition hover:border-white/40"
            >
              Add winner
            </button>
          </div>
        </form>

        {winners && winners.length > 0 ? (
          <div className="space-y-3">
            {winners.map((winner) => (
              <div
                key={winner.id}
                className="flex flex-col gap-2 rounded-2xl border border-white/10 bg-black/20 p-4 text-sm md:flex-row md:items-center md:justify-between"
              >
                <div>
                  <p className="font-medium text-foreground">{winner.email}</p>
                  <p className="text-sm text-foreground/70">
                    {winner.instagram_handle
                      ? winner.instagram_handle.startsWith("@")
                        ? winner.instagram_handle
                        : `@${winner.instagram_handle}`
                      : "Handle: —"}
                  </p>
                  {winner.size && (
                    <p className="text-xs uppercase tracking-[0.3em] text-muted">
                      Size: {winner.size}
                    </p>
                  )}
                  <p className="text-xs uppercase tracking-[0.3em] text-muted">
                    Added{" "}
                    {new Date(winner.created_at).toLocaleString("en-GB", {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                <form action={removeWinnerAction} className="flex gap-2">
                  <input type="hidden" name="winnerId" value={winner.id} />
                  <input type="hidden" name="raffleId" value={raffle.id} />
                  <input type="hidden" name="raffleSlug" value={raffle.slug ?? ""} />
                  <button
                    type="submit"
                    className="rounded-full border border-red-400/50 px-4 py-2 text-xs uppercase tracking-[0.3em] text-red-300 transition hover:border-red-400 hover:text-red-200"
                  >
                    Remove
                  </button>
                </form>
              </div>
            ))}
          </div>
        ) : (
          <p className="rounded-2xl border border-white/10 p-6 text-center text-xs uppercase tracking-[0.4em] text-muted">
            No winners yet.
          </p>
        )}
      </div>

      <div className="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-8">
        <div>
          <p className="text-sm uppercase tracking-[0.4em] text-muted">
            Entries ({entries?.length ?? 0})
          </p>
          <p className="text-xs text-foreground/70">
            Click “Set as winner” to assign this entry.
          </p>
        </div>
                <form
                  action={addManualEntryAction}
                  className="grid gap-4 rounded-2xl border border-white/10 bg-white/5 p-4 md:grid-cols-[2fr_1fr_1fr_auto]"
                >
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
                      Instagram
                    </span>
                    <input
                      type="text"
                      name="instagram_handle"
                      placeholder="@username"
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
        <form
          action={generateRandomEntriesAction}
          className="grid gap-4 rounded-2xl border border-white/10 bg-white/5 p-4 md:grid-cols-[2fr_auto]"
        >
          <input type="hidden" name="raffleId" value={raffle.id} />
          <input type="hidden" name="raffleSlug" value={raffle.slug ?? ""} />
          <label className="space-y-2 text-sm">
            <span className="text-muted uppercase tracking-[0.3em]">
              Generate entries
            </span>
            <input
              type="number"
              min={1}
              max={1000}
              name="entry_count"
              defaultValue={50}
              className="w-full rounded-2xl border border-white/15 bg-transparent px-4 py-3 text-foreground focus:border-accent focus:outline-none"
            />
          </label>
          <button
            type="submit"
            className="self-end rounded-full border border-accent px-6 py-3 text-xs font-semibold uppercase tracking-[0.3em] text-accent transition duration-200 hover:bg-accent/10 active:scale-95"
          >
            Generate
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
                      <p className="text-sm text-foreground/70">
                        {entry.instagram_handle
                          ? entry.instagram_handle.startsWith("@")
                            ? entry.instagram_handle
                            : `@${entry.instagram_handle}`
                          : "Handle: —"}
                      </p>
                  {entry.size && (
                    <p className="text-xs uppercase tracking-[0.3em] text-muted">
                      Selected size: {entry.size}
                    </p>
                  )}
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
                  <form
                    action={setWinnerFromEntryAction}
                    className="flex flex-wrap items-center gap-2"
                  >
                    <input type="hidden" name="raffleId" value={raffle.id} />
                    <input type="hidden" name="entryId" value={entry.id} />
                    <input type="hidden" name="raffleSlug" value={raffle.slug ?? ""} />
                    {sizeOptions.length > 0 ? (
                      <select
                        name="size"
                        defaultValue={entry.size ?? ""}
                        className="rounded-full border border-white/15 bg-transparent px-3 py-2 text-xs uppercase tracking-[0.3em] text-foreground focus:border-accent focus:outline-none"
                      >
                        <option value="">Select size</option>
                        {sizeOptions.map((option) => (
                          <option key={`${entry.id}-${option}`} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="hidden"
                        name="size"
                        value={entry.size ?? ""}
                      />
                    )}
                    <button
                      type="submit"
                      className="rounded-full border border-accent px-4 py-2 text-xs uppercase tracking-[0.3em] text-accent transition hover:bg-accent/10"
                    >
                      Set as winner
                    </button>
                  </form>
                  <form action={removeEntryAction}>
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
    </>
  );
}

