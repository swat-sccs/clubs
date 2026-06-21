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
  "Application and Interview Required",
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

export function getTagCounts(): Map<Tag, number> {
  const counts = new Map<Tag, number>(TAGS.map((tag) => [tag, 0]));
  for (const club of CLUBS) {
    for (const tag of club.tags) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
  }
  return counts;
}

export function getAffiliationCounts(): Map<SwarthmoreAffiliation, number> {
  const counts = new Map<SwarthmoreAffiliation, number>(
    SWARTHMORE_AFFILIATIONS.map((affiliation) => [affiliation, 0])
  );
  for (const club of CLUBS) {
    counts.set(club.affiliation, (counts.get(club.affiliation) ?? 0) + 1);
  }
  return counts;
}

export function getSizeCounts(): Map<ClubSize, number> {
  const counts = new Map<ClubSize, number>(CLUB_SIZES.map((size) => [size, 0]));
  for (const club of CLUBS) {
    counts.set(club.size, (counts.get(club.size) ?? 0) + 1);
  }
  return counts;
}

export function getMembershipProcessCounts(): Map<MembershipProcess, number> {
  const counts = new Map<MembershipProcess, number>(
    MEMBERSHIP_PROCESSES.map((process) => [process, 0])
  );
  for (const club of CLUBS) {
    counts.set(club.membershipProcess, (counts.get(club.membershipProcess) ?? 0) + 1);
  }
  return counts;
}

export function getRecruitingCycleCounts(): Map<RecruitingCycle, number> {
  const counts = new Map<RecruitingCycle, number>(
    RECRUITING_CYCLES.map((cycle) => [cycle, 0])
  );
  for (const club of CLUBS) {
    counts.set(club.recruitingCycle, (counts.get(club.recruitingCycle) ?? 0) + 1);
  }
  return counts;
}

export function getAcceptingMembersCount(): number {
  return CLUBS.filter((club) => club.isAcceptingMembers).length;
}