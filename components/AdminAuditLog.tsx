"use client";

import Link from "next/link";
import { LoaderCircle } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { loadAuditLog } from "@/app/admin/activity/actions";
import type { AuditLogEntry, AuditLogPage } from "@/lib/audit-log";

export default function AdminAuditLog({
  initialPage,
}: {
  initialPage: AuditLogPage;
}) {
  const [entries, setEntries] = useState(initialPage.entries);
  const [hasMore, setHasMore] = useState(initialPage.hasMore);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRootRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const cursorRef = useRef(initialPage.nextCursor);
  const loadingRef = useRef(false);

  const requestNextPage = useCallback(async () => {
    const cursor = cursorRef.current;
    if (loadingRef.current || !cursor) return;

    loadingRef.current = true;
    setLoading(true);
    setError(null);
    try {
      const page = await loadAuditLog(cursor);
      setEntries((current) => {
        const existingIds = new Set(current.map((entry) => entry.id));
        return [
          ...current,
          ...page.entries.filter((entry) => !existingIds.has(entry.id)),
        ];
      });
      cursorRef.current = page.nextCursor;
      setHasMore(page.hasMore);
    } catch {
      setError("The next audit entries could not be loaded. Try again.");
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const root = scrollRootRef.current;
    const sentinel = sentinelRef.current;
    if (!root || !sentinel || !hasMore) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) void requestNextPage();
      },
      { root, rootMargin: "300px 0px" },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, requestNextPage]);

  return (
    <div
      ref={scrollRootRef}
      className="mt-6 max-h-[70vh] min-h-80 overflow-y-auto overscroll-contain rounded-2xl border border-border bg-card"
    >
      {entries.length === 0 ? (
        <p className="p-6 text-muted-foreground">No activity recorded yet.</p>
      ) : (
        <ol className="divide-y divide-border">
          {entries.map((entry) => (
            <AuditLogItem key={entry.id} entry={entry} />
          ))}
        </ol>
      )}
      <div
        ref={sentinelRef}
        className="flex min-h-16 items-center justify-center border-t border-border px-4 py-3"
        aria-live="polite"
      >
        {loading && (
          <p role="status" className="flex items-center gap-2 text-sm text-muted-foreground">
            <LoaderCircle className="size-4 animate-spin" /> Loading older activity…
          </p>
        )}
        {!loading && error && (
          <button
            type="button"
            onClick={() => void requestNextPage()}
            className="text-sm font-semibold text-destructive underline"
          >
            {error}
          </button>
        )}
        {!loading && !error && !hasMore && entries.length > 0 && (
          <p className="text-sm text-muted-foreground">You’ve reached the oldest activity.</p>
        )}
      </div>
    </div>
  );
}

function AuditLogItem({ entry }: { entry: AuditLogEntry }) {
  return (
    <li className="p-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-heading font-semibold text-foreground">
            {entry.clubSlug ? (
              <Link href={`/clubs/${entry.clubSlug}`} className="hover:underline">
                {entry.clubName}
              </Link>
            ) : (
              entry.clubName
            )}
          </p>
          <p className="mt-1 text-sm font-semibold tracking-wide text-sccs-ember uppercase">
            {entry.action.replaceAll("_", " ")}
          </p>
        </div>
        <time dateTime={entry.createdAt} className="text-sm text-muted-foreground">
          {entry.createdAtLabel}
        </time>
      </div>
      <p className="mt-3 text-foreground/85">{entry.summary}</p>
      <div className="mt-3 rounded-lg bg-muted/60 px-3 py-2 text-sm">
        <span className="font-semibold text-foreground">Executed by </span>
        <span className="text-foreground/85">{entry.actor ?? "System"}</span>
        {entry.actorEmail && entry.actorEmail !== entry.actor && (
          <span className="text-muted-foreground"> · {entry.actorEmail}</span>
        )}
      </div>
    </li>
  );
}
