import ClubsExplorer from "@/components/ClubsExplorer";
import { getClubs } from "@/lib/data";

// Club data lives in Postgres, so this page renders per request.
export const dynamic = "force-dynamic";

export default async function ClubsPage() {
  const clubs = await getClubs();
  return <ClubsExplorer clubs={clubs} />;
}
