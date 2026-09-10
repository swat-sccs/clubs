"use client";

import { useActionState } from "react";
import type { ClaimRequestState } from "@/app/clubs/[slug]/claim/actions";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field, FieldLabel } from "@/components/ui/field";

const INITIAL_STATE: ClaimRequestState = { error: null };

export default function ClaimClubForm({
  action,
}: {
  action: (
    previous: ClaimRequestState,
    formData: FormData,
  ) => Promise<ClaimRequestState>;
}) {
  const [state, formAction, pending] = useActionState(action, INITIAL_STATE);
  return (
    <form action={formAction} className="mt-8 flex flex-col gap-6">
      <Field>
        <FieldLabel htmlFor="claim-role">Your role in the club</FieldLabel>
        <Input
          id="claim-role"
          name="role"
          minLength={2}
          maxLength={120}
          required
          placeholder="President, treasurer, organizer…"
          className="h-11 text-base"
        />
      </Field>
      <Field>
        <FieldLabel htmlFor="claim-explanation">Why should you manage this page?</FieldLabel>
        <Textarea
          id="claim-explanation"
          name="explanation"
          minLength={10}
          maxLength={2000}
          rows={6}
          required
          placeholder="Tell SCCS how you are connected to the club."
          className="text-base"
        />
      </Field>
      {state.error && (
        <p role="alert" className="text-sm font-medium text-destructive">
          {state.error}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="inline-flex h-12 items-center justify-center rounded-xl bg-sccs-orange px-8 font-semibold text-sccs-ink disabled:opacity-60"
      >
        {pending ? "Submitting..." : "Submit claim for review"}
      </button>
    </form>
  );
}
