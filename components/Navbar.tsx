"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Bookmark, Check, ChevronDown, ChevronUp, List, Search, Star, Tag, X } from "lucide-react";
import {
  getAcceptingMembersCount,
  getAffiliationCounts,
  getMembershipProcessCounts,
  getRecruitingCycleCounts,
  getSizeCounts,
  getTagCounts,
} from "@/lib/clubs";
import type {
  ClubSize,
  MembershipProcess,
  RecruitingCycle,
  SwarthmoreAffiliation,
} from "@/lib/clubs";
import type { Tag as TagValue } from "@/lib/tags";
import { cn } from "@/lib/utils";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

function FilterSection({
  title,
  defaultOpen = true,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="flex w-full cursor-pointer items-center justify-between text-left">
        <span className="font-heading text-lg font-semibold text-foreground">
          {title}
        </span>
        {open ? (
          <ChevronUp className="size-5 text-muted-foreground" />
        ) : (
          <ChevronDown className="size-5 text-muted-foreground" />
        )}
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-3">{children}</CollapsibleContent>
    </Collapsible>
  );
}

function CheckboxFilterGroup({
  legend,
  options,
  selected,
  onToggle,
}: {
  legend: string;
  options: CountOption[];
  selected: Set<string>;
  onToggle: (value: string) => void;
}) {
  return (
    <FieldSet>
      <FieldLegend variant="label" className="sr-only">
        {legend}
      </FieldLegend>
      <FieldGroup data-slot="checkbox-group">
        {options.map((option) => {
          const id = `${slugify(legend)}-${slugify(option.value)}`;
          return (
            <Field key={id} orientation="horizontal" className="gap-3">
              <Checkbox
                id={id}
                className="size-5"
                checked={selected.has(option.value)}
                onCheckedChange={() => onToggle(option.value)}
              />
              <FieldLabel
                htmlFor={id}
                className="flex-1 text-base font-normal"
              >
                {option.label}
              </FieldLabel>
              <span className="text-sm text-muted-foreground">
                ({option.count})
              </span>
            </Field>
          );
        })}
      </FieldGroup>
    </FieldSet>
  );
}

type CountOption = {
  value: string;
  label: string;
  count: number;
};

