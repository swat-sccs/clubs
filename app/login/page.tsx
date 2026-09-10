import Link from "next/link";
import { auth, signIn, signOut } from "@/lib/auth";
import { safeRelativePath } from "@/lib/redirect";

export const dynamic = "force-dynamic";

export default async function LoginPage(props: PageProps<"/login">) {
  const searchParams = await props.searchParams;
  const next = safeRelativePath(searchParams.next, "/clubs");
  const session = await auth();

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col items-center justify-center px-4 py-16 sm:px-6 lg:px-8">
      <div className="w-full max-w-md text-center">
        <h1 className="font-heading text-3xl font-bold text-foreground md:text-4xl">
          {session?.user ? "You're signed in" : "Sign in"}
        </h1>

        {session?.user ? (
          <>
            <p className="mt-4 text-lg text-muted-foreground">
              Signed in as{" "}
              <span className="font-medium text-foreground">
                {session.user.name ?? session.user.email}
              </span>
              .
            </p>
            <div className="mt-8 flex flex-col items-center gap-3">
              <Link
                href="/clubs/new"
                className="inline-flex h-12 w-full items-center justify-center rounded-xl bg-sccs-orange px-8 text-base font-semibold text-sccs-ink transition-colors hover:bg-sccs-orange/85"
              >
                Add a club
              </Link>
              <form
                className="w-full"
                action={async () => {
                  "use server";
                  await signOut({ redirectTo: "/" });
                }}
              >
                <button
                  type="submit"
                  className="inline-flex h-12 w-full items-center justify-center rounded-xl border border-foreground px-8 text-base font-medium text-foreground transition-colors hover:bg-foreground hover:text-background"
                >
                  Sign out
                </button>
              </form>
            </div>
          </>
        ) : (
          <>
            <p className="mt-4 text-lg text-muted-foreground">
              Use your SCCS account. It&#39;s the only door; there are no separate
              passwords here.
            </p>
            <form
              className="mt-8"
              action={async () => {
                "use server";
                await signIn("keycloak", { redirectTo: next });
              }}
            >
              <button
                type="submit"
                className="inline-flex h-12 w-full items-center justify-center rounded-xl bg-sccs-orange px-8 text-base font-semibold text-sccs-ink transition-colors hover:bg-sccs-orange/85"
              >
                Continue with SCCS
              </button>
            </form>
          </>
        )}
      </div>
    </main>
  );
}
