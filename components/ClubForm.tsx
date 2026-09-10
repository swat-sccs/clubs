"use client";

import Link from "next/link";
import { useActionState, useEffect, useState } from "react";
import type { ClubFormState } from "@/app/clubs/new/actions";
import {
  CLUB_SIZES,
  MEMBERSHIP_PROCESSES,
  RECRUITING_CYCLES,
  type Club,
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

const INITIAL_STATE: ClubFormState = { error: null };
const SIMILAR_CLUB_DEBOUNCE_MS = 300;
type SimilarClub = NonNullable<ClubFormState["similarClubs"]>[number];

function SelectField({
  name,
  label,
  placeholder,
  options,
  initialValue,
}: {
  name: string;
  label: string;
  placeholder: string;
  options: readonly string[];
  initialValue?: string;
}) {
  return (
    <Field>
      <FieldLabel htmlFor={name}>{label}</FieldLabel>
      <Select name={name} required defaultValue={initialValue}>
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

export default function ClubForm({
  action,
  club,
}: {
  action: (
    previous: ClubFormState,
    formData: FormData,
  ) => Promise<ClubFormState>;
  club?: Club;
}) {
  const [state, formAction, pending] = useActionState(action, INITIAL_STATE);
  const [dismissedCheck, setDismissedCheck] = useState<string | null>(null);
  const [name, setName] = useState(club?.name ?? "");
  const [liveSuggestions, setLiveSuggestions] = useState<SimilarClub[]>([]);
  const [dismissedLiveName, setDismissedLiveName] = useState<string | null>(null);
  const normalizedLiveName = name.trim().toLowerCase();
  const showSimilarClubs =
    !club &&
    Boolean(state.similarClubs?.length) &&
    state.checkedName !== dismissedCheck;
  const showLiveSuggestions =
    !club &&
    liveSuggestions.length > 0 &&
    normalizedLiveName !== dismissedLiveName &&
    !showSimilarClubs;

  useEffect(() => {
    if (club || normalizedLiveName.replaceAll(" ", "").length < 3) return;

    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      try {
        const response = await fetch(
          `/api/clubs/similar?q=${encodeURIComponent(name.trim())}`,
          { cache: "no-store", signal: controller.signal },
        );
        if (!response.ok) return;
        const result = (await response.json()) as { clubs?: SimilarClub[] };
        setLiveSuggestions(result.clubs ?? []);
      } catch (error) {
        if (!(error instanceof DOMException && error.name === "AbortError")) {
          console.error("Unable to check for similar clubs", error);
        }
      }
    }, SIMILAR_CLUB_DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [club, name, normalizedLiveName]);

  return (
    <form action={formAction} className="flex flex-col gap-7">
      <Field className="relative">
        <FieldLabel htmlFor="club-name">Club name</FieldLabel>
        <Input
          id="club-name"
          name="name"
          required
          minLength={2}
          maxLength={120}
          value={name}
          onChange={(event) => {
            setName(event.target.value);
            setLiveSuggestions([]);
            setDismissedLiveName(null);
          }}
          placeholder="Swarthmore Juggling Collective"
          className="h-11 text-base"
        />
        {showLiveSuggestions && (
          <div
            role="dialog"
            aria-label="Similar existing clubs"
            className="absolute inset-x-0 top-full z-30 mt-2 max-h-96 overflow-y-auto rounded-2xl border border-border bg-background p-4 shadow-xl"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-heading text-lg font-bold text-foreground">
                  This club might already exist
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Preview these pages and claim yours instead of creating a duplicate.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setDismissedLiveName(normalizedLiveName)}
                className="shrink-0 rounded-xl border border-border px-3 py-1.5 text-sm font-medium text-foreground hover:bg-muted"
              >
                Dismiss
              </button>
            </div>
            <div className="mt-4 flex flex-col gap-3">
              {liveSuggestions.map((similarClub) => (
                <article
                  key={similarClub.slug}
                  className="rounded-xl border border-border bg-card p-4"
                >
                  <h3 className="font-heading font-semibold text-foreground">
                    {similarClub.name}
                  </h3>
                  <p className="mt-1 line-clamp-3 text-sm leading-6 text-muted-foreground">
                    {similarClub.description}
                  </p>
                  <Link
                    href={`/clubs/${similarClub.slug}/claim`}
                    className="mt-3 inline-flex h-9 items-center rounded-xl bg-sccs-orange px-4 text-sm font-semibold text-sccs-ink"
                  >
                    Claim this page
                  </Link>
                </article>
              ))}
            </div>
          </div>
        )}
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
          defaultValue={club?.description}
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
              <Checkbox
                id={`tag-${tag}`}
                name="tags"
                value={tag}
                defaultChecked={club?.tags.includes(tag)}
                className="size-5"
              />
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
        name="size"
        label="Club size"
        placeholder="How many members?"
        options={CLUB_SIZES}
        initialValue={club?.size}
      />
      <SelectField
        name="membershipProcess"
        label="Membership process"
        placeholder="How do people join?"
        options={MEMBERSHIP_PROCESSES}
        initialValue={club?.membershipProcess}
      />
      <SelectField
        name="recruitingCycle"
        label="Recruiting cycle"
        placeholder="When do you recruit?"
        options={RECRUITING_CYCLES}
        initialValue={club?.recruitingCycle}
      />

      <Field>
        <FieldLabel htmlFor="club-meeting">When and where you meet (optional)</FieldLabel>
        <Input
          id="club-meeting"
          name="meetingInfo"
          maxLength={400}
          defaultValue={club?.meetingInfo ?? undefined}
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
          defaultValue={club?.email ?? undefined}
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
          defaultValue={club?.instagram ?? undefined}
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
          defaultValue={club?.website ?? undefined}
          placeholder="https://"
          className="h-11 text-base"
        />
      </Field>

      <Field orientation="horizontal" className="gap-3">
        <Checkbox
          id="accepting-members"
          name="isAcceptingMembers"
          defaultChecked={club?.isAcceptingMembers}
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

      {showSimilarClubs && state.similarClubs && (
        <div
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="similar-clubs-title"
          aria-describedby="similar-clubs-description"
          className="fixed inset-0 z-100 flex items-center justify-center bg-sccs-ink/45 p-4 backdrop-blur-sm"
        >
          <div className="w-full max-w-lg rounded-2xl border border-border bg-background p-6 shadow-2xl sm:p-8">
            <p className="text-sm font-semibold tracking-[0.14em] text-sccs-ember uppercase">
              Possible duplicate
            </p>
            <h2
              id="similar-clubs-title"
              className="mt-2 font-heading text-2xl font-bold text-foreground"
            >
              Is your club already listed?
            </h2>
            <p
              id="similar-clubs-description"
              className="mt-2 leading-7 text-muted-foreground"
            >
              Claim an existing page to avoid creating another listing for the
              same organization.
            </p>
            <div className="mt-5 flex flex-col gap-3">
              {state.similarClubs.map((similarClub) => (
                <div
                  key={similarClub.slug}
                  className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-heading font-semibold text-foreground">
                      {similarClub.name}
                    </p>
                    <p className="mt-1 line-clamp-3 text-sm leading-6 text-muted-foreground">
                      {similarClub.description}
                    </p>
                  </div>
                  <Link
                    href={`/clubs/${similarClub.slug}/claim`}
                    className="inline-flex h-10 shrink-0 items-center justify-center rounded-xl bg-sccs-orange px-4 font-semibold text-sccs-ink"
                  >
                    Claim this page
                  </Link>
                </div>
              ))}
            </div>
            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => {
                  setDismissedCheck(state.checkedName ?? null);
                  document.getElementById("club-name")?.focus();
                }}
                className="h-11 rounded-xl border border-border px-5 font-medium text-foreground hover:bg-muted"
              >
                Edit the club name
              </button>
              {!state.exactMatch && (
                <button
                  type="submit"
                  name="confirmDistinct"
                  value="true"
                  disabled={pending}
                  className="h-11 rounded-xl bg-sccs px-5 font-semibold text-white hover:bg-sccs/90 disabled:opacity-60"
                >
                  No, create a separate club
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <button
        type="submit"
        disabled={pending}
        className="inline-flex h-12 items-center justify-center rounded-xl bg-sccs-orange px-8 text-base font-semibold text-sccs-ink transition-colors hover:bg-sccs-orange/85 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending
          ? club
            ? "Saving..."
            : "Submitting..."
          : club
            ? "Save changes"
            : "Submit for review"}
      </button>
    </form>
  );
}
