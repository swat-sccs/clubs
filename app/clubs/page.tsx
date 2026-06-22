"use client";

import { useMemo, useState } from "react";
import { X } from "lucide-react";
import Navbar, { type ClubOrdering } from "@/components/Navbar";
import ClubCard from "@/components/ClubCard";
import {
  CLUBS,
  type ClubSize,
  type MembershipProcess,
  type RecruitingCycle,
  type SwarthmoreAffiliation,
} from "@/lib/clubs";
import type { Tag } from "@/lib/tags";

const BOOKMARKS_STORAGE_KEY = "sccs-club-bookmarks";

function toggleInSet<T>(set: Set<T>, value: T): Set<T> {
  const next = new Set(set);
  if (next.has(value)) {
    next.delete(value);
  } else {
    next.add(value);
  }
  return next;
}

export default function ClubsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTags, setSelectedTags] = useState<Set<Tag>>(new Set());
  const [selectedAffiliations, setSelectedAffiliations] = useState<
    Set<SwarthmoreAffiliation>
  >(new Set());
  const [selectedSizes, setSelectedSizes] = useState<Set<ClubSize>>(
    new Set()
  );
  const [selectedMembershipProcesses, setSelectedMembershipProcesses] =
    useState<Set<MembershipProcess>>(new Set());
  const [selectedRecruitingCycles, setSelectedRecruitingCycles] = useState<
    Set<RecruitingCycle>
  >(new Set());
  const [acceptingMembersOnly, setAcceptingMembersOnly] = useState(false);
  const [ordering, setOrdering] = useState<ClubOrdering>("default");
  const [bookmarkedClubs, setBookmarkedClubs] = useState<Set<string>>(() => {
    if (typeof window === "undefined") return new Set();
    const stored = localStorage.getItem(BOOKMARKS_STORAGE_KEY);
    return stored ? new Set(JSON.parse(stored)) : new Set();
  });

  function toggleBookmark(clubName: string) {
    setBookmarkedClubs((prev) => {
      const next = toggleInSet(prev, clubName);
      localStorage.setItem(
        BOOKMARKS_STORAGE_KEY,
        JSON.stringify(Array.from(next))
      );
      return next;
    });
  }

  const filteredClubs = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const matches = CLUBS.filter((club) => {
      const matchesSearch =
        query.length === 0 ||
        club.name.toLowerCase().includes(query) ||
        club.description.toLowerCase().includes(query) ||
        club.tags.some((tag) => tag.toLowerCase().includes(query));
      const matchesTags =
        selectedTags.size === 0 ||
        [...selectedTags].every((tag) => club.tags.includes(tag));
      const matchesAffiliation =
        selectedAffiliations.size === 0 ||
        selectedAffiliations.has(club.affiliation);
      const matchesSize =
        selectedSizes.size === 0 || selectedSizes.has(club.size);
      const matchesMembershipProcess =
        selectedMembershipProcesses.size === 0 ||
        selectedMembershipProcesses.has(club.membershipProcess);
      const matchesRecruitingCycle =
        selectedRecruitingCycles.size === 0 ||
        selectedRecruitingCycles.has(club.recruitingCycle);
      const matchesAccepting =
        !acceptingMembersOnly || club.isAcceptingMembers;
      return (
        matchesSearch &&
        matchesTags &&
        matchesAffiliation &&
        matchesSize &&
        matchesMembershipProcess &&
        matchesRecruitingCycle &&
        matchesAccepting
      );
    });

    if (ordering === "alphabetical") {
      return [...matches].sort((a, b) => a.name.localeCompare(b.name));
    }
    if (ordering === "bookmarks") {
      return [...matches].sort((a, b) => {
        const aBookmarked = bookmarkedClubs.has(a.name) ? 0 : 1;
        const bBookmarked = bookmarkedClubs.has(b.name) ? 0 : 1;
        if (aBookmarked !== bBookmarked) return aBookmarked - bBookmarked;
        return a.name.localeCompare(b.name);
      });
    }
    return matches;
  }, [
    searchQuery,
    selectedTags,
    selectedAffiliations,
    selectedSizes,
    selectedMembershipProcesses,
    selectedRecruitingCycles,
    acceptingMembersOnly,
    ordering,
    bookmarkedClubs,
  ]);

  const activeFilters = useMemo(
    () => [
      ...Array.from(selectedTags, (value) => ({ kind: "tag" as const, value: value as string })),
      ...Array.from(selectedAffiliations, (value) => ({
        kind: "affiliation" as const,
        value: value as string,
      })),
      ...Array.from(selectedSizes, (value) => ({
        kind: "size" as const,
        value: value as string,
      })),
      ...Array.from(selectedMembershipProcesses, (value) => ({
        kind: "membershipProcess" as const,
        value: value as string,
      })),
      ...Array.from(selectedRecruitingCycles, (value) => ({
        kind: "recruitingCycle" as const,
        value: value as string,
      })),
      ...(acceptingMembersOnly
        ? [{ kind: "accepting" as const, value: "Is Accepting Members" }]
        : []),
    ],
    [
      selectedTags,
      selectedAffiliations,
      selectedSizes,
      selectedMembershipProcesses,
      selectedRecruitingCycles,
      acceptingMembersOnly,
    ]
  );

  type FilterKind =
    | "tag"
    | "affiliation"
    | "size"
    | "membershipProcess"
    | "recruitingCycle"
    | "accepting";

  function removeFilter(kind: FilterKind, value: string) {
    if (kind === "tag") {
      setSelectedTags((prev) => toggleInSet(prev, value as Tag));
    } else if (kind === "affiliation") {
      setSelectedAffiliations((prev) =>
        toggleInSet(prev, value as SwarthmoreAffiliation)
      );
    } else if (kind === "size") {
      setSelectedSizes((prev) => toggleInSet(prev, value as ClubSize));
    } else if (kind === "membershipProcess") {
      setSelectedMembershipProcesses((prev) =>
        toggleInSet(prev, value as MembershipProcess)
      );
    } else if (kind === "recruitingCycle") {
      setSelectedRecruitingCycles((prev) =>
        toggleInSet(prev, value as RecruitingCycle)
      );
    } else {
      setAcceptingMembersOnly(false);
    }
  }

  function clearAll() {
    setSelectedTags(new Set());
    setSelectedAffiliations(new Set());
    setSelectedSizes(new Set());
    setSelectedMembershipProcesses(new Set());
    setSelectedRecruitingCycles(new Set());
    setAcceptingMembersOnly(false);
  }

  return (
    <div className="flex items-start gap-10 px-8 py-8">
      <Navbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedTags={selectedTags}
        onToggleTag={(tag) =>
          setSelectedTags((prev) => toggleInSet(prev, tag as Tag))
        }
        onClearTags={() => setSelectedTags(new Set())}
        selectedAffiliations={selectedAffiliations}
        onToggleAffiliation={(affiliation) =>
          setSelectedAffiliations((prev) =>
            toggleInSet(prev, affiliation as SwarthmoreAffiliation)
          )
        }
        onClearAffiliations={() => setSelectedAffiliations(new Set())}
        ordering={ordering}
        onOrderingChange={setOrdering}
        selectedSizes={selectedSizes}
        onToggleSize={(size) =>
          setSelectedSizes((prev) => toggleInSet(prev, size as ClubSize))
        }
        selectedMembershipProcesses={selectedMembershipProcesses}
        onToggleMembershipProcess={(process) =>
          setSelectedMembershipProcesses((prev) =>
            toggleInSet(prev, process as MembershipProcess)
          )
        }
        acceptingMembersOnly={acceptingMembersOnly}
        onToggleAcceptingMembers={() =>
          setAcceptingMembersOnly((prev) => !prev)
        }
        selectedRecruitingCycles={selectedRecruitingCycles}
        onToggleRecruitingCycle={(cycle) =>
          setSelectedRecruitingCycles((prev) =>
            toggleInSet(prev, cycle as RecruitingCycle)
          )
        }
      />
      <div className="flex-1 max-w-[65.6rem] ml-auto">
        <h1 className="font-heading text-4xl font-bold text-foreground">
          Find your community
        </h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Browse all clubs and pick what fits you.
        </p>

        <div className="mt-6 flex flex-wrap items-center gap-2">
          <p className="text-sm text-muted-foreground">
            {filteredClubs.length}{" "}
            {filteredClubs.length === 1 ? "result" : "results"}
          </p>
          {activeFilters.map(({ kind, value }) => (
            <span
              key={`${kind}-${value}`}
              className="inline-flex animate-in items-center gap-1 rounded-full bg-sccs/10 py-1 pl-3 pr-1 text-sm font-medium text-sccs fade-in zoom-in-95 duration-150"
            >
              {value}
              <button
                type="button"
                onClick={() => removeFilter(kind, value)}
                aria-label={`Remove ${value}`}
                className="rounded-full p-0.5 text-sccs/60 transition-colors hover:bg-sccs/20 hover:text-sccs"
              >
                <X className="size-3.5" />
              </button>
            </span>
          ))}
          {activeFilters.length > 0 && (
            <button
              type="button"
              onClick={clearAll}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground hover:underline"
            >
              Clear All
            </button>
          )}
        </div>

        {filteredClubs.length === 0 ? (
          <p className="mt-10 text-base text-muted-foreground">
            No clubs match your filters.
          </p>
        ) : (
          <div className="mt-4 grid grid-cols-1 gap-6 lg:grid-cols-2">
            {filteredClubs.map((club) => (
              <ClubCard
                key={club.name}
                club={club}
                isBookmarked={bookmarkedClubs.has(club.name)}
                onToggleBookmark={() => toggleBookmark(club.name)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
