/* eslint-disable @next/next/no-img-element */
type LatestWinnerCardProps = {
  title: string;
  imageUrl?: string | null;
  closesAt?: string | null;
  winnerEmail?: string | null;
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

export default function LatestWinnerCard({
  title,
  imageUrl,
  closesAt,
  winnerEmail,
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
            <img
              src={imageUrl}
              alt={title}
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
        <div className="flex flex-1 flex-col justify-center space-y-2">
          <h3 className="text-xl font-semibold text-white">{title}</h3>
          <p className="text-sm text-white/60">{closedDate}</p>
          <p className="text-base text-white/80">{maskEmail(winnerEmail)}</p>
        </div>
      </div>
    </section>
  );
}

