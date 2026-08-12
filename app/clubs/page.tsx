"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { Dialog } from "radix-ui";
import Navbar, { type ClubOrdering } from "@/components/Navbar";
import ClubCard from "@/components/ClubCard";
import {
  CLUB_SEARCH_INDEX,
  CLUB_SEARCH_INDEX_ALPHABETICAL,
  type Club,
  type ClubSize,
  type MembershipProcess,
  type RecruitingCycle,
  type SwarthmoreAffiliation,
} from "@/lib/clubs";
import { TAGS, type Tag } from "@/lib/tags";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";

const BOOKMARKS_STORAGE_KEY = "sccs-club-bookmarks";

const TAG_BY_LOWER = new Map<string, Tag>(
  TAGS.map((tag) => [tag.toLowerCase(), tag])
);

/** Parse ?tags=Club+Sports (repeatable, comma-separable, case-insensitive)
 *  into the set of known tags. */
function tagsFromParams(params: URLSearchParams): Set<Tag> {
  const tags = new Set<Tag>();
  for (const raw of [...params.getAll("tags"), ...params.getAll("tag")]) {
    for (const part of raw.split(",")) {
      const tag = TAG_BY_LOWER.get(part.trim().toLowerCase());
      if (tag) tags.add(tag);
    }
  }
  return tags;
}

function toggleInSet<T>(set: Set<T>, value: T): Set<T> {
  const next = new Set(set);
  if (next.has(value)) {
    next.delete(value);
  } else {
    next.add(value);
  }
  return next;
}

