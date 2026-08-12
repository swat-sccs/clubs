import { Bookmark, CheckCircle2, Users, XCircle } from "lucide-react";
import type { Club } from "@/lib/clubs";
import { cn } from "@/lib/utils";

/* Monogram grounds drawn from the SCCS dusk palette; picked per club so the
   grid feels varied without leaving the brand. */
const MONOGRAM_GRADIENTS = [
  "from-[#31425f] to-[#5a729c]",
  "from-[#1d2b47] to-[#31425f]",
  "from-[#bf5f2c] to-[#e8804a]",
  "from-[#3d5177] to-[#7189b3]",
];

const monogramGradientCache = new Map<string, string>();

function monogramGradient(name: string) {
  const cached = monogramGradientCache.get(name);
  if (cached !== undefined) return cached;
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) | 0;
  }
  const gradient =
    MONOGRAM_GRADIENTS[Math.abs(hash) % MONOGRAM_GRADIENTS.length];
  monogramGradientCache.set(name, gradient);
  return gradient;
}

function ClubCard({
  club,
  isBookmarked,
  onToggleBookmark,
}: {
  club: Club;
  isBookmarked: boolean;
  onToggleBookmark: () => void;
}) {
  return (
    <article className="group flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 transition-all duration-200 hover:-translate-y-1 hover:border-sccs/25 hover:shadow-lg hover:shadow-sccs/8 sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3.5">
          <div
            className={cn(
              "flex size-12 shrink-0 select-none items-center justify-center rounded-xl bg-gradient-to-br font-heading text-lg font-bold text-white shadow-sm",
              monogramGradient(club.name),
            )}
            aria-hidden="true"
          >
            {club.name.charAt(0)}
          </div>
          <h3 className="min-w-0 pt-1 font-heading text-xl font-bold leading-snug text-foreground [text-wrap:balance]">
            {club.name}
          </h3>
        </div>
        <button
          type="button"
          onClick={onToggleBookmark}
          aria-label={isBookmarked ? "Remove bookmark" : "Add bookmark"}
          aria-pressed={isBookmarked}
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-xl border transition-all duration-200 active:scale-90",
            isBookmarked
              ? "border-sccs/30 bg-sccs-orange/15 text-sccs dark:text-sccs-ember"
              : "border-border text-muted-foreground hover:border-sccs/30 hover:bg-sccs-orange/15 hover:text-sccs dark:hover:text-sccs-ember",
          )}
        >
          <Bookmark
            className={cn(
              "size-5 transition-transform duration-200",
              isBookmarked && "animate-bookmark-pop fill-current",
            )}
          />
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {club.tags.map((tag) => (
          <span
            key={tag}
            className="rounded-full bg-sccs/8 px-3 py-1 text-sm font-medium text-sccs dark:bg-sccs-orange/15 dark:text-sccs-orange"
          >
            {tag}
          </span>
        ))}
      </div>

      <p className="leading-7 text-muted-foreground">{club.description}</p>

      <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-border pt-4 text-sm text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <Users className="size-4" />
          {club.size}
        </span>
        <span>{club.membershipProcess}</span>
        {club.isAcceptingMembers ? (
          <span className="flex items-center gap-1.5 rounded-full bg-green-600/10 px-2.5 py-0.5 font-medium text-green-700 dark:bg-green-400/10 dark:text-green-400">
            <CheckCircle2 className="size-4" />
            Taking members
          </span>
        ) : (
          <span className="flex items-center gap-1.5 rounded-full bg-red-600/8 px-2.5 py-0.5 font-medium text-red-700/80 dark:bg-red-400/10 dark:text-red-400">
            <XCircle className="size-4" />
            Not taking members
          </span>
        )}
      </div>
    </article>
  );
}

export default ClubCard;
