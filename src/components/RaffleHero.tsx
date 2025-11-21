import Link from "next/link";
import CountdownTimer from "./CountdownTimer";
import RaffleImageCarousel from "./RaffleImageCarousel";
import EnterDrawTrigger from "./EnterDrawTrigger";

type RaffleHeroProps = {
  raffleId: string;
  title: string;
  color?: string | null;
  description: string;
  imageUrl?: string;
  imageUrls?: string[] | null;
  ticketPriceCents: number;
  closesAt?: string;
  entriesCount: number;
  enterEnabled?: boolean;
  detailHref?: string;
  maxEntriesPerUser?: number | null;
};

const priceFormatter = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP",
});

export default function RaffleHero({
  raffleId,
  title,
  color,
  description,
  imageUrl,
  imageUrls,
  ticketPriceCents,
  closesAt,
  entriesCount,
  enterEnabled = true,
  detailHref,
  maxEntriesPerUser,
}: RaffleHeroProps) {
  const formattedPrice = priceFormatter.format(ticketPriceCents / 100);
  const displayImages =
    imageUrls && imageUrls.length > 0
      ? imageUrls
      : imageUrl
        ? [imageUrl]
        : [];
  const closesDate = closesAt ? new Date(closesAt) : null;
  const closesDisplay =
    closesDate && !Number.isNaN(closesDate.valueOf())
      ? closesDate.toLocaleString("en-GB", {
          weekday: "short",
          day: "numeric",
          month: "short",
          hour: "2-digit",
          minute: "2-digit",
        })
      : "TBA";
  const showCarouselControls = !detailHref;

  const gridContent = (
    <div className="grid gap-8 lg:grid-cols-2 lg:gap-10">
      <div className="order-2 flex flex-col gap-6 lg:order-1">
        <div className="space-y-2">
          <div>
            <h1 className="text-3xl font-semibold text-white">{title}</h1>
            {color && (
              <p className="text-sm uppercase tracking-[0.3em] text-white/60">
                {color}
              </p>
            )}
          </div>
          <p className="text-base text-white/80">{description}</p>
        </div>

        <div className="grid gap-4 text-sm sm:grid-cols-2">
          <div className="rounded-xl border border-neutral-800 p-4">
            <p className="text-xs uppercase text-white/60">Ticket price</p>
            <p className="text-2xl font-semibold text-white">{formattedPrice}</p>
          </div>
          <div className="rounded-xl border border-neutral-800 p-4">
            <p className="text-xs uppercase text-white/60">Entries</p>
            <p className="text-2xl font-semibold text-white">
              {entriesCount.toLocaleString("en-GB")}
            </p>
          </div>
          <div className="sm:col-span-2 rounded-xl border border-neutral-800 p-4">
            <p className="text-xs uppercase text-white/60">Countdown</p>
            {closesAt ? (
              <CountdownTimer
                targetDate={closesAt}
                className="text-xl font-semibold text-white"
              />
            ) : (
              <p className="text-xl font-semibold text-white">
                Countdown coming soon — closes {closesDisplay}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="order-1 overflow-hidden rounded-xl border border-neutral-800 lg:order-2">
        {displayImages.length > 0 ? (
          <RaffleImageCarousel
            images={displayImages}
            title={title}
            showControls={showCarouselControls}
          />
        ) : (
          <div className="flex aspect-square w-full items-center justify-center rounded-xl bg-black/30 text-white/70">
            Image coming soon
          </div>
        )}
      </div>
    </div>
  );

  return (
    <section className="group rounded-2xl border border-neutral-800 bg-[#0b0b0b] px-6 py-8 transition duration-200 hover:border-white">
      {detailHref ? (
        <Link
          href={detailHref}
          className="block focus:outline-none focus:ring-2 focus:ring-white/30"
        >
          {gridContent}
        </Link>
      ) : (
        gridContent
      )}
      <div className="mt-6 flex flex-col gap-3">
        {detailHref && (
          <Link
            href={detailHref}
            className="inline-flex w-full items-center justify-center rounded-full border border-white/40 px-6 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white transition hover:border-white"
          >
            View details
          </Link>
        )}

        {enterEnabled ? (
          <EnterDrawTrigger
            raffleId={raffleId}
            title={title}
            ticketPriceCents={ticketPriceCents}
            maxEntriesPerUser={maxEntriesPerUser}
            buttonLabel="Enter draw"
            buttonClassName="inline-flex w-full items-center justify-center rounded-full border border-white/30 bg-white px-6 py-3 text-xs font-semibold uppercase tracking-[0.3em] text-black transition hover:opacity-90"
          />
        ) : (
          <div className="inline-flex w-full items-center justify-center rounded-full border border-white/20 px-6 py-2 text-xs uppercase tracking-[0.2em] text-white/70">
            Entries closed
          </div>
        )}
      </div>
    </section>
  );
}

