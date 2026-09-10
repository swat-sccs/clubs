"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { CalendarDays, History, LoaderCircle } from "lucide-react";
import { loadFeedPosts } from "@/app/feed/actions";
import FeedPostCard from "@/components/FeedPostCard";
import type {
  FeedPageResult,
  FeedPeriod,
  FeedPost,
  FeedView,
} from "@/lib/feed";
import { cn } from "@/lib/utils";

export default function FeedList({
  initialPage,
  initialView,
  isAuthenticated,
  anchorDate,
  anchorTime,
}: {
  initialPage: FeedPageResult;
  initialView: FeedView;
  isAuthenticated: boolean;
  anchorDate: string;
  anchorTime: string;
}) {
  const router = useRouter();
  const [posts, setPosts] = useState<FeedPost[]>(initialPage.posts);
  const [view, setView] = useState<FeedView>(initialView);
  const [period, setPeriod] = useState<FeedPeriod>("upcoming");
  const [hasMore, setHasMore] = useState(initialPage.hasMore);
  const [hasOlderPosts, setHasOlderPosts] = useState(
    initialPage.hasOlderPosts,
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const cursorRef = useRef<string | null>(initialPage.nextCursor);
  const loadingRef = useRef(false);
  const requestRef = useRef(0);

  const requestPage = useCallback(
    async (
      nextView: FeedView,
      nextPeriod: FeedPeriod,
      reset: boolean,
      preservePosts = false,
    ) => {
      if (loadingRef.current && !reset) return;
      const requestId = reset ? ++requestRef.current : requestRef.current;
      loadingRef.current = true;
      setLoading(true);
      setError(null);
      const cursor = reset ? null : cursorRef.current;
      if (reset) cursorRef.current = null;

      try {
        const page = await loadFeedPosts(
          nextView,
          nextPeriod,
          cursor,
          anchorDate,
          anchorTime,
        );
        if (requestId !== requestRef.current) return;
        setPosts((current) =>
          reset
            ? preservePosts
              ? [...current, ...page.posts]
              : page.posts
            : [...current, ...page.posts],
        );
        cursorRef.current = page.nextCursor;
        setHasMore(page.hasMore);
        setHasOlderPosts(page.hasOlderPosts);
      } catch {
        if (requestId === requestRef.current) {
          setError("The next posts could not be loaded. Try again.");
        }
      } finally {
        if (requestId === requestRef.current) {
          loadingRef.current = false;
          setLoading(false);
        }
      }
    },
    [anchorDate, anchorTime],
  );

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasMore) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) void requestPage(view, period, false);
      },
      { rootMargin: "600px 0px" },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, period, requestPage, view]);

  const chooseView = (nextView: FeedView) => {
    if (nextView === view || (nextView === "following" && !isAuthenticated)) {
      return;
    }
    setView(nextView);
    setPeriod("upcoming");
    setPosts([]);
    router.replace(nextView === "following" ? "/feed?view=following" : "/feed", {
      scroll: false,
    });
    void requestPage(nextView, "upcoming", true);
  };

  return (
    <>
      <div className="mt-6 flex items-center gap-1 rounded-xl bg-muted p-1 sm:w-fit">
        <button
          type="button"
          aria-pressed={view === "all"}
          onClick={() => chooseView("all")}
          className={cn(
            "h-9 flex-1 rounded-lg px-4 text-sm font-semibold transition-colors sm:flex-none",
            view === "all" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground",
          )}
        >
          All clubs
        </button>
        {isAuthenticated ? (
          <button
            type="button"
            aria-pressed={view === "following"}
            onClick={() => chooseView("following")}
            className={cn(
              "h-9 flex-1 rounded-lg px-4 text-sm font-semibold transition-colors sm:flex-none",
              view === "following"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground",
            )}
          >
            Following
          </button>
        ) : (
          <Link
            href="/login?next=%2Ffeed%3Fview%3Dfollowing"
            className="inline-flex h-9 flex-1 items-center justify-center rounded-lg px-4 text-sm font-semibold text-muted-foreground sm:flex-none"
          >
            Following
          </Link>
        )}
      </div>

      {posts.length === 0 && !loading ? (
        <div className="mt-8 max-w-2xl rounded-2xl border border-dashed border-border bg-card p-8 text-center">
          <CalendarDays className="mx-auto size-8 text-sccs" />
          <h2 className="mt-4 font-heading text-xl font-semibold">
            {view === "following"
              ? "No upcoming followed-club events"
              : "No upcoming events"}
          </h2>
          <p className="mt-2 text-muted-foreground">
            {view === "following"
              ? "New events from clubs you follow will appear here."
              : "Check older posts below, or come back when clubs announce something new."}
          </p>
          {view === "following" && (
            <Link href="/clubs" className="mt-4 inline-block font-semibold text-sccs underline">
              Browse clubs
            </Link>
          )}
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-1 items-stretch gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {posts.map((post) => (
            <FeedPostCard
              key={post.id}
              post={post}
              isAuthenticated={isAuthenticated}
              anchorDate={anchorDate}
              anchorTime={anchorTime}
              onFollowChange={(clubId, following) => {
                if (view === "following" && !following) {
                  setPosts((current) =>
                    current.filter((item) => item.club.id !== clubId),
                  );
                }
              }}
            />
          ))}
        </div>
      )}

      <div ref={sentinelRef} className="flex min-h-20 items-center justify-center py-6">
        {loading && (
          <p role="status" className="flex items-center gap-2 text-sm text-muted-foreground">
            <LoaderCircle className="size-4 animate-spin" /> Loading more posts…
          </p>
        )}
        {!loading && error && (
          <button
            type="button"
            onClick={() => void requestPage(view, period, false)}
            className="text-sm font-semibold text-destructive underline"
          >
            {error}
          </button>
        )}
        {!loading &&
          !error &&
          !hasMore &&
          (posts.length > 0 || hasOlderPosts) && (
          <div className="flex flex-col items-center gap-3">
            <p className="text-sm text-muted-foreground">
              {period === "upcoming"
                ? "You’re all caught up."
                : "You’ve reached the oldest posts."}
            </p>
            {period === "upcoming" && hasOlderPosts && (
              <button
                type="button"
                onClick={() => {
                  setPeriod("past");
                  void requestPage(view, "past", true, true);
                }}
                className="inline-flex h-10 items-center gap-2 rounded-xl border border-border bg-card px-4 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
              >
                <History className="size-4" /> View older posts
              </button>
            )}
          </div>
        )}
      </div>
    </>
  );
}
