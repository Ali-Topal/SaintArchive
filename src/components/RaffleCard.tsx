/* eslint-disable @next/next/no-img-element */
type RaffleCardProps = {
  title: string;
  imageUrl?: string | null;
  closesAt?: string | null;
  winnerEmail?: string | null;
  winnerInstagramHandle?: string | null;
};

const maskEmail = (email: string | null | undefined) => {
  if (!email) return "TBA";
  const [user, domain] = email.split("@");
  if (!user || !domain) return email;
  const maskedUser =
    user.length <= 1 ? `${user}*` : `${user[0]}${"*".repeat(Math.max(user.length - 1, 1))}`;
  return `${maskedUser}@${domain}`;
};

const formatWinner = (
  handle?: string | null,
  email?: string | null
): string => {
  if (handle) {
    return handle.startsWith("@") ? handle : `@${handle}`;
  }
  return maskEmail(email);
};

export default function RaffleCard({
  title,
  imageUrl,
  closesAt,
  winnerEmail,
  winnerInstagramHandle,
}: RaffleCardProps) {
  const hasWinner = Boolean(winnerEmail || winnerInstagramHandle);
  const closesDisplay =
    closesAt && !Number.isNaN(new Date(closesAt).valueOf())
      ? new Date(closesAt).toLocaleDateString("en-GB", {
          day: "numeric",
          month: "short",
          year: "numeric",
        })
      : "TBA";

  return (
    <article className="flex flex-col overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-xl shadow-black/30">
      <div className="relative h-48 w-full overflow-hidden border-b border-white/10">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={title}
            className="h-full w-full object-cover transition-transform duration-700 hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-linear-to-br from-[#1b160e] to-[#050505] text-accent">
            Image pending
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-3 p-5">
        <h3 className="text-lg font-semibold tracking-widest text-foreground">
          {title}
        </h3>
        <p className="text-xs uppercase tracking-[0.4em] text-muted">
          Closed {closesDisplay}
        </p>
        <div className="mt-auto rounded-2xl border border-white/5 bg-white/5 p-4 text-sm">
          <p className="text-muted uppercase tracking-[0.3em]">Winner</p>
          <p className="text-base text-foreground">
            {hasWinner ? formatWinner(winnerInstagramHandle, winnerEmail) : "TBA"}
          </p>
        </div>
      </div>
    </article>
  );
}

