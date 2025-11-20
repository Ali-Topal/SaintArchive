/* eslint-disable @next/next/no-img-element */
type RaffleGridItem = {
  id: string;
  title: string;
  image_url?: string | null;
  closes_at?: string | null;
  slug?: string | null;
};

type RaffleGridProps = {
  items: RaffleGridItem[];
  emptyLabel?: string;
};

const formatClose = (value?: string | null) =>
  value
    ? new Date(value).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "TBA";

export default function RaffleGrid({
  items,
  emptyLabel = "No raffles to show.",
}: RaffleGridProps) {
  if (items.length === 0) {
    return (
      <p className="rounded-xl border border-neutral-800 px-6 py-10 text-center text-xs uppercase tracking-[0.3em] text-white/60">
        {emptyLabel}
      </p>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {items.map((raffle) => (
        <article
          key={raffle.id}
          className="flex flex-col gap-3 rounded-xl border border-neutral-800 bg-[#0b0b0b] p-5"
        >
          <div className="overflow-hidden rounded-lg border border-neutral-800">
            {raffle.image_url ? (
              <img
                src={raffle.image_url}
                alt={raffle.title}
                className="w-full object-cover"
                style={{ aspectRatio: "1 / 1" }}
              />
            ) : (
              <div
                className="flex items-center justify-center text-white/60"
                style={{ aspectRatio: "1 / 1" }}
              >
                Image pending
              </div>
            )}
          </div>
          <div className="space-y-2">
            <p className="text-xs uppercase text-white/60">
              Completed • {formatClose(raffle.closes_at)}
            </p>
            <h3 className="text-lg font-semibold text-white">{raffle.title}</h3>
            <p className="text-xs uppercase text-white/50">Winner picked</p>
          </div>
        </article>
      ))}
    </div>
  );
}

