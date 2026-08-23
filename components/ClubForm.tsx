"use client";

import { useActionState } from "react";
import { createClub, type CreateClubState } from "@/app/clubs/new/actions";
import {
  CLUB_SIZES,
  MEMBERSHIP_PROCESSES,
  RECRUITING_CYCLES,
  SWARTHMORE_AFFILIATIONS,
} from "@/lib/clubs";
import { TAGS } from "@/lib/tags";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";

const INITIAL_STATE: CreateClubState = { error: null };

function SelectField({
  name,
  label,
  placeholder,
  options,
}: {
  name: string;
  label: string;
  placeholder: string;
  options: readonly string[];
}) {
  return (
    <Field>
      <FieldLabel htmlFor={name}>{label}</FieldLabel>
      <Select name={name} required>
        <SelectTrigger id={name} className="h-11 w-full">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option} value={option}>
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Field>
  );
}

export default function ClubForm() {
  const [state, formAction, pending] = useActionState(
    createClub,
    INITIAL_STATE
  );

  return (
    <form action={formAction} className="flex flex-col gap-7">
      <Field>
        <FieldLabel htmlFor="club-name">Club name</FieldLabel>
        <Input
          id="club-name"
          name="name"
          required
          minLength={2}
          maxLength={120}
          placeholder="Swarthmore Juggling Collective"
          className="h-11 text-base"
        />
      </Field>

      <Field>
        <FieldLabel htmlFor="club-description">Description</FieldLabel>
        <Textarea
          id="club-description"
          name="description"
          required
          minLength={10}
          maxLength={2000}
          rows={5}
          placeholder="What does your club do? When do you meet? Why should someone show up?"
          className="text-base"
        />
      </Field>

      <FieldSet>
        <FieldLegend>Tags</FieldLegend>
        <p className="text-sm text-muted-foreground">
          Pick every tag that fits; that&#39;s how people find you.
        </p>
        <FieldGroup
          data-slot="checkbox-group"
          className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2"
        >
          {TAGS.map((tag) => (
            <Field key={tag} orientation="horizontal" className="gap-3">
              <Checkbox id={`tag-${tag}`} name="tags" value={tag} className="size-5" />
              <FieldLabel
                htmlFor={`tag-${tag}`}
                className="flex-1 text-base font-normal"
              >
                {tag}
              </FieldLabel>
            </Field>
          ))}
        </FieldGroup>
      </FieldSet>

      <SelectField
        name="affiliation"
        label="Council affiliation"
        placeholder="Select a council"
        options={SWARTHMORE_AFFILIATIONS}
      />
      <SelectField
        name="size"
        label="Club size"
        placeholder="How many members?"
        options={CLUB_SIZES}
      />
      <SelectField
        name="membershipProcess"
        label="Membership process"
        placeholder="How do people join?"
        options={MEMBERSHIP_PROCESSES}
      />
      <SelectField
        name="recruitingCycle"
        label="Recruiting cycle"
        placeholder="When do you recruit?"
        options={RECRUITING_CYCLES}
      />

      <Field>
        <FieldLabel htmlFor="club-meeting">When and where you meet (optional)</FieldLabel>
        <Input
          id="club-meeting"
          name="meetingInfo"
          maxLength={400}
          placeholder="Tuesdays 8pm, Kohlberg 116"
          className="h-11 text-base"
        />
      </Field>
      <Field>
        <FieldLabel htmlFor="club-email">Contact email (optional)</FieldLabel>
        <Input
          id="club-email"
          name="email"
          type="email"
          maxLength={120}
          placeholder="yourclub@sccs.swarthmore.edu"
          className="h-11 text-base"
        />
      </Field>
      <Field>
        <FieldLabel htmlFor="club-instagram">Instagram (optional)</FieldLabel>
        <Input
          id="club-instagram"
          name="instagram"
          maxLength={80}
          placeholder="@yourclub"
          className="h-11 text-base"
        />
      </Field>
      <Field>
        <FieldLabel htmlFor="club-website">Website (optional)</FieldLabel>
        <Input
          id="club-website"
          name="website"
          maxLength={200}
          placeholder="https://"
          className="h-11 text-base"
        />
      </Field>

      <Field orientation="horizontal" className="gap-3">
        <Checkbox
          id="accepting-members"
          name="isAcceptingMembers"
          className="size-5"
        />
        <FieldLabel
          htmlFor="accepting-members"
          className="flex-1 text-base font-normal"
        >
          We&#39;re currently accepting new members
        </FieldLabel>
      </Field>

      {state.error && (
        <p role="alert" className="text-sm font-medium text-destructive">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="inline-flex h-12 items-center justify-center rounded-[3px] bg-sccs-orange px-8 text-base font-semibold text-sccs-ink transition-colors hover:bg-sccs-orange/85 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Adding club..." : "Add club"}
      </button>
    </form>
  );
}
