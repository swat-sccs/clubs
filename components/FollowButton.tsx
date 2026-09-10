"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Heart } from "lucide-react";
import { setClubFollow } from "@/app/feed/actions";
import { cn } from "@/lib/utils";

export default function FollowButton({
  clubId,
  initialFollowing,
  isAuthenticated,
  nextPath,
  compact = false,
  onChange,
}: {
  clubId: string;
  initialFollowing: boolean;
  isAuthenticated: boolean;
  nextPath: string;
  compact?: boolean;
  onChange?: (following: boolean) => void;
}) {
  const router = useRouter();
  const [following, setFollowing] = useState(initialFollowing);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const className = cn(
    "inline-flex shrink-0 items-center justify-center rounded-xl border transition-colors",
    compact ? "size-8" : "size-10",
    following
      ? "border-sccs/25 bg-sccs/8 text-sccs hover:bg-sccs/14"
      : "border-border bg-card text-foreground hover:bg-muted",
  );

  if (!isAuthenticated) {
    return (
      <Link
        href={`/login?next=${encodeURIComponent(nextPath)}`}
        className={className}
        title="Sign in to follow this club"
        aria-label="Sign in to follow this club"
      >
        <Heart className={cn(compact ? "size-3.5" : "size-4")} />
      </Link>
    );
  }

  return (
    <div className="shrink-0">
      <button
        type="button"
        disabled={pending}
        aria-pressed={following}
        aria-label={following ? "Unfollow club" : "Follow club"}
        title={following ? "Unfollow club" : "Follow club"}
        className={cn(className, "disabled:cursor-wait disabled:opacity-65")}
        onClick={() => {
          const nextFollowing = !following;
          setError(null);
          startTransition(async () => {
            const result = await setClubFollow(clubId, nextFollowing);
            if (result.requiresAuth) {
              router.push(`/login?next=${encodeURIComponent(nextPath)}`);
              return;
            }
            if (result.error) {
              setError(result.error);
              return;
            }
            setFollowing(result.following);
            onChange?.(result.following);
          });
        }}
      >
        <Heart
          className={cn(
            compact ? "size-3.5" : "size-4",
            following && "fill-current",
          )}
        />
      </button>
      {error && (
        <p role="alert" className="mt-1 max-w-40 text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
