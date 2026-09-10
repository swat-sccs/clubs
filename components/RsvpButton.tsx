"use client";

import { useActionState } from "react";
import { Check, Users } from "lucide-react";
import { rsvpToPost, type RsvpState } from "@/app/feed/actions";
import { cn } from "@/lib/utils";

export default function RsvpButton({
  postId,
  count,
  rsvped,
}: {
  postId: string;
  count: number;
  rsvped: boolean;
}) {
  const initialState: RsvpState = { count, rsvped, error: null };
  const action = rsvpToPost.bind(null, postId);
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <div>
      <form action={formAction}>
        <button
          type="submit"
          disabled={pending || state.rsvped}
          aria-pressed={state.rsvped}
          className={cn(
            "inline-flex min-h-11 items-center gap-2 rounded-xl px-4 font-semibold transition-colors disabled:cursor-default",
            state.rsvped
              ? "bg-green-600/10 text-green-800"
              : "bg-sccs-orange text-sccs-ink hover:bg-sccs-orange/85 disabled:opacity-70",
          )}
        >
          {state.rsvped ? <Check className="size-5" /> : <Users className="size-5" />}
          {pending ? "Saving…" : state.rsvped ? "Going" : "RSVP"}
          <span className="rounded-full bg-white/65 px-2 py-0.5 text-sm tabular-nums">
            {state.count}
          </span>
        </button>
      </form>
      {state.error && (
        <p role="alert" className="mt-2 text-sm font-medium text-destructive">
          {state.error}
        </p>
      )}
    </div>
  );
}
