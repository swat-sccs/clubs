import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import ClubForm from "@/components/ClubForm";
import { createClubRequest } from "./actions";

export const dynamic = "force-dynamic";

export default async function NewClubPage() {
  const session = await auth();
  if (!session?.user) redirect("/login?next=/clubs/new");

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="animate-fade-rise font-heading text-3xl font-bold text-foreground md:text-4xl">
        Add your club
      </h1>
      <p className="mt-2 animate-fade-rise text-lg text-muted-foreground animation-delay-100">
        Submit a page for admin review. It will stay private until an SCCS
        administrator approves it.
      </p>
      <div className="mt-8">
        <ClubForm action={createClubRequest} />
      </div>
    </main>
  );
}
