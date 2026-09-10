import Link from "next/link";
import AdminDailyBarChart from "@/components/AdminDailyBarChart";
import type { AdminAnalytics } from "@/lib/admin-analytics";
import { ANALYTICS_RANGES } from "@/lib/admin-analytics";

export default function AdminAnalyticsCharts({
  analytics,
}: {
  analytics: AdminAnalytics;
}) {
  const firstDate = analytics.trend.at(0)?.label ?? "";
  const lastDate = analytics.trend.at(-1)?.label ?? "";
  const trendPosts = analytics.trend.reduce((sum, point) => sum + point.posts, 0);
  const trendRsvps = analytics.trend.reduce((sum, point) => sum + point.rsvps, 0);

  return (
    <section className="mt-10" aria-labelledby="engagement-analytics-heading">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2
            id="engagement-analytics-heading"
            className="font-heading text-2xl font-semibold text-foreground"
          >
            Post and RSVP analytics
          </h2>
          <p className="mt-1 text-muted-foreground">
            All-time engagement totals and daily activity for the last {analytics.rangeDays} days.
          </p>
        </div>
        <nav
          aria-label="Analytics time range"
          className="inline-flex rounded-xl border border-border bg-card p-1"
        >
          {ANALYTICS_RANGES.map((days) => {
            const selected = days === analytics.rangeDays;
            return (
              <Link
                key={days}
                href={days === 30 ? "/admin" : `/admin?days=${days}`}
                scroll={false}
                aria-current={selected ? "page" : undefined}
                className={
                  selected
                    ? "rounded-lg bg-sccs px-3 py-1.5 text-sm font-semibold text-white shadow-sm"
                    : "rounded-lg px-3 py-1.5 text-sm font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                }
              >
                {days}d
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Total posts" value={analytics.totalPosts.toLocaleString()} />
        <MetricCard label="Active RSVPs" value={analytics.totalRsvps.toLocaleString()} />
        <MetricCard
          label="RSVPs per post"
          value={analytics.averageRsvpsPerPost.toFixed(1)}
        />
        <MetricCard
          label="Clubs that have posted"
          value={analytics.postingClubs.toLocaleString()}
        />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[1.25fr_0.75fr]">
        <div className="rounded-2xl border border-border bg-card p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="font-heading text-lg font-semibold">Daily activity</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {firstDate}–{lastDate}; each series uses its own labeled scale.
              </p>
            </div>
            <div className="flex flex-wrap gap-3 text-xs font-semibold">
              <Legend color="var(--chart-1)" label={`${trendPosts} posts`} />
              <Legend color="var(--chart-4)" label={`${trendRsvps} active RSVPs`} />
            </div>
          </div>
          <div className="mt-6 space-y-7">
            <AdminDailyBarChart
              title="Posts created"
              metric="posts"
              noun="post"
              color="var(--chart-1)"
              data={analytics.trend}
              rangeDays={analytics.rangeDays}
            />
            <AdminDailyBarChart
              title="Active RSVPs by sign-up date"
              metric="rsvps"
              noun="RSVP"
              color="var(--chart-4)"
              data={analytics.trend}
              rangeDays={analytics.rangeDays}
            />
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 sm:p-6">
          <div>
            <h3 className="font-heading text-lg font-semibold">Engagement by club</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Up to eight clubs, ranked by active RSVPs and then post count.
            </p>
          </div>
          <ClubEngagementChart clubs={analytics.topClubs} />
        </div>
      </div>
    </section>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      <p className="mt-2 font-heading text-3xl font-bold text-foreground">{value}</p>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-muted-foreground">
      <span className="size-2.5 rounded-sm" style={{ backgroundColor: color }} />
      {label}
    </span>
  );
}

function ClubEngagementChart({
  clubs,
}: {
  clubs: AdminAnalytics["topClubs"];
}) {
  if (clubs.length === 0) {
    return (
      <p className="mt-8 rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
        Club engagement will appear after the first post is created.
      </p>
    );
  }
  const maximumPosts = Math.max(...clubs.map((club) => club.posts), 1);
  const maximumRsvps = Math.max(...clubs.map((club) => club.rsvps), 1);

  return (
    <div className="mt-6">
      <div className="mb-4 flex gap-4 text-xs font-semibold">
        <Legend color="var(--chart-1)" label="Posts" />
        <Legend color="var(--chart-4)" label="Active RSVPs" />
      </div>
      <ol className="space-y-5">
        {clubs.map((club) => (
          <li key={club.id}>
            <div className="mb-2 flex items-baseline justify-between gap-3">
              <Link
                href={`/clubs/${club.slug}`}
                className="truncate text-sm font-semibold text-foreground hover:underline"
              >
                {club.name}
              </Link>
              <span className="shrink-0 text-xs text-muted-foreground">
                {club.posts} post{club.posts === 1 ? "" : "s"} · {club.rsvps} RSVP
                {club.rsvps === 1 ? "" : "s"}
              </span>
            </div>
            <div className="space-y-1.5" aria-hidden="true">
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${(club.posts / maximumPosts) * 100}%`,
                    backgroundColor: "var(--chart-1)",
                  }}
                />
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${(club.rsvps / maximumRsvps) * 100}%`,
                    backgroundColor: "var(--chart-4)",
                  }}
                />
              </div>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
