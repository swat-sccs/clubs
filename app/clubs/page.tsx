import ClubsExplorer from "@/components/ClubsExplorer";
import { auth } from "@/lib/auth";
import { getClubs } from "@/lib/data";
import { prisma } from "@/lib/db";

// Club data lives in Postgres, so this page renders per request.
export const dynamic = "force-dynamic";

export default async function ClubsPage() {
  const session = await auth();
  const [clubs, follows] = await Promise.all([
    getClubs(),
    session?.user?.id
      ? prisma.clubFollow.findMany({
          where: { userId: session.user.id },
          select: { clubId: true },
        })
      : [],
  ]);
  return (
    <ClubsExplorer
      clubs={clubs}
      isAuthenticated={Boolean(session?.user?.id)}
      followedClubIds={follows.map(({ clubId }) => clubId)}
    />
  );
}
