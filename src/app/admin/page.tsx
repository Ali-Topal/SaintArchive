import Link from "next/link";
import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabaseClient";

type AdminPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const ADMIN_KEY = process.env.ADMIN_KEY;

const formatDate = (value: string | null) => {
  if (!value) return "TBA";
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) return "TBA";
  return date.toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
};

async function updateRaffleStatus(formData: FormData) {
  "use server";

  const key = formData.get("adminKey")?.toString();
  const raffleId = formData.get("raffleId")?.toString();
  const status = formData.get("status")?.toString();

  if (!ADMIN_KEY || key !== ADMIN_KEY) {
    throw new Error("Unauthorized");
  }

  if (!raffleId || !status) {
    throw new Error("Missing parameters");
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("raffles")
    .update({ status })
    .eq("id", raffleId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/");
  revalidatePath("/winners");
  revalidatePath("/admin");
}

export default async function AdminPage({ searchParams }: AdminPageProps) {
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

  const supabase = await createSupabaseServerClient();
  const { data: raffles, error } = await supabase
    .from("raffles")
    .select("id,title,status,closes_at,slug,sort_priority")
    .order("sort_priority", { ascending: true, nullsFirst: true })
    .order("closes_at", { ascending: true, nullsFirst: true });

  if (error) {
    console.error("[admin] Failed to load raffles:", error.message);
  }

  const items = raffles ?? [];

  return (
    <section className="space-y-10 py-16">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.6em] text-muted">Admin</p>
          <h1 className="text-3xl font-light tracking-widest text-foreground">
            Raffle Control
          </h1>
        </div>
        <Link
          href={`/admin/raffles/new?key=${providedKey}`}
          className="inline-flex items-center justify-center rounded-full border border-accent px-6 py-3 text-xs font-semibold uppercase tracking-[0.3em] text-accent transition hover:bg-accent/10"
        >
          New Raffle
        </Link>
      </div>

      <div className="space-y-4">
        {items.map((raffle) => (
          <div
            key={raffle.id}
            className="rounded-3xl border border-white/10 bg-white/5 p-6 text-sm"
          >
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-lg font-semibold tracking-widest text-foreground">
                  {raffle.title}
                </p>
                <p className="text-xs uppercase tracking-[0.4em] text-muted">
                  Status: {raffle.status} · Priority: {raffle.sort_priority ?? "—"}
                </p>
              </div>
              <div className="flex flex-col gap-2 text-sm text-foreground/80 sm:items-end">
                <p>Closes {formatDate(raffle.closes_at)}</p>
                {raffle.slug && (
                  <Link
                    href={`/raffles/${raffle.slug}`}
                    className="text-xs uppercase tracking-[0.3em] text-accent underline-offset-4 hover:underline"
                  >
                    View public page
                  </Link>
                )}
                <Link
                  href={`/admin/raffles/${raffle.id}?key=${providedKey}`}
                  className="text-xs uppercase tracking-[0.3em] text-foreground underline-offset-4 hover:underline"
                >
                  Manage raffle
                </Link>
              </div>
            </div>

            <form
              action={updateRaffleStatus}
              className="mt-4 flex flex-wrap gap-3"
            >
              <input type="hidden" name="adminKey" value={providedKey} />
              <input type="hidden" name="raffleId" value={raffle.id} />
              {raffle.status !== "draft" && (
                <button
                  type="submit"
                  name="status"
                  value="draft"
                  className="rounded-full border border-white/20 px-4 py-2 text-xs uppercase tracking-[0.3em] text-muted transition hover:border-white/40"
                >
                  Mark Draft
                </button>
              )}
              {raffle.status !== "active" && (
                <button
                  type="submit"
                  name="status"
                  value="active"
                  className="rounded-full border border-accent px-4 py-2 text-xs uppercase tracking-[0.3em] text-accent transition hover:bg-accent/10"
                >
                  Set Active
                </button>
              )}
              {raffle.status !== "closed" && (
                <button
                  type="submit"
                  name="status"
                  value="closed"
                  className="rounded-full border border-white/20 px-4 py-2 text-xs uppercase tracking-[0.3em] text-muted transition hover:border-white/40"
                >
                  Close Raffle
                </button>
              )}
            </form>
          </div>
        ))}

        {items.length === 0 && (
          <p className="rounded-3xl border border-white/10 bg-white/5 p-10 text-center text-xs uppercase tracking-[0.4em] text-muted">
            No raffles yet.
          </p>
        )}
      </div>
    </section>
  );
}

