import Image from "next/image";
import Link from "next/link";
import { requireAdmin } from "@/lib/authorization";
import { prisma } from "@/lib/db";
import {
  moderatePost,
  moderateClaimRequest,
  moderateCreationRequest,
} from "./actions";
import { formatEventDate, formatEventTime } from "@/lib/events";

export const dynamic = "force-dynamic";

function requesterLabel(request: {
  requesterName: string | null;
  requesterEmail: string | null;
}) {
  const labels = [
    request.requesterName,
    request.requesterEmail,
  ].filter((value): value is string => Boolean(value));
  return labels.length > 0 ? Array.from(new Set(labels)).join(" · ") : "Unknown SCCS user";
}

function ModerationButtons({
  requestId,
  action,
}: {
  requestId: string;
  action: (formData: FormData) => Promise<void>;
}) {
  return (
    <form action={action} className="flex flex-wrap gap-2">
      <input type="hidden" name="requestId" value={requestId} />
      <button
        name="decision"
        value="approve"
        className="h-10 rounded-xl bg-sccs-orange px-4 font-semibold text-sccs-ink"
      >
        Approve
      </button>
      <button
        name="decision"
        value="reject"
        className="h-10 rounded-xl border border-border px-4 font-medium text-foreground hover:bg-muted"
      >
        Reject
      </button>
    </form>
  );
}

