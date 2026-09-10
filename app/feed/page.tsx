import FeedList from "@/components/FeedList";
import { auth } from "@/lib/auth";
import { campusNow } from "@/lib/events";
import { getFeedPage, type FeedView } from "@/lib/feed";
import { readRsvpBrowserHash } from "@/lib/rsvp-browser";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Feed | Swat Clubs",
  description: "Events and opportunities from Swarthmore student clubs.",
};

export default async function FeedPage(props: PageProps<"/feed">) {
  const [session, browserIdHash, searchParams] = await Promise.all([
    auth(),
    readRsvpBrowserHash(),
    props.searchParams,
  ]);
  const isAuthenticated = Boolean(session?.user?.id);
  const requestedView = searchParams.view === "following" ? "following" : "all";
  const initialView: FeedView =
    requestedView === "following" && isAuthenticated ? "following" : "all";
  const anchor = campusNow();
  const initialPage = await getFeedPage({
    offset: 0,
    view: initialView,
    period: "upcoming",
    userId: session?.user?.id ?? null,
    browserIdHash,
    anchorDate: anchor.date,
    anchorTime: anchor.time,
  });

  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      <div className="max-w-2xl animate-fade-rise">
        <p className="text-sm font-semibold tracking-[0.14em] text-sccs-ember uppercase">
          What&apos;s happening around campus
        </p>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Upcoming club events and opportunities.
        </p>
      </div>

      <FeedList
        initialPage={initialPage}
        initialView={initialView}
        isAuthenticated={isAuthenticated}
        anchorDate={anchor.date}
        anchorTime={anchor.time}
      />
    </main>
  );
}
