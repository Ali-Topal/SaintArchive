import Image from "next/image";
type LatestWinnerCardProps = {
  title: string;
  imageUrl?: string | null;
  closesAt?: string | null;
  winnerEmail?: string | null;
  winnerInstagramHandle?: string | null;
  winnerSize?: string | null;
};

const maskEmail = (email: string | null | undefined) => {
  if (!email) return "Winner: TBA";
  const [user, domain] = email.split("@");
  if (!user || !domain) return "Winner: TBA";
  const maskedUser =
    user.length <= 1
      ? `${user}*`
      : `${user[0]}${"*".repeat(Math.max(user.length - 1, 1))}`;
  return `Winner: ${maskedUser}@${domain}`;
};

const formatWinner = (
  handle?: string | null,
  email?: string | null
): string => {
  if (handle) {
    const normalized = handle.startsWith("@") ? handle : `@${handle}`;
    return `Winner: ${normalized}`;
  }
  return maskEmail(email);
};

export default function LatestWinnerCard({
  title,
  imageUrl,
  closesAt,
  winnerEmail,
  winnerInstagramHandle,
  winnerSize,
}: LatestWinnerCardProps) {
  const closedDate = closesAt
    ? `Closed ${new Date(closesAt).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })}`
    : "Closed";

  return (
    <section className="rounded-2xl border border-neutral-800 bg-[#0b0b0b] p-6">
      <p className="text-xs uppercase text-white/60">Latest winner</p>
      <div className="mt-4 flex flex-col gap-4 sm:flex-row">
        <div className="overflow-hidden rounded-lg border border-neutral-800 sm:w-40">
          {imageUrl ? (
            <div className="relative aspect-square w-full">
              <Image
                src={imageUrl}
                alt={title}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 100vw, 160px"
              />
            </div>
          ) : (
            <div
              className="flex items-center justify-center text-white/60"
              style={{ aspectRatio: "1 / 1" }}
            >
              Image pending
            </div>
          )}
        </div>
        <div className="flex flex-1 flex-col justify-center space-y-2">
          <h3 className="text-xl font-semibold text-white">{title}</h3>
          <p className="text-sm text-white/60">{closedDate}</p>
          <p className="text-base text-white/80">
            {formatWinner(winnerInstagramHandle, winnerEmail)}
          </p>
          {winnerSize && (
            <p className="text-sm text-white/70">Size: {winnerSize}</p>
          )}
        </div>
      </div>
    </section>
  );
}

