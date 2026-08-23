import Link from "next/link";
import { Bookmark, CheckCircle2, Users, XCircle } from "lucide-react";
import type { Club } from "@/lib/clubs";
import { cn } from "@/lib/utils";
import ClubMonogram from "@/components/ClubMonogram";

function ClubCard({
  club,
  isBookmarked,
  onToggleBookmark,
}: {
  club: Club;
  isBookmarked?: boolean;
  onToggleBookmark?: () => void;
}) {
  return (
    <article className="group flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 transition-all duration-200 hover:-translate-y-1 hover:border-sccs/25 hover:shadow-lg hover:shadow-sccs/8 sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <Link
          href={`/clubs/${club.slug}`}
          className="flex min-w-0 items-start gap-3.5 rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
        >
          <ClubMonogram name={club.name} className="size-12 text-lg" />
          <h3 className="min-w-0 pt-1 font-heading text-xl font-bold leading-snug text-foreground underline-offset-4 [text-wrap:balance] group-hover:underline">
            {club.name}
          </h3>
        </Link>
        {onToggleBookmark && (
          <button
            type="button"
            onClick={onToggleBookmark}
            aria-label={isBookmarked ? "Remove bookmark" : "Add bookmark"}
            aria-pressed={isBookmarked}
            className={cn(
              "flex size-10 shrink-0 items-center justify-center rounded-xl border transition-all duration-200 active:scale-90",
              isBookmarked
                ? "border-sccs/30 bg-sccs-orange/15 text-sccs dark:text-sccs-ember"
                : "border-border text-muted-foreground hover:border-sccs/30 hover:bg-sccs-orange/15 hover:text-sccs dark:hover:text-sccs-ember"
            )}
          >
            <Bookmark
              className={cn(
                "size-5 transition-transform duration-200",
                isBookmarked && "animate-bookmark-pop fill-current"
              )}
            />
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {club.tags.map((tag) => (
          <Link
            key={tag}
            href={`/clubs?tags=${encodeURIComponent(tag)}`}
            className="rounded-full bg-sccs/8 px-3 py-1 text-sm font-medium text-sccs transition-colors hover:bg-sccs/15 dark:bg-sccs-orange/15 dark:text-sccs-orange dark:hover:bg-sccs-orange/25"
          >
            {tag}
          </Link>
        ))}
      </div>

      <Link
        href={`/clubs/${club.slug}`}
        className="leading-7 text-muted-foreground"
      >
        {club.description}
      </Link>

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
