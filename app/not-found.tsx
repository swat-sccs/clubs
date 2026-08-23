import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-start justify-center px-4 py-16 sm:px-6 lg:px-8">
      <p className="text-sm font-medium tracking-[0.18em] text-sccs-ember uppercase">
        404
      </p>
      <h1 className="mt-3 font-heading text-4xl font-bold text-foreground md:text-5xl">
        That page isn&apos;t here
      </h1>
      <p className="mt-4 text-lg leading-[1.6] text-muted-foreground">
        The link may be old, or the club may have been renamed. The directory
        is still the best place to look.
      </p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Link
          href="/clubs"
          className="inline-flex h-12 items-center justify-center rounded-[3px] bg-sccs-orange px-8 text-base font-semibold text-sccs-ink transition-colors hover:bg-sccs-orange/85"
        >
          Browse clubs
        </Link>
        <Link
          href="/"
          className="inline-flex h-12 items-center justify-center rounded-[3px] border border-foreground px-8 text-base font-medium text-foreground transition-colors hover:bg-foreground hover:text-background"
        >
          Home
        </Link>
      </div>
    </main>
  );
}
