import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "FAQ | Swat Clubs",
  description: "Frequently asked questions about Swat Clubs.",
};

export default function FAQPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6 md:py-16 lg:px-8">
      <p className="animate-fade-rise text-sm font-medium tracking-[0.18em] text-sccs-ember uppercase">
        Good questions
      </p>
      <h1 className="display-wonk mt-3 animate-fade-rise font-heading text-4xl font-bold text-foreground animation-delay-100 md:text-5xl [text-wrap:balance]">
        Frequently Asked Questions
      </h1>

      <div className="mt-12 flex flex-col gap-12">
        <section>
          <h2 className="font-heading text-2xl font-semibold text-sccs [text-wrap:balance]">
            What is Swat Clubs?
          </h2>
          <p className="mt-3 text-base leading-7 text-foreground/85">
            Swat Clubs is the student organization directory for Swarthmore
            College: every club, team, publication, and society we know about,
            searchable and filterable. Discovery should not end when the
            Activities Fair tables fold up. For official college support, see
            the Office of Student Engagement.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-2xl font-semibold text-sccs [text-wrap:balance]">
            How do I use this site?
          </h2>
          <ul className="mt-3 list-disc space-y-2 pl-6 text-base leading-7 text-foreground/90">
            <li>
              Browse the{" "}
              <Link href="/clubs" className="font-medium text-sccs underline">
                full directory
              </Link>
              . Search by name, and filter by tags, size, membership
              process, and recruiting cycle.
            </li>
            <li>
              Open a club&apos;s page for its full profile, including meeting
              info and contact when the club has listed them.
            </li>
            <li>
              Bookmark clubs you want to remember. Bookmarks stay in this
              browser; they are not tied to your SCCS login.
            </li>
            <li>
              On{" "}
              <Link href="/match" className="font-medium text-sccs underline">
                Match
              </Link>
              , describe what you&apos;re into in your own words. We rank clubs
              by how close their profiles are to that description.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="font-heading text-2xl font-semibold text-sccs [text-wrap:balance]">
            Why do I have to log in?
          </h2>
          <p className="mt-3 text-base leading-7 text-foreground/85">
            You don&apos;t, unless you want to add a club. Browsing, search,
            bookmarks, and matching all work signed out. Login is your SCCS
            account.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-2xl font-semibold text-sccs [text-wrap:balance]">
            How do I add a club?
          </h2>
          <p className="mt-3 text-base leading-7 text-foreground/85">
            Anyone with an SCCS account can{" "}
            <Link href="/clubs/new" className="font-medium text-sccs underline">
              add a club
            </Link>
            . The submission stays private until an SCCS administrator approves
            it. If the club already has a page, claim that page instead of
            creating a duplicate.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-2xl font-semibold text-sccs [text-wrap:balance]">
            How do I edit a club page?
          </h2>
          <p className="mt-3 text-base leading-7 text-foreground/85">
            Open the club&apos;s page and choose <strong>Claim this club</strong>.
            Tell us your role and why you should manage the page. After an SCCS
            administrator approves the claim, the page will show an edit button
            whenever you are signed in.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-2xl font-semibold text-sccs [text-wrap:balance]">
            Why can&apos;t I find an organization?
          </h2>
          <p className="mt-3 text-base leading-7 text-foreground/85">
            We&apos;re working toward a complete directory, but some groups are
            still missing or listed under a name you wouldn&apos;t search for.
            If you run the club,{" "}
            <Link href="/clubs/new" className="font-medium text-sccs underline">
              add it here
            </Link>
            . Otherwise, tell us at{" "}
            <a
              href="mailto:staff@sccs.swarthmore.edu"
              className="font-medium text-sccs underline decoration-sccs-orange/50 decoration-2 underline-offset-4 transition-colors hover:decoration-sccs-orange"
            >
              staff@sccs.swarthmore.edu
            </a>
            .
          </p>
        </section>

        <section>
          <h2 className="font-heading text-2xl font-semibold text-sccs [text-wrap:balance]">
            How are clubs ordered?
          </h2>
          <p className="mt-3 text-base leading-7 text-foreground/85">
            By default, clubs are shown in our recommended order. You can switch
            to alphabetical order, or sort bookmarked clubs first, using the
            Ordering filter on the Clubs page.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-2xl font-semibold text-sccs [text-wrap:balance]">
            How can I provide feedback?
          </h2>
          <p className="mt-3 text-base leading-7 text-foreground/85">
            Questions, corrections, and bugs are welcome.{" "}
            <a
              href="mailto:sccs@sccs.swarthmore.edu"
              className="font-medium text-sccs underline decoration-sccs-orange/50 decoration-2 underline-offset-4 transition-colors hover:decoration-sccs-orange"
            >
              Email SCCS
            </a>
            .
          </p>
        </section>

        <hr className="border-border" />
      </div>
    </div>
  );
}
