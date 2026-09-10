import Link from "next/link";
import { redirect } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import ClaimClubForm from "@/components/ClaimClubForm";
import { requireUser } from "@/lib/authorization";
import { prisma } from "@/lib/db";
import { submitClaimRequest } from "./actions";

export const dynamic = "force-dynamic";

export default async function ClaimClubPage(
  props: PageProps<"/clubs/[slug]/claim">,
) {
  const { slug } = await props.params;
  const session = await requireUser(`/clubs/${slug}/claim`);
  const club = await prisma.club.findUnique({
    where: { slug },
    select: {
      id: true,
      name: true,
      editors: {
        where: { userId: session.user.id },
        select: { id: true },
        take: 1,
      },
      claimRequests: {
        where: { requesterId: session.user.id, status: "PENDING" },
        select: { id: true },
        take: 1,
      },
    },
  });
  if (!club) redirect("/clubs");
  if (session.user.isAdmin || club.editors.length > 0) {
    redirect(`/clubs/${slug}/edit`);
  }

  const searchParams = await props.searchParams;
  const submitted = searchParams.submitted === "1" || club.claimRequests.length > 0;
  const action = submitClaimRequest.bind(null, slug);

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-10 sm:px-6">
      <Link href={`/clubs/${slug}`} className="text-sm font-medium text-muted-foreground hover:underline">
        ← {club.name}
      </Link>
      <h1 className="mt-6 font-heading text-3xl font-bold text-foreground">
        Claim {club.name}
      </h1>
      {submitted ? (
        <div className="mt-8 rounded-xl border border-border bg-card p-6">
          <CheckCircle2 className="size-8 text-sccs" />
          <h2 className="mt-3 font-heading text-xl font-semibold">Claim awaiting review</h2>
          <p className="mt-2 leading-7 text-muted-foreground">
            SCCS administrators can now review your role and explanation. You
            will receive edit access only after approval.
          </p>
        </div>
      ) : (
        <>
          <p className="mt-2 text-lg leading-7 text-muted-foreground">
            Tell SCCS how you are connected to this club. Your SCCS account
            identity is included with the request.
          </p>
          <ClaimClubForm action={action} />
        </>
      )}
    </main>
  );
}
