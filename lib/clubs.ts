import { TAGS, type Tag } from "./tags";

export const SWARTHMORE_AFFILIATIONS = [
  "Club Sports Council",
  "Community Service & Outreach Council",
  "Health & Wellness Council",
  "Identity & Cultural Affairs Council",
  "Performing & Visual Arts Council",
  "Political & Advocacy Council",
  "Pre-Professional & Academic Council",
  "Publications & Media Council",
  "Special Interest & Recreation Council",
  "Spiritual & Religious Council",
] as const;

export type SwarthmoreAffiliation = (typeof SWARTHMORE_AFFILIATIONS)[number];

export const CLUB_SIZES = [
  "less than 10 members",
  "less than 20 members",
  "20 to 50 members",
  "50 to 100 members",
  "more than 100",
] as const;

export type ClubSize = (typeof CLUB_SIZES)[number];

export const MEMBERSHIP_PROCESSES = [
  "Open Membership",
  "Tryout Required",
  "Audition Required",
  "Application Required",
  "Application & Interview Required",
] as const;

export type MembershipProcess = (typeof MEMBERSHIP_PROCESSES)[number];

export const RECRUITING_CYCLES = [
  "Open",
  "Fall Semester",
  "Spring Semester",
  "Both Semesters",
  "Unknown",
] as const;

export type RecruitingCycle = (typeof RECRUITING_CYCLES)[number];

export type Club = {
  name: string;
  description: string;
  tags: Tag[];
  affiliation: SwarthmoreAffiliation;
  size: ClubSize;
  isAcceptingMembers: boolean;
  membershipProcess: MembershipProcess;
  recruitingCycle: RecruitingCycle;
};

// Clubs now live in Postgres (see lib/data.ts), so nothing here can be
// precomputed at module load. Everything below is a pure function of a club
// list; callers memoize per data fetch.

export type ClubStats = {
  tagCounts: ReadonlyMap<Tag, number>;
  affiliationCounts: ReadonlyMap<SwarthmoreAffiliation, number>;
  sizeCounts: ReadonlyMap<ClubSize, number>;
  membershipProcessCounts: ReadonlyMap<MembershipProcess, number>;
  recruitingCycleCounts: ReadonlyMap<RecruitingCycle, number>;
  acceptingMembersCount: number;
};

export function buildClubStats(clubs: readonly Club[]): ClubStats {
  const tagCounts = new Map<Tag, number>(TAGS.map((tag) => [tag, 0]));
  const affiliationCounts = new Map<SwarthmoreAffiliation, number>(
    SWARTHMORE_AFFILIATIONS.map((affiliation) => [affiliation, 0])
  );
  const sizeCounts = new Map<ClubSize, number>(
    CLUB_SIZES.map((size) => [size, 0])
  );
  const membershipProcessCounts = new Map<MembershipProcess, number>(
    MEMBERSHIP_PROCESSES.map((process) => [process, 0])
  );
  const recruitingCycleCounts = new Map<RecruitingCycle, number>(
    RECRUITING_CYCLES.map((cycle) => [cycle, 0])
  );
  let acceptingMembersCount = 0;

  for (const club of clubs) {
    for (const tag of club.tags) {
      tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1);
    }
    affiliationCounts.set(
      club.affiliation,
      (affiliationCounts.get(club.affiliation) ?? 0) + 1
    );
    sizeCounts.set(club.size, (sizeCounts.get(club.size) ?? 0) + 1);
    membershipProcessCounts.set(
      club.membershipProcess,
      (membershipProcessCounts.get(club.membershipProcess) ?? 0) + 1
    );
    recruitingCycleCounts.set(
      club.recruitingCycle,
      (recruitingCycleCounts.get(club.recruitingCycle) ?? 0) + 1
    );
    if (club.isAcceptingMembers) acceptingMembersCount++;
  }

  return {
    tagCounts,
    affiliationCounts,
    sizeCounts,
    membershipProcessCounts,
    recruitingCycleCounts,
    acceptingMembersCount,
  };
}

export type ClubSearchEntry = {
  club: Club;
  /**
   * Name, description, and tags lowercased once, newline-joined so a query
   * can never match across field boundaries.
   */
  searchText: string;
  tagSet: ReadonlySet<Tag>;
};

function toSearchEntry(club: Club): ClubSearchEntry {
  return {
    club,
    searchText: [club.name, club.description, ...club.tags]
      .join("\n")
      .toLowerCase(),
    tagSet: new Set(club.tags),
  };
}

export function buildSearchIndex(clubs: readonly Club[]): ClubSearchEntry[] {
  return clubs.map(toSearchEntry);
}

const nameCollator = new Intl.Collator();

/** Same entries pre-sorted by club name so ordered views only pay for a
 *  filter, never a sort. */
export function sortSearchIndexByName(
  index: readonly ClubSearchEntry[]
): ClubSearchEntry[] {
  return [...index].sort((a, b) =>
    nameCollator.compare(a.club.name, b.club.name)
  );
}
