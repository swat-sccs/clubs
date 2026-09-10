import Link from "next/link";

export const metadata = {
  title: "Privacy | Swat Clubs",
  description: "How Swat Clubs handles account, activity, and analytics data.",
};

export default function PrivacyPage() {
  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-12 sm:px-6">
      <p className="text-sm font-semibold tracking-[0.14em] text-sccs-ember uppercase">
        Privacy
      </p>
      <h1 className="mt-2 font-heading text-4xl font-bold">Privacy notice</h1>
      <div className="mt-8 space-y-7 rounded-2xl border border-border bg-card p-6 leading-7 text-foreground/85 sm:p-8">
        <section>
          <h2 className="font-heading text-xl font-semibold text-foreground">What we collect</h2>
          <p className="mt-2">
            Signing in provides your Keycloak account ID, name, username,
            email address, and authorization groups. We store club access,
            submissions, posts, follows, moderation decisions, and an audit
            history of administrative and editor actions.
          </p>
        </section>
        <section>
          <h2 className="font-heading text-xl font-semibold text-foreground">RSVPs and rate limits</h2>
          <p className="mt-2">
            Anonymous RSVPs use a random, HTTP-only browser cookie that lasts
            up to one year. The server stores only a keyed hash of that value.
            Abuse-prevention counters store keyed hashes of account or network
            identifiers and expire automatically after their rate-limit window.
            You can remove an RSVP from the same browser at any time.
          </p>
        </section>
        <section>
          <h2 className="font-heading text-xl font-semibold text-foreground">Analytics and moderation</h2>
          <p className="mt-2">
            SCCS-hosted Plausible analytics receives ordinary web-request
            metadata. Uploaded images and post text may be processed by
            automated safety checks and reviewed by SCCS administrators.
          </p>
        </section>
        <section>
          <h2 className="font-heading text-xl font-semibold text-foreground">Retention and choices</h2>
          <p className="mt-2">
            Follows remain until you unfollow. RSVP records remain with their
            event unless you remove the RSVP or the event is deleted. Club,
            moderation, and audit records are retained for directory operation
            and accountability. To request access, correction, or deletion of
            personal information, email{" "}
            <a className="font-semibold text-sccs underline" href="mailto:staff@sccs.swarthmore.edu">
              staff@sccs.swarthmore.edu
            </a>
            . Some audit records may need to be retained for security.
          </p>
        </section>
      </div>
      <Link href="/" className="mt-8 inline-block font-semibold text-sccs underline">
        ← Back home
      </Link>
    </main>
  );
}
