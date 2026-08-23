"use client";

import { useEffect } from "react";

export default function Error({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-start justify-center px-4 py-16 sm:px-6 lg:px-8">
      <p className="text-sm font-medium tracking-[0.18em] text-sccs-ember uppercase">
        Something broke
      </p>
      <h1 className="mt-3 font-heading text-4xl font-bold text-foreground md:text-5xl">
        We couldn&apos;t load this page
      </h1>
      <p className="mt-4 text-lg leading-[1.6] text-muted-foreground">
        Try again in a moment. If it keeps happening, email{" "}
        <a
          href="mailto:sccs@sccs.swarthmore.edu"
          className="font-medium text-foreground underline decoration-border underline-offset-4 hover:decoration-foreground"
        >
          sccs@sccs.swarthmore.edu
        </a>
        .
      </p>
      <button
        type="button"
        onClick={() => unstable_retry()}
        className="mt-8 inline-flex h-12 items-center justify-center rounded-[3px] bg-sccs-orange px-8 text-base font-semibold text-sccs-ink transition-colors hover:bg-sccs-orange/85"
      >
        Try again
      </button>
    </main>
  );
}
