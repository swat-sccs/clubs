import Link from "next/link";
import { requireAdmin } from "@/lib/authorization";
import { prisma } from "@/lib/db";
import {
  moderateClaimRequest,
  moderateCreationRequest,
} from "./actions";

export const dynamic = "force-dynamic";

function requesterLabel(request: {
  requesterName: string | null;
  requesterEmail: string | null;
  requesterUsername: string | null;
}) {
  const labels = [
    request.requesterName,
    request.requesterUsername ? `@${request.requesterUsername}` : null,
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
  const [creationRequests, claimRequests] = await Promise.all([
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
  ]);
  const searchParams = await props.searchParams;
  const error = Array.isArray(searchParams.error)
    ? searchParams.error[0]
    : searchParams.error;

  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-4 pb-16 pt-8 sm:px-6 lg:px-8">
      <h2 className="font-heading text-2xl font-semibold text-foreground">
        Club requests
      </h2>
      <p className="mt-2 text-lg text-muted-foreground">
        Approvals publish club submissions or grant an SCCS user edit access.
      </p>
      {error && (
        <p role="alert" className="mt-6 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-destructive">
          {error}
        </p>
      )}

      <section className="mt-10">
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
