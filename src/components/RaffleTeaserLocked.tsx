/* eslint-disable @next/next/no-img-element */
type RaffleTeaserLockedProps = {
  title?: string | null;
  imageUrl?: string | null;
  closesAt?: string | null;
};

export default function RaffleTeaserLocked({
  title,
  imageUrl,
  closesAt,
}: RaffleTeaserLockedProps) {
  const revealText = closesAt
    ? `Opens soon • ${new Date(closesAt).toLocaleDateString("en-GB", {
        weekday: "short",
        day: "numeric",
        month: "short",
      })}`
    : "Reveals soon";

  return (
    <section className="rounded-2xl border border-neutral-800 bg-[#0b0b0b] p-6">
      <div className="flex flex-col gap-4 lg:grid lg:grid-cols-2 lg:items-center">
        <div className="space-y-3">
          <p className="text-xs uppercase text-white/60">Next Drop (Locked)</p>
          <h2 className="text-2xl font-semibold text-white">
            {title || "Preparing the next drop"}
          </h2>
          <p className="text-sm text-white/70">{revealText}</p>
          <p className="text-xs text-white/50">
            Follow @luciansaint on Instagram for the reveal.
          </p>
        </div>
        <div className="rounded-xl border border-neutral-800 bg-black/30 p-4 text-center text-white/60">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={title ?? "Locked drop"}
              className="mx-auto w-full rounded-lg object-cover opacity-50"
              style={{ aspectRatio: "1 / 1" }}
            />
          ) : (
            <p>Visual locked</p>
          )}
        </div>
      </div>
    </section>
  );
}

