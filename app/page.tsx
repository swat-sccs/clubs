import Link from "next/link";
import HeroNetwork from "@/components/HeroNetwork";
import WordRoll from "@/components/WordRoll";
import { CROWD } from "@/components/crowd";
import {
  CLUBS,
  SWARTHMORE_AFFILIATIONS,
  getAcceptingMembersCount,
  getTagCounts,
} from "@/lib/clubs";

const features = [
  {
    title: "Search & filter",
    body: "Slice the directory by tags, councils, size, and membership process until only your kind of clubs remain.",
  },
  {
    title: "Bookmark favorites",
    body: "Save the clubs you're curious about and come back to your shortlist any time. It stays with you.",
  },
  {
    title: "Fresh all year",
    body: "Clubs keep their pages current, so discovery doesn't end when the Activities Fair tables fold up.",
  },
];

function SectionLabel({ label }: { label: string }) {
  return (
    <div className="rule-double pt-4">
      <span className="text-[0.8rem] font-semibold tracking-[0.18em] text-foreground uppercase">
        {label}
      </span>
    </div>
  );
}

export default function Home() {
  const acceptingCount = getAcceptingMembersCount();
  const tagCounts = getTagCounts();
  const tagIndex = Array.from(tagCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 14);
  const crowdNodes = CROWD.map(({ label, tag }) => ({
    label,
    tag,
    count: tagCounts.get(tag) ?? 0,
  })).filter(({ count }) => count > 0);

  return (
    <main className="flex flex-1 flex-col">
      {/* ---------- Hero ---------- */}
      <section className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-x-16 gap-y-14 px-4 pb-16 pt-10 sm:px-6 md:pb-24 md:pt-16 lg:grid-cols-[1fr_24rem] lg:px-8">
        <div className="max-w-[46rem]">
          <p className="animate-fade-rise text-[0.8rem] font-semibold tracking-[0.18em] text-foreground uppercase">
            Swarthmore College · {CLUBS.length} student organizations
          </p>

          <h1 className="display-wonk mt-6 animate-fade-rise font-heading text-[clamp(4rem,9vw,8rem)] font-semibold leading-[0.95] tracking-[-0.02em] text-foreground animation-delay-100">
            Find your <em>people</em>.
          </h1>

          <p className="mt-8 max-w-xl animate-fade-rise text-lg leading-[1.6] text-foreground/80 animation-delay-200">
            Every club, team, publication, and society on campus: searchable,
            filterable, and bookmarkable. The Activities Fair, open all year.
          </p>

          <p className="mt-8 flex max-w-xl animate-fade-rise flex-wrap gap-x-3 gap-y-1 border-y border-border py-2.5 text-[0.85rem] font-medium tracking-[0.14em] text-muted-foreground uppercase animation-delay-300 tabular-nums">
            <span>{CLUBS.length} clubs</span>
            <span aria-hidden="true">·</span>
            <span>{SWARTHMORE_AFFILIATIONS.length} councils</span>
            <span aria-hidden="true">·</span>
            <span>{acceptingCount} taking members</span>
          </p>

          <div className="mt-9 flex animate-fade-rise flex-col gap-3 animation-delay-300 sm:flex-row sm:items-center">
            <Link
              href="/clubs"
              className="inline-flex h-12 items-center justify-center rounded-[3px] bg-sccs-orange px-8 text-base font-semibold text-sccs-ink transition-colors hover:bg-sccs-orange/85 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
            >
              Browse all clubs
            </Link>
            <Link
              href="/faq"
              className="inline-flex h-12 items-center justify-center rounded-[3px] border border-foreground px-8 text-base font-medium text-foreground transition-colors hover:bg-foreground hover:text-background focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
            >
              How it works
            </Link>
          </div>
        </div>

        {/* The campus web, breathing */}
        <aside className="animate-fade-rise animation-delay-300 lg:self-center">
          <figure>
            <HeroNetwork
              nodes={crowdNodes}
              className="h-80 w-full touch-none sm:h-96 lg:h-[26rem]"
            />
            <figcaption className="mt-2 text-center font-heading text-lg italic text-foreground/75">
              Somewhere in here, your people.
            </figcaption>
          </figure>
        </aside>
      </section>

      {/* ---------- Index of interests ---------- */}
      <section className="mx-auto w-full max-w-7xl px-4 pb-16 sm:px-6 md:pb-24 lg:px-8">
        <SectionLabel label="Index of interests" />
        <div className="mt-8 grid grid-cols-1 gap-x-16 gap-y-8 lg:grid-cols-[minmax(0,24rem)_1fr]">
          <div>
            <h2 className="font-heading text-3xl font-semibold text-foreground md:text-4xl [text-wrap:balance]">
              Browse by interest
            </h2>
            <p className="mt-4 leading-[1.6] text-foreground/75">
              Every club is tagged by what it does. Start with the world you
              already love.
            </p>
          </div>
          <div>
            <ul className="grid grid-cols-1 border-t border-border md:grid-cols-2 md:gap-x-12">
              {tagIndex.map(([tag, count]) => (
                <li key={tag} className="border-b border-border">
                  <Link
                    href={`/clubs?tags=${encodeURIComponent(tag)}`}
                    className="group flex items-baseline justify-between gap-4 py-3.5"
                  >
                    <span className="text-[0.95rem] font-medium text-foreground/80 underline-offset-4 transition-colors group-hover:text-foreground group-hover:underline">
                      {tag}
                    </span>
                    <span className="shrink-0 text-sm text-muted-foreground tabular-nums">
                      {count}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
            <div className="mt-5 flex justify-end">
              <Link
                href="/clubs"
                className="group text-[0.95rem] font-medium text-foreground underline decoration-border underline-offset-4 transition-colors hover:decoration-foreground"
              >
                See the full list{" "}
                <span
                  aria-hidden="true"
                  className="inline-block transition-transform duration-200 group-hover:translate-x-0.5"
                >
                  →
                </span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- Features ---------- */}
      <section className="mx-auto w-full max-w-7xl px-4 pb-16 sm:px-6 md:pb-24 lg:px-8">
        <SectionLabel label="How it works" />
        <h2 className="mt-8 font-heading text-3xl font-semibold text-foreground md:text-4xl">
          Made for club hunting
        </h2>
        <div className="mt-8 grid grid-cols-1 gap-x-12 gap-y-8 md:grid-cols-3">
          {features.map(({ title, body }) => (
            <div key={title} className="border-t border-foreground/60 pt-4">
              <h3 className="font-heading text-xl font-semibold text-foreground">
                {title}
              </h3>
              <p className="mt-2.5 leading-[1.6] text-foreground/75">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ---------- CTA ---------- */}
      <section className="mx-auto w-full max-w-7xl px-4 pb-20 sm:px-6 md:pb-28 lg:px-8">
        <div className="rule-double" />
        <div className="mx-auto max-w-3xl pb-2 pt-14 text-center md:pt-20">
          <h2 className="display-wonk font-heading text-4xl font-semibold leading-[1.05] tracking-[-0.01em] text-foreground md:text-6xl [text-wrap:balance]">
            Your next <WordRoll words={["four", "three", "two", "one"]} />{" "}
            years start at a club meeting
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-lg leading-[1.6] text-foreground/75">
            {acceptingCount} clubs are taking new members right now. Go say hi.
          </p>
          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/clubs"
              className="inline-flex h-12 items-center justify-center rounded-[3px] bg-sccs-orange px-8 text-base font-semibold text-sccs-ink transition-colors hover:bg-sccs-orange/85 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
            >
              Start browsing
            </Link>
            <Link
              href="/faq"
              className="inline-flex h-12 items-center justify-center px-4 text-base font-medium text-foreground underline decoration-border underline-offset-4 transition-colors hover:decoration-foreground"
            >
              Run a club? Get your page
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
