import Link from "next/link";
import { Search } from "lucide-react";
import { matchClubs, type ClubMatch } from "@/lib/match";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Match | Swat Clubs",
  description:
    "Describe what you're into and get matched to Swarthmore clubs.",
};

function MatchCard({ match }: { match: ClubMatch }) {
  const { club, score } = match;
  const percent = Math.round(Math.max(0, Math.min(1, score)) * 100);
  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <div className="flex items-baseline justify-between gap-4">
        <h2 className="font-heading text-xl font-semibold text-foreground">
          <Link
            href={`/clubs/${club.slug}`}
            className="underline-offset-4 hover:underline"
          >
            {club.name}
          </Link>
        </h2>
        <span className="shrink-0 text-sm font-semibold text-sccs tabular-nums">
          {percent}% match
        </span>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">{club.affiliation}</p>
      <p className="mt-3 leading-[1.6] text-foreground/80">
        {club.description}
      </p>
      <div className="mt-4 flex flex-wrap gap-1.5">
        {club.tags.map((tag) => (
          <Link
            key={tag}
            href={`/clubs?tags=${encodeURIComponent(tag)}`}
            className="rounded-full bg-sccs/10 px-2.5 py-1 text-sm font-medium text-sccs transition-colors hover:bg-sccs/20"
          >
            {tag}
          </Link>
        ))}
      </div>
    </div>
  );
}

export default async function MatchPage(props: PageProps<"/match">) {
  const searchParams = await props.searchParams;
  const raw = Array.isArray(searchParams.q) ? searchParams.q[0] : searchParams.q;
  const query = raw?.trim().slice(0, 2000) ?? "";

  let matches: ClubMatch[] | null = null;
  let failed = false;
  if (query) {
    try {
      matches = await matchClubs(query);
    } catch (error) {
      console.error("club matching failed:", error);
      failed = true;
    }
  }

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="animate-fade-rise font-heading text-3xl font-bold text-foreground md:text-4xl">
        Find your match
      </h1>
      <p className="mt-2 animate-fade-rise text-lg text-muted-foreground animation-delay-100">
        Say what you&#39;re into, in your own words. We compare it against every
        club&#39;s profile and rank the closest fits.
      </p>

      <form method="get" className="mt-8 animate-fade-rise animation-delay-200">
        <label htmlFor="match-query" className="sr-only">
          Your interests
        </label>
        <textarea
          id="match-query"
          name="q"
          rows={3}
          maxLength={2000}
          required
          defaultValue={query}
          placeholder="I like strategy games, arguing about politics, and I want to try something outdoors..."
          className="w-full rounded-xl border border-border bg-card p-4 text-base text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-sccs/50"
        />
        <button
          type="submit"
          className="mt-3 inline-flex h-12 items-center gap-2 rounded-[3px] bg-sccs-orange px-8 text-base font-semibold text-sccs-ink transition-colors hover:bg-sccs-orange/85"
        >
          <Search className="size-4.5" />
          Match me
        </button>
      </form>

      {failed && (
        <p className="mt-8 rounded-xl border border-dashed border-border bg-card/60 p-6 text-muted-foreground">
          Matching is unavailable right now (the embedding server may be
          waking up). Plain old browsing still works:{" "}
          <Link href="/clubs" className="font-medium text-sccs underline">
            see all clubs
          </Link>
          .
        </p>
      )}

      {matches && matches.length > 0 && (
        <div className="mt-8 flex flex-col gap-4">
          {matches.map((match) => (
            <MatchCard key={match.club.name} match={match} />
          ))}
        </div>
      )}
    </main>
  );
}
