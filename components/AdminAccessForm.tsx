"use client";

import { useActionState } from "react";
import { LoaderCircle, ShieldCheck, ShieldMinus } from "lucide-react";
import {
  updateAppAdminAccess,
  type AdminAccessState,
} from "@/app/admin/users/actions";

const INITIAL_STATE: AdminAccessState = { error: null, message: null };

export default function AdminAccessForm({
  userId,
  isAppAdmin,
}: {
  userId: string;
  isAppAdmin: boolean;
}) {
  const [state, action, pending] = useActionState(
    updateAppAdminAccess,
    INITIAL_STATE,
  );

  return (
    <form action={action} className="flex flex-col items-start gap-2 sm:items-end">
      <input type="hidden" name="userId" value={userId} />
      <input type="hidden" name="isAppAdmin" value={String(!isAppAdmin)} />
      <button
        type="submit"
        disabled={pending}
        className={
          isAppAdmin
            ? "inline-flex h-9 items-center gap-2 rounded-xl border border-destructive/30 px-3 text-sm font-semibold text-destructive hover:bg-destructive/5 disabled:opacity-60"
            : "inline-flex h-9 items-center gap-2 rounded-xl bg-sccs px-3 text-sm font-semibold text-white hover:bg-sccs/90 disabled:opacity-60"
        }
      >
        {pending ? (
          <LoaderCircle className="size-4 animate-spin" />
        ) : isAppAdmin ? (
          <ShieldMinus className="size-4" />
        ) : (
          <ShieldCheck className="size-4" />
        )}
        {pending
          ? "Saving…"
          : isAppAdmin
            ? "Remove admin grant"
            : "Make admin"}
      </button>
      {(state.error || state.message) && (
        <p
          role={state.error ? "alert" : "status"}
          className={
            state.error
              ? "max-w-sm text-sm text-destructive"
              : "max-w-sm text-sm text-muted-foreground"
          }
        >
          {state.error ?? state.message}
        </p>
      )}
    </form>
  );
}
