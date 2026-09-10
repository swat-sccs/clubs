import Link from "next/link";

export const metadata = {
  title: "Terms of Service | Swat Clubs",
  description: "Community expectations for using Swat Clubs.",
};

export default function TermsPage() {
  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-12 sm:px-6">
      <p className="text-sm font-semibold tracking-[0.14em] text-sccs-ember uppercase">
        Community guidelines
      </p>
      <h1 className="mt-2 font-heading text-4xl font-bold text-foreground">
        Terms of Service
      </h1>
      <div className="mt-8 space-y-5 rounded-2xl border border-border bg-card p-6 text-lg leading-8 text-foreground/85 sm:p-8">
        <p>Use kind, respectful language and treat your peers with care.</p>
        <p>
          Only share club events and opportunities you are authorized to post.
          Do not upload explicit, hateful, harassing, deceptive, or unlawful content.
        </p>
        <p>
          Automated checks may hold a post for SCCS review. SCCS administrators
          may approve or deny posts to keep the directory welcoming and useful.
        </p>
        <p>
          Report inappropriate content, or appeal a moderation decision, by contacting{" "}
          <a href="mailto:staff@sccs.swarthmore.edu" className="font-semibold text-sccs underline">
            staff@sccs.swarthmore.edu
          </a>
          .
        </p>
      </div>
      <p className="mt-5 text-muted-foreground">
        See the <Link href="/privacy" className="font-semibold text-sccs underline">privacy notice</Link> for information about account data, RSVPs, moderation, analytics, and retention.
      </p>
      <Link href="/feed" className="mt-8 inline-block font-semibold text-sccs underline">
        ← Back to the feed
      </Link>
    </main>
  );
}
