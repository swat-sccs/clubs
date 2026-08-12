import clubsData from "./clubs.json";
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

export const CLUBS: Club[] = clubsData as Club[];

// The club list is static for the lifetime of the module, so every count and
// index below is computed exactly once at load time. The getters keep their
// original signatures but are now O(1).

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

for (const club of CLUBS) {
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

export function getTagCounts(): ReadonlyMap<Tag, number> {
  return tagCounts;
}

export function getAffiliationCounts(): ReadonlyMap<SwarthmoreAffiliation, number> {
  return affiliationCounts;
}

export function getSizeCounts(): ReadonlyMap<ClubSize, number> {
  return sizeCounts;
}

export function getMembershipProcessCounts(): ReadonlyMap<MembershipProcess, number> {
  return membershipProcessCounts;
}

export function getRecruitingCycleCounts(): ReadonlyMap<RecruitingCycle, number> {
  return recruitingCycleCounts;
}

export function getAcceptingMembersCount(): number {
  return acceptingMembersCount;
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

export const CLUB_SEARCH_INDEX: ClubSearchEntry[] = CLUBS.map(toSearchEntry);

const nameCollator = new Intl.Collator();

/** Same entries as CLUB_SEARCH_INDEX, pre-sorted by club name so ordered
 *  views only pay for a filter, never a sort. */
export const CLUB_SEARCH_INDEX_ALPHABETICAL: ClubSearchEntry[] = [
  ...CLUB_SEARCH_INDEX,
].sort((a, b) => nameCollator.compare(a.club.name, b.club.name));