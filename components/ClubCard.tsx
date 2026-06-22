import { Bookmark, CheckCircle2, Users, XCircle } from "lucide-react";
import type { Club } from "@/lib/clubs";
import { cn } from "@/lib/utils";

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
    <article className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-6">
      <div className="flex items-start justify-between gap-4">
        <h3 className="font-heading text-xl font-bold text-foreground">
          {club.name}
        </h3>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onToggleBookmark}
            aria-label={isBookmarked ? "Remove bookmark" : "Add bookmark"}
            aria-pressed={isBookmarked}
            className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-border text-muted-foreground transition-colors hover:text-sccs"
          >
            <Bookmark
              className={cn("size-5", isBookmarked && "fill-sccs text-sccs")}
            />
          </button>
          <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-sccs font-heading text-lg font-bold text-white">
            {club.name.charAt(0)}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {club.tags.map((tag) => (
          <span
            key={tag}
            className="rounded-full bg-orange-500/10 px-3 py-1 text-sm font-medium text-orange-600 dark:bg-orange-500/15 dark:text-orange-400"
          >
            {tag}
          </span>
        ))}
      </div>

      <p className="text-base text-muted-foreground">{club.description}</p>

      <div className="mt-auto flex items-center justify-between gap-4 border-t border-border pt-4">
        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Users className="size-4" />
            {club.size}
          </span>
          <span>{club.membershipProcess}</span>
          {club.isAcceptingMembers ? (
            <span className="flex items-center gap-1.5 text-green-600 dark:text-green-400">
              <CheckCircle2 className="size-4" />
              Taking Members
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-red-600 dark:text-red-400">
              <XCircle className="size-4" />
              Not Taking Members
            </span>
          )}
        </div>
      </div>
    </article>
  );
}

export default ClubCard;