function ClubsPageContent() {
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTags, setSelectedTags] = useState<Set<Tag>>(() =>
    tagsFromParams(searchParams)
  );
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
  const [bookmarkedClubs, setBookmarkedClubs] = useState<Set<string>>(
    new Set()
  );
  const [filtersOpen, setFiltersOpen] = useState(false);

  useEffect(() => {
    // Re-apply tags when a navigation changes the query while this page is
    // already mounted (e.g. homepage tag link → back → another tag link).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSelectedTags(tagsFromParams(searchParams));
  }, [searchParams]);

  useEffect(() => {
    // Read persisted bookmarks after mount to avoid a hydration mismatch
    // (localStorage is unavailable during SSR).
    const stored = localStorage.getItem(BOOKMARKS_STORAGE_KEY);
    if (stored) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setBookmarkedClubs(new Set(JSON.parse(stored)));
    }
  }, []);

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
    const requiredTags = [...selectedTags];
    // Ordered views filter the pre-sorted index, so no sort happens here.
    const source =
      ordering === "default"
        ? CLUB_SEARCH_INDEX
        : CLUB_SEARCH_INDEX_ALPHABETICAL;

    const matches: Club[] = [];
    for (const { club, searchText, tagSet } of source) {
      if (query.length > 0 && !searchText.includes(query)) continue;
      if (!requiredTags.every((tag) => tagSet.has(tag))) continue;
      if (
        selectedAffiliations.size > 0 &&
        !selectedAffiliations.has(club.affiliation)
      )
        continue;
      if (selectedSizes.size > 0 && !selectedSizes.has(club.size)) continue;
      if (
        selectedMembershipProcesses.size > 0 &&
        !selectedMembershipProcesses.has(club.membershipProcess)
      )
        continue;
      if (
        selectedRecruitingCycles.size > 0 &&
        !selectedRecruitingCycles.has(club.recruitingCycle)
      )
        continue;
      if (acceptingMembersOnly && !club.isAcceptingMembers) continue;
      matches.push(club);
    }

    if (ordering === "bookmarks") {
      // Already alphabetical; a stable partition puts bookmarks first.
      const bookmarked: Club[] = [];
      const rest: Club[] = [];
      for (const club of matches) {
        (bookmarkedClubs.has(club.name) ? bookmarked : rest).push(club);
      }
      return bookmarked.concat(rest);
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

  const filterProps = {
    searchQuery,
    onSearchChange: setSearchQuery,
    selectedTags,
    onToggleTag: (tag: string) =>
      setSelectedTags((prev) => toggleInSet(prev, tag as Tag)),
    onClearTags: () => setSelectedTags(new Set<Tag>()),
    selectedAffiliations,
    onToggleAffiliation: (affiliation: string) =>
      setSelectedAffiliations((prev) =>
        toggleInSet(prev, affiliation as SwarthmoreAffiliation)
      ),
    onClearAffiliations: () => setSelectedAffiliations(new Set<SwarthmoreAffiliation>()),
    ordering,
    onOrderingChange: setOrdering,
    selectedSizes,
    onToggleSize: (size: string) =>
      setSelectedSizes((prev) => toggleInSet(prev, size as ClubSize)),
    selectedMembershipProcesses,
    onToggleMembershipProcess: (process: string) =>
      setSelectedMembershipProcesses((prev) =>
        toggleInSet(prev, process as MembershipProcess)
      ),
    acceptingMembersOnly,
    onToggleAcceptingMembers: () => setAcceptingMembersOnly((prev) => !prev),
    selectedRecruitingCycles,
    onToggleRecruitingCycle: (cycle: string) =>
      setSelectedRecruitingCycles((prev) =>
        toggleInSet(prev, cycle as RecruitingCycle)
      ),
  };

  return (
    <div className="mx-auto flex w-full max-w-7xl items-start gap-10 px-4 py-8 sm:px-6 md:py-10 lg:px-8">
      {/* Desktop filter rail */}
      <aside className="hidden w-64 shrink-0 lg:block">
        <div className="sticky top-28 max-h-[calc(100vh-8.5rem)] overflow-y-auto overscroll-contain pr-1 pb-4">
          <Navbar {...filterProps} />
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        <h1 className="animate-fade-rise font-heading text-3xl font-bold text-foreground md:text-4xl">
          Find your community
        </h1>
        <p className="mt-2 animate-fade-rise text-lg text-muted-foreground animation-delay-100">
          Browse all clubs and pick what fits you.
        </p>

        {/* Mobile search + filters */}
        <div className="mt-6 flex items-center gap-2.5 lg:hidden">
          <InputGroup className="h-11 flex-1 rounded-xl">
            <InputGroupInput
              placeholder="Search clubs"
              className="text-base"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
            />
            <InputGroupAddon align="inline-end">
              <Search className="size-5" />
            </InputGroupAddon>
          </InputGroup>

          <Dialog.Root open={filtersOpen} onOpenChange={setFiltersOpen}>
            <Dialog.Trigger asChild>
              <button
                type="button"
                className="relative flex h-11 shrink-0 items-center gap-2 rounded-xl border border-border bg-card px-4 font-medium text-foreground transition-colors hover:border-sccs/30 hover:text-sccs"
              >
                <SlidersHorizontal className="size-4.5" />
                Filters
                {activeFilters.length > 0 && (
                  <span className="flex size-5 items-center justify-center rounded-full bg-sccs-orange text-xs font-bold text-sccs-ink">
                    {activeFilters.length}
                  </span>
                )}
              </button>
            </Dialog.Trigger>
            <Dialog.Portal>
              <Dialog.Overlay className="fixed inset-0 z-50 bg-sccs-ink/50 backdrop-blur-sm data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0" />
              <Dialog.Content className="fixed inset-y-0 left-0 z-50 flex w-[85vw] max-w-sm flex-col bg-background shadow-2xl outline-none data-[state=closed]:duration-200 data-[state=open]:duration-300 data-[state=closed]:animate-out data-[state=closed]:slide-out-to-left data-[state=open]:animate-in data-[state=open]:slide-in-from-left">
                <div className="flex items-center justify-between border-b border-border px-5 py-4">
                  <Dialog.Title className="font-heading text-xl font-bold text-foreground">
                    Filters
                  </Dialog.Title>
                  <Dialog.Close asChild>
                    <button
                      type="button"
                      aria-label="Close filters"
                      className="flex size-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-sccs/8 hover:text-sccs"
                    >
                      <X className="size-5" />
                    </button>
                  </Dialog.Close>
                </div>
                <Dialog.Description className="sr-only">
                  Filter clubs by tags, affiliations, size, membership process,
                  and recruiting cycle.
                </Dialog.Description>
                <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-5">
                  <Navbar {...filterProps} />
                </div>
                <div className="border-t border-border p-4">
                  <Dialog.Close asChild>
                    <button
                      type="button"
                      className="h-12 w-full rounded-xl bg-sccs-orange font-semibold text-sccs-ink transition-colors hover:bg-sccs-orange/90"
                    >
                      Show {filteredClubs.length}{" "}
                      {filteredClubs.length === 1 ? "club" : "clubs"}
                    </button>
                  </Dialog.Close>
                </div>
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>
        </div>

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
          <div className="mt-10 flex flex-col items-start gap-3 rounded-2xl border border-dashed border-border bg-card/60 p-8">
            <p className="font-heading text-xl font-semibold text-foreground">
              No clubs match your filters
            </p>
            <p className="text-muted-foreground">
              Try removing a filter or two. Your people are in here somewhere.
            </p>
            {activeFilters.length > 0 && (
              <button
                type="button"
                onClick={clearAll}
                className="mt-1 rounded-full bg-sccs px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-sccs/90"
              >
                Clear all filters
              </button>
            )}
          </div>
        ) : (
          <div className="mt-4 grid grid-cols-1 gap-4 sm:gap-6 xl:grid-cols-2">
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

export default function ClubsPage() {
  // useSearchParams needs a Suspense boundary so the rest of the route can
  // still be prerendered.
  return (
    <Suspense>
      <ClubsPageContent />
    </Suspense>
  );
}
