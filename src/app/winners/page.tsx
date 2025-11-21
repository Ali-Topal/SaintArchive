import RaffleCard from "@/components/RaffleCard";
import { createSupabaseServerClient } from "@/lib/supabaseClient";

type WinnersRaffle = {
  id: string;
  title: string;
  image_url: string | null;
  image_urls: string[] | null;
  closes_at: string | null;
  winner_email: string | null;
  status: string;
};

export const revalidate = 60;

export default async function WinnersPage() {
  const supabase = await createSupabaseServerClient();

  const { data: raffles, error } = await supabase
    .from("raffles")
    .select("id,title,image_url,image_urls,closes_at,winner_email,status")
    .or("winner_email.not.is.null,status.eq.closed")
    .order("closes_at", { ascending: false })
    .returns<WinnersRaffle[]>();

  if (error) {
    console.error("[winners] Failed to load raffles:", error.message);
  }

  const nowDate = new Date();
  const items =
    raffles?.filter((raffle) => {
      if (raffle.status === "closed") {
        return true;
      }
      if (raffle.winner_email && raffle.closes_at) {
        return new Date(raffle.closes_at) <= nowDate;
      }
      return false;
    }) ?? [];

  return (
    <section className="space-y-10 py-16">
      <div className="space-y-3">
        <p className="text-sm uppercase tracking-[0.3em] text-accent">Winners</p>
        <h1 className="text-3xl font-light tracking-widest text-foreground">
          Closed drops & crowned winners
        </h1>
      </div>

      {items.length === 0 ? (
        <div className="rounded-3xl border border-white/10 bg-white/5 p-12 text-center text-sm uppercase tracking-[0.3em] text-muted">
          No raffles have closed yet.
        </div>
      ) : (
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {items.map((raffle) => (
            <RaffleCard
              key={raffle.id}
              title={raffle.title}
              imageUrl={raffle.image_urls?.[0] ?? raffle.image_url}
              closesAt={raffle.closes_at}
              winnerEmail={raffle.winner_email}
            />
          ))}
        </div>
      )}
    </section>
  );
}

