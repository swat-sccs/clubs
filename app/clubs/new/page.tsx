import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import ClubForm from "@/components/ClubForm";

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
        Listed under your name ({session.user.name ?? session.user.email}), so
        keep it honest.
      </p>
      <div className="mt-8">
        <ClubForm />
      </div>
    </main>
  );
}
