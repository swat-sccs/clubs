import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { requireUser } from "@/lib/authorization";

export const dynamic = "force-dynamic";

export default async function SubmittedClubPage() {
  await requireUser("/clubs/new/submitted");
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center px-4 py-16 text-center sm:px-6">
      <CheckCircle2 className="size-12 text-sccs" />
      <h1 className="mt-5 font-heading text-3xl font-bold text-foreground">
        Request submitted
      </h1>
      <p className="mt-3 max-w-lg text-lg leading-7 text-muted-foreground">
        Your club page is awaiting SCCS review and is not visible publicly.
        Once approved, you will be able to edit it.
      </p>
      <Link
        href="/clubs"
        className="mt-8 inline-flex h-11 items-center rounded-xl bg-sccs-orange px-6 font-semibold text-sccs-ink"
      >
        Return to clubs
      </Link>
    </main>
  );
}
