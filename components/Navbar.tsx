"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Search, Tag } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";

const MEMBERSHIP_PROCESS_OPTIONS = [
  "Open Membership",
  "Tryout Required",
  "Audition Required",
  "Application Required",
  "Application and Interview Required",
];

const SIZE_OPTIONS = [
  "less than 20 members",
  "20 to 50 members",
  "50 to 100 members",
  "more than 100",
];

const ACCEPTING_MEMBERS_OPTIONS = ["Is Accepting Members"];

const RECRUITING_CYCLE_OPTIONS = [
  "Unknown",
  "Fall Semester",
  "Spring Semester",
  "Both Semesters",
  "Open",
];

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
}: {
  legend: string;
  options: string[];
}) {
  return (
    <FieldSet>
      <FieldLegend variant="label" className="sr-only">
        {legend}
      </FieldLegend>
      <FieldGroup data-slot="checkbox-group">
        {options.map((option) => {
          const id = `${slugify(legend)}-${slugify(option)}`;
          return (
            <Field key={id} orientation="horizontal" className="gap-3">
              <Checkbox id={id} className="size-5" />
              <FieldLabel htmlFor={id} className="text-base font-normal">
                {option}
              </FieldLabel>
            </Field>
          );
        })}
      </FieldGroup>
    </FieldSet>
  );
}

const Navbar = () => {
  return (
    <aside className="flex w-full max-w-60 flex-col gap-5">
      <InputGroup className="h-10">
        <InputGroupInput placeholder="Search" className="text-base" />
        <InputGroupAddon align="inline-end">
          <Search className="size-5" />
        </InputGroupAddon>
      </InputGroup>

      <Separator />

      <FilterSection title="Tags">
        <InputGroup className="h-10">
          <InputGroupInput placeholder="Search for tags" className="text-base" />
          <InputGroupAddon align="inline-end">
            <Tag className="size-5" />
          </InputGroupAddon>
        </InputGroup>
      </FilterSection>

      <Separator />

      <FilterSection title="Affiliations">
        <InputGroup className="h-10">
          <InputGroupInput
            placeholder="Search for affiliations"
            className="text-base"
          />
          <InputGroupAddon align="inline-end">
            <Tag className="size-5" />
          </InputGroupAddon>
        </InputGroup>
      </FilterSection>

      <Separator />

      <FilterSection title="General Membership Process">
        <CheckboxFilterGroup
          legend="General Membership Process"
          options={MEMBERSHIP_PROCESS_OPTIONS}
        />
      </FilterSection>

      <Separator />

      <FilterSection title="Size">
        <CheckboxFilterGroup legend="Size" options={SIZE_OPTIONS} />
      </FilterSection>

      <Separator />

      <FilterSection title="Accepting Members">
        <CheckboxFilterGroup
          legend="Accepting Members"
          options={ACCEPTING_MEMBERS_OPTIONS}
        />
      </FilterSection>

      <Separator />

      <FilterSection title="Recruiting Cycle">
        <CheckboxFilterGroup
          legend="Recruiting Cycle"
          options={RECRUITING_CYCLE_OPTIONS}
        />
      </FilterSection>
    </aside>
  );
};

export default Navbar;