function FilterSearchDropdown({
  placeholder,
  allLabel,
  options,
  selected,
  onToggle,
  onClear,
  variant = "list",
}: {
  placeholder: string;
  allLabel: string;
  options: CountOption[];
  selected: Set<string>;
  onToggle: (value: string) => void;
  onClear: () => void;
  variant?: "list" | "checkbox";
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handlePointerDown(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [open]);

  const filteredOptions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((option) => option.label.toLowerCase().includes(q));
  }, [options, query]);

  const selectedOptions = useMemo(
    () => options.filter((option) => selected.has(option.value)),
    [options, selected]
  );

  return (
    <div ref={containerRef} className="relative">
      <InputGroup
        className="h-auto min-h-10 items-start gap-1.5 py-1.5"
        onClick={() => setOpen(true)}
      >
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
          {selectedOptions.map((option) => (
            <span
              key={option.value}
              className="inline-flex animate-in items-center gap-1 rounded-full bg-sccs/10 py-1 pl-2.5 pr-1 text-sm font-medium text-sccs fade-in zoom-in-95 duration-150"
            >
              {option.label}
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  onToggle(option.value);
                }}
                aria-label={`Remove ${option.label}`}
                className="rounded-full p-0.5 text-sccs/60 transition-colors hover:bg-sccs/20 hover:text-sccs"
              >
                <X className="size-3.5" />
              </button>
            </span>
          ))}
          <InputGroupInput
            placeholder={selectedOptions.length === 0 ? placeholder : ""}
            className="min-w-20 text-base"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onFocus={() => setOpen(true)}
          />
        </div>
        {selectedOptions.length > 0 && (
          <InputGroupAddon align="inline-end" className="pt-1.5">
            <InputGroupButton
              size="icon-xs"
              aria-label={`Clear ${allLabel}`}
              onClick={(event) => {
                event.stopPropagation();
                onClear();
              }}
            >
              <X className="size-4" />
            </InputGroupButton>
          </InputGroupAddon>
        )}
        <InputGroupAddon align="inline-end" className="pt-1.5">
          <Tag className="size-5" />
        </InputGroupAddon>
      </InputGroup>

      {open && (
        <div className="absolute inset-x-0 top-[calc(100%+0.5rem)] z-20 max-h-80 animate-in overflow-y-auto rounded-lg border border-border bg-popover py-1 shadow-md ring-1 ring-foreground/10 fade-in-0 zoom-in-95 duration-100">
          <p className="px-3 py-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
            {allLabel}
          </p>
          {filteredOptions.length === 0 ? (
            <p className="px-3 py-2 text-sm text-muted-foreground">
              No results found.
            </p>
          ) : (
            filteredOptions.map((option) => {
              const isSelected = selected.has(option.value);
              return (
                <div
                  key={option.value}
                  role="button"
                  tabIndex={0}
                  onClick={() => onToggle(option.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      onToggle(option.value);
                    }
                  }}
                  className={cn(
                    "flex w-full cursor-pointer items-center gap-3 px-3 py-2.5 text-left text-base transition-colors hover:bg-accent",
                    isSelected && "bg-accent"
                  )}
                >
                  {variant === "checkbox" && (
                    <Checkbox
                      checked={isSelected}
                      tabIndex={-1}
                      className="pointer-events-none size-5"
                    />
                  )}
                  <span className="flex-1 text-foreground">{option.label}</span>
                  {variant === "list" && isSelected && (
                    <Check className="size-4 text-primary" />
                  )}
                  <span className="text-sm text-muted-foreground">
                    ({option.count})
                  </span>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

type NavbarProps = {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  selectedTags: Set<TagValue>;
  onToggleTag: (tag: string) => void;
  onClearTags: () => void;
  selectedAffiliations: Set<SwarthmoreAffiliation>;
  onToggleAffiliation: (affiliation: string) => void;
  onClearAffiliations: () => void;
  ordering: ClubOrdering;
  onOrderingChange: (ordering: ClubOrdering) => void;
  selectedSizes: Set<ClubSize>;
  onToggleSize: (size: string) => void;
  selectedMembershipProcesses: Set<MembershipProcess>;
  onToggleMembershipProcess: (process: string) => void;
  acceptingMembersOnly: boolean;
  onToggleAcceptingMembers: () => void;
  selectedRecruitingCycles: Set<RecruitingCycle>;
  onToggleRecruitingCycle: (cycle: string) => void;
};

export type ClubOrdering = "default" | "alphabetical" | "bookmarks";

const Navbar = ({
  searchQuery,
  onSearchChange,
  selectedTags,
  onToggleTag,
  onClearTags,
  selectedAffiliations,
  onToggleAffiliation,
  onClearAffiliations,
  ordering,
  onOrderingChange,
  selectedSizes,
  onToggleSize,
  selectedMembershipProcesses,
  onToggleMembershipProcess,
  acceptingMembersOnly,
  onToggleAcceptingMembers,
  selectedRecruitingCycles,
  onToggleRecruitingCycle,
}: NavbarProps) => {
  const tagOptions = useMemo<CountOption[]>(
    () =>
      Array.from(getTagCounts(), ([value, count]) => ({
        value,
        label: value,
        count,
      })),
    []
  );

  const affiliationOptions = useMemo<CountOption[]>(
    () =>
      Array.from(getAffiliationCounts(), ([value, count]) => ({
        value,
        label: value,
        count,
      })),
    []
  );

  const sizeOptions = useMemo<CountOption[]>(
    () =>
      Array.from(getSizeCounts(), ([value, count]) => ({
        value,
        label: value,
        count,
      })),
    []
  );

  const membershipProcessOptions = useMemo<CountOption[]>(
    () =>
      Array.from(getMembershipProcessCounts(), ([value, count]) => ({
        value,
        label: value,
        count,
      })),
    []
  );

  const recruitingCycleOptions = useMemo<CountOption[]>(
    () =>
      Array.from(getRecruitingCycleCounts(), ([value, count]) => ({
        value,
        label: value,
        count,
      })),
    []
  );

  const acceptingMembersOptions = useMemo<CountOption[]>(
    () => [
      {
        value: "true",
        label: "Is Accepting Members",
        count: getAcceptingMembersCount(),
      },
    ],
    []
  );

  return (
    <aside className="flex w-full max-w-60 flex-col gap-5">
      <InputGroup className="h-10">
        <InputGroupInput
          placeholder="Search"
          className="text-base"
          value={searchQuery}
          onChange={(event) => onSearchChange(event.target.value)}
        />
        <InputGroupAddon align="inline-end">
          <Search className="size-5" />
        </InputGroupAddon>
      </InputGroup>

      <Separator />

      <FilterSection title="Tags">
        <FilterSearchDropdown
          placeholder="Search for tags"
          allLabel="All Tags"
          options={tagOptions}
          selected={selectedTags}
          onToggle={onToggleTag}
          onClear={onClearTags}
          variant="list"
        />
      </FilterSection>

      <Separator />

      <FilterSection title="Affiliations">
        <FilterSearchDropdown
          placeholder="Search for affiliations"
          allLabel="All Affiliations"
          options={affiliationOptions}
          selected={selectedAffiliations}
          onToggle={onToggleAffiliation}
          onClear={onClearAffiliations}
          variant="checkbox"
        />
      </FilterSection>

      <Separator />

      <FilterSection title="Ordering">
        <Select value={ordering} onValueChange={(value) => onOrderingChange(value as ClubOrdering)}>
          <SelectTrigger className="h-10 w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="default">
              <Star className="size-4" />
              Default
            </SelectItem>
            <SelectItem value="alphabetical">
              <List className="size-4" />
              Alphabetical
            </SelectItem>
            <SelectItem value="bookmarks">
              <Bookmark className="size-4" />
              Bookmarks
            </SelectItem>
          </SelectContent>
        </Select>
      </FilterSection>

      <Separator />

      <FilterSection title="General Membership Process">
        <CheckboxFilterGroup
          legend="General Membership Process"
          options={membershipProcessOptions}
          selected={selectedMembershipProcesses}
          onToggle={onToggleMembershipProcess}
        />
      </FilterSection>

      <Separator />

      <FilterSection title="Size">
        <CheckboxFilterGroup
          legend="Size"
          options={sizeOptions}
          selected={selectedSizes}
          onToggle={onToggleSize}
        />
      </FilterSection>

      <Separator />

      <FilterSection title="Accepting Members">
        <CheckboxFilterGroup
          legend="Accepting Members"
          options={acceptingMembersOptions}
          selected={acceptingMembersOnly ? new Set(["true"]) : new Set()}
          onToggle={onToggleAcceptingMembers}
        />
      </FilterSection>

      <Separator />

      <FilterSection title="Recruiting Cycle">
        <CheckboxFilterGroup
          legend="Recruiting Cycle"
          options={recruitingCycleOptions}
          selected={selectedRecruitingCycles}
          onToggle={onToggleRecruitingCycle}
        />
      </FilterSection>
    </aside>
  );
};

export default Navbar;
