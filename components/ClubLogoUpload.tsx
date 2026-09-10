"use client";

import { useActionState } from "react";
import { Camera, LoaderCircle } from "lucide-react";
import {
  updateClubLogo,
  type ClubLogoState,
} from "@/app/clubs/[slug]/edit/actions";
import ClubAvatar from "@/components/ClubAvatar";
import { cn } from "@/lib/utils";

const INITIAL_STATE: ClubLogoState = { error: null, uploaded: false };

export default function ClubLogoUpload({
  id,
  slug,
  name,
  hasLogo,
  className,
}: {
  id: string;
  slug: string;
  name: string;
  hasLogo: boolean;
  className?: string;
}) {
  const action = updateClubLogo.bind(null, slug);
  const [state, formAction, pending] = useActionState(action, INITIAL_STATE);

  return (
    <div className="shrink-0">
      <div className="relative w-fit">
        <ClubAvatar
          id={id}
          name={name}
          hasLogo={hasLogo || state.uploaded}
          className={className}
        />
        <form action={formAction}>
          <label
            title={hasLogo ? "Replace club logo" : "Upload club logo"}
            className={cn(
              "absolute -bottom-1 -right-1 flex size-8 cursor-pointer items-center justify-center rounded-full border-2 border-background bg-sccs-orange text-sccs-ink shadow-md transition-transform hover:scale-105",
              pending && "pointer-events-none opacity-70",
            )}
          >
            {pending ? (
              <LoaderCircle className="size-4 animate-spin" />
            ) : (
              <Camera className="size-4" />
            )}
            <span className="sr-only">
              {hasLogo ? "Replace club logo" : "Upload club logo"}
            </span>
            <input
              type="file"
              name="logo"
              accept="image/jpeg,image/png,image/webp,image/gif"
              disabled={pending}
              className="sr-only"
              onChange={(event) => {
                if (event.currentTarget.files?.length) {
                  event.currentTarget.form?.requestSubmit();
                }
              }}
            />
          </label>
        </form>
      </div>
      {state.error && (
        <p role="alert" className="mt-2 max-w-44 text-xs font-medium text-destructive">
          {state.error}
        </p>
      )}
      {state.uploaded && !state.error && (
        <p aria-live="polite" className="sr-only">Club logo uploaded.</p>
      )}
    </div>
  );
}