export default async function AdminRequestsPage(
  props: PageProps<"/admin/requests">,
) {
  await requireAdmin();
  const [creationRequests, claimRequests, postRequests] = await Promise.all([
    prisma.clubCreationRequest.findMany({
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
      take: 100,
      include: { club: { select: { slug: true } } },
    }),
    prisma.clubClaimRequest.findMany({
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
      take: 100,
      include: { club: { select: { name: true, slug: true } } },
    }),
    prisma.clubPost.findMany({
      where: { moderationStatus: "PENDING_REVIEW" },
      orderBy: { createdAt: "asc" },
      take: 100,
      include: { club: { select: { name: true, slug: true } } },
    }),
  ]);
  const searchParams = await props.searchParams;
  const error = Array.isArray(searchParams.error)
    ? searchParams.error[0]
    : searchParams.error;

  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-4 pb-16 pt-8 sm:px-6 lg:px-8">
      <h1 className="font-heading text-3xl font-bold text-foreground">
        Review queue
      </h1>
      <p className="mt-2 text-lg text-muted-foreground">
        Review held posts, new-club submissions, and club access requests.
      </p>
      {error && (
        <p role="alert" className="mt-6 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-destructive">
          {error}
        </p>
      )}

      <section className="mt-10">
        <h2 className="font-heading text-2xl font-semibold">Post approvals</h2>
        <p className="mt-2 text-muted-foreground">
          Posts shown here were held by an automated image or language check.
          Review the complete post before deciding.
        </p>
        <div className="mt-4 flex flex-col gap-5">
          {postRequests.length === 0 && (
            <p className="rounded-lg border border-dashed border-border p-5 text-muted-foreground">
              No posts are awaiting review.
            </p>
          )}
          {postRequests.map((post) => (
            <article
              key={post.id}
              className="overflow-hidden rounded-xl border border-border bg-card"
            >
              <div
                className={
                  post.imageObjectKey
                    ? "grid lg:grid-cols-[minmax(0,22rem)_1fr]"
                    : undefined
                }
              >
                {post.imageObjectKey && (
                  <div className="relative aspect-[4/3] bg-muted lg:aspect-auto lg:min-h-72">
                    <Image
                      src={`/api/media/posts/${post.id}`}
                      alt={`${post.title} submitted image`}
                      fill
                      unoptimized
                      sizes="(max-width: 1024px) 100vw, 352px"
                      className="object-contain"
                    />
                  </div>
                )}
                <div className="p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-sccs">
                        <Link href={`/clubs/${post.club.slug}`} className="hover:underline">
                          {post.club.name}
                        </Link>
                      </p>
                      <h3 className="mt-1 font-heading text-2xl font-bold">
                        {post.title}
                      </h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Submitted by {post.authorName ?? "a club editor"} ·{" "}
                        {post.createdAt.toLocaleString()}
                      </p>
                    </div>
                    <span className="rounded-full bg-amber-500/15 px-3 py-1 text-xs font-semibold text-amber-900">
                      Pending review
                    </span>
                  </div>
                  <p className="mt-4 whitespace-pre-wrap leading-7 text-foreground/85">
                    {post.subtitle}
                  </p>
                  <dl className="mt-4 grid gap-2 rounded-lg bg-muted/60 p-3 text-sm sm:grid-cols-2">
                    <div>
                      <dt className="font-semibold">When</dt>
                      <dd>
                        {formatEventDate(post.eventDate)} at{" "}
                        {formatEventTime(post.eventTime)}
                      </dd>
                    </div>
                    <div>
                      <dt className="font-semibold">Where</dt>
                      <dd>{post.location}</dd>
                    </div>
                  </dl>
                  {post.moderationReason && (
                    <p className="mt-4 rounded-lg border border-amber-500/25 bg-amber-500/10 p-3 text-sm text-amber-950">
                      <span className="font-semibold">Automated check:</span>{" "}
                      {post.moderationReason}
                    </p>
                  )}
                  <form action={moderatePost} className="mt-5">
                    <input type="hidden" name="requestId" value={post.id} />
                    <label
                      htmlFor={`post-note-${post.id}`}
                      className="text-sm font-semibold text-foreground"
                    >
                      Note if denied (optional)
                    </label>
                    <textarea
                      id={`post-note-${post.id}`}
                      name="note"
                      maxLength={1000}
                      rows={3}
                      placeholder="Briefly explain what should be changed."
                      className="mt-2 block w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                    />
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        name="decision"
                        value="approve"
                        className="h-10 rounded-xl bg-sccs-orange px-4 font-semibold text-sccs-ink"
                      >
                        Approve and publish
                      </button>
                      <button
                        name="decision"
                        value="deny"
                        className="h-10 rounded-xl border border-destructive/30 px-4 font-medium text-destructive hover:bg-destructive/5"
                      >
                        Deny
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-12">
        <h2 className="font-heading text-2xl font-semibold">Creation requests</h2>
        <div className="mt-4 flex flex-col gap-4">
          {creationRequests.length === 0 && (
            <p className="rounded-lg border border-dashed border-border p-5 text-muted-foreground">No creation requests yet.</p>
          )}
          {creationRequests.map((request) => (
            <article key={request.id} className="rounded-xl border border-border bg-card p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="font-heading text-xl font-semibold">{request.name}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {requesterLabel(request)} · {request.createdAt.toLocaleString()}
                  </p>
                </div>
                <span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold tracking-wide">{request.status}</span>
              </div>
              <p className="mt-4 whitespace-pre-wrap leading-7 text-foreground/85">{request.description}</p>
              <p className="mt-3 text-sm text-muted-foreground">
                {request.tags.join(" · ")} · {request.size} · {request.membershipProcess} · {request.recruitingCycle}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                {request.isAcceptingMembers ? "Accepting members" : "Not accepting members"}
                {request.meetingInfo ? ` · ${request.meetingInfo}` : ""}
              </p>
              {(request.email || request.instagram || request.website) && (
                <p className="mt-2 text-sm text-muted-foreground">
                  {[request.email, request.instagram, request.website]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              )}
              {request.status === "PENDING" ? (
                <div className="mt-5"><ModerationButtons requestId={request.id} action={moderateCreationRequest} /></div>
              ) : request.club ? (
                <Link href={`/clubs/${request.club.slug}`} className="mt-4 inline-block font-medium text-sccs underline">View published club</Link>
              ) : (
                <p className="mt-4 text-sm text-muted-foreground">Reviewed by {request.reviewedBy ?? "an administrator"}</p>
              )}
            </article>
          ))}
        </div>
      </section>

      <section className="mt-12">
        <h2 className="font-heading text-2xl font-semibold">Claim requests</h2>
        <div className="mt-4 flex flex-col gap-4">
          {claimRequests.length === 0 && (
            <p className="rounded-lg border border-dashed border-border p-5 text-muted-foreground">No claim requests yet.</p>
          )}
          {claimRequests.map((request) => (
            <article key={request.id} className="rounded-xl border border-border bg-card p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="font-heading text-xl font-semibold">
                    <Link href={`/clubs/${request.club.slug}`} className="hover:underline">{request.club.name}</Link>
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {requesterLabel(request)} · {request.role} · {request.createdAt.toLocaleString()}
                  </p>
                </div>
                <span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold tracking-wide">{request.status}</span>
              </div>
              <p className="mt-4 whitespace-pre-wrap leading-7 text-foreground/85">{request.explanation}</p>
              {request.status === "PENDING" ? (
                <div className="mt-5"><ModerationButtons requestId={request.id} action={moderateClaimRequest} /></div>
              ) : (
                <p className="mt-4 text-sm text-muted-foreground">Reviewed by {request.reviewedBy ?? "an administrator"}</p>
              )}
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
