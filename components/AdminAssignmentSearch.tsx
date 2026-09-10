"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

const SEARCH_DEBOUNCE_MS = 300;

export default function AdminAssignmentSearch({
  initialQuery,
}: {
  initialQuery: string;
}) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const [committedQuery, setCommittedQuery] = useState(initialQuery);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const nextQuery = query.trim();
    if (nextQuery === committedQuery) return;

    const timeout = window.setTimeout(() => {
      const params = new URLSearchParams();
      if (nextQuery) params.set("q", nextQuery);
      const search = params.toString();
      setCommittedQuery(nextQuery);
      startTransition(() => {
        router.replace(
          search ? `/admin/assignments?${search}` : "/admin/assignments",
          { scroll: false },
        );
      });
    }, SEARCH_DEBOUNCE_MS);

    return () => window.clearTimeout(timeout);
  }, [committedQuery, query, router]);

  return (
    <div role="search" className="mt-6 max-w-2xl">
      <label htmlFor="assignment-search" className="sr-only">
        Search clubs and assigned users
      </label>
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          id="assignment-search"
          name="q"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search club, user, username, or email"
          autoComplete="off"
          className="h-11 min-w-0 flex-1 rounded-xl border border-input bg-card px-4 text-base outline-none transition-colors placeholder:text-muted-foreground focus:border-ring focus:ring-3 focus:ring-ring/30"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery("")}
            className="h-11 rounded-xl border border-border px-5 font-medium text-foreground hover:bg-muted"
          >
            Clear
          </button>
        )}
      </div>
      <p
        className="mt-2 min-h-5 text-sm text-muted-foreground"
        aria-live="polite"
      >
        {isPending ? "Updating results…" : ""}
      </p>
    </div>
  );
}
