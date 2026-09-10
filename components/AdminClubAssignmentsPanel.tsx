"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { ExternalLink, Mail, ShieldCheck, UserRound, X } from "lucide-react";
import {
  revokeClubAccess,
  updateClubAccess,
  updateClubVisibility,
} from "@/app/admin/assignments/actions";
import type { AccessActionState } from "@/app/admin/assignments/actions";
import AdminAssignmentSearch from "@/components/AdminAssignmentSearch";

const initialAccessActionState: AccessActionState = {
  error: null,
  message: null,
};

type AssignedUser = {
  id: string;
  name: string | null;
  email: string | null;
  role: "OWNER" | "EDITOR";
  grantedAtLabel: string;
};

type PanelTab = "preview" | "users";

export type AssignmentClub = {
  id: string;
  slug: string;
  name: string;
  visibility: "Hidden" | "Public";
  users: AssignedUser[];
};

function assignmentsHref(query: string, page: number) {
  const params = new URLSearchParams();
  if (query) params.set("q", query);
  if (page > 1) params.set("page", String(page));
  const search = params.toString();
  return search ? `/admin/assignments?${search}` : "/admin/assignments";
}

function hidePreviewChrome(event: React.SyntheticEvent<HTMLIFrameElement>) {
  try {
    const previewDocument = event.currentTarget.contentDocument;
    if (!previewDocument || previewDocument.getElementById("admin-preview-style")) {
      return;
    }
    const style = previewDocument.createElement("style");
    style.id = "admin-preview-style";
    style.textContent = `
      body > header,
      body > footer {
        display: none !important;
      }
    `;
    previewDocument.head.appendChild(style);
  } catch {
    // The preview may have followed an external link, which is not same-origin.
  } finally {
    event.currentTarget.style.opacity = "1";
  }
}

function SubmitButton({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="h-10 rounded-xl bg-sccs-orange px-4 text-sm font-semibold text-sccs-ink disabled:cursor-wait disabled:opacity-60"
    >
      {pending ? "Saving…" : children}
    </button>
  );
}

function RoleForm({ user }: { user: AssignedUser }) {
  const [state, action] = useActionState(
    updateClubAccess,
    initialAccessActionState,
  );
  return (
    <form action={action} className="mt-4 flex flex-wrap items-end gap-3">
      <input type="hidden" name="assignmentId" value={user.id} />
      <label className="min-w-40 flex-1 text-sm font-medium text-foreground">
        Access role
        <select
          name="role"
          defaultValue={user.role}
          className="mt-1 block h-10 w-full rounded-xl border border-border bg-background px-3 text-foreground"
        >
          <option value="OWNER">Owner</option>
          <option value="EDITOR">Editor</option>
        </select>
      </label>
      <SubmitButton>Update role</SubmitButton>
      {(state.error || state.message) && (
        <p
          role={state.error ? "alert" : "status"}
          className={
            state.error
              ? "w-full text-sm text-destructive"
              : "w-full text-sm text-green-700"
          }
        >
          {state.error ?? state.message}
        </p>
      )}
    </form>
  );
}

function RevokeForm({ user }: { user: AssignedUser }) {
  const [state, action, pending] = useActionState(
    revokeClubAccess,
    initialAccessActionState,
  );
  return (
    <form
      action={action}
      className="mt-3"
      onSubmit={(event) => {
        if (
          !window.confirm(
            `Revoke all club access for ${user.name ?? user.email ?? "this user"}?`,
          )
        ) {
          event.preventDefault();
        }
      }}
    >
      <input type="hidden" name="assignmentId" value={user.id} />
      <button
        type="submit"
        disabled={pending}
        className="text-sm font-semibold text-destructive underline decoration-destructive/40 underline-offset-4 disabled:opacity-60"
      >
        {pending ? "Revoking…" : "Revoke access"}
      </button>
      {(state.error || state.message) && (
        <p
          role={state.error ? "alert" : "status"}
          className={
            state.error
              ? "mt-2 text-sm text-destructive"
              : "mt-2 text-sm text-green-700"
          }
        >
          {state.error ?? state.message}
        </p>
      )}
    </form>
  );
}

function VisibilityForm({ club }: { club: AssignmentClub }) {
  const [state, action, pending] = useActionState(
    updateClubVisibility,
    initialAccessActionState,
  );
  const makePublic = club.visibility === "Hidden";

  return (
    <form action={action} className="inline-flex flex-col items-end gap-1">
      <input type="hidden" name="clubId" value={club.id} />
      <input
        type="hidden"
        name="visibility"
        value={makePublic ? "public" : "hidden"}
      />
      <button
        type="submit"
        disabled={pending}
        aria-label={`${makePublic ? "Publish" : "Hide"} ${club.name}`}
        title={`Switch from ${club.visibility.toLowerCase()} to ${makePublic ? "public" : "hidden"}`}
        className={
          club.visibility === "Hidden"
            ? "inline-flex h-8 min-w-24 items-center justify-center gap-2 rounded-full bg-red-600/10 px-3 text-sm font-semibold text-red-700 transition-colors hover:bg-red-600/20 disabled:cursor-wait disabled:opacity-60"
            : "inline-flex h-8 min-w-24 items-center justify-center gap-2 rounded-full bg-green-600/10 px-3 text-sm font-semibold text-green-700 transition-colors hover:bg-green-600/20 disabled:cursor-wait disabled:opacity-60"
        }
      >
        <span
          aria-hidden="true"
          className={
            club.visibility === "Hidden"
              ? "size-2 rounded-full bg-red-600"
              : "size-2 rounded-full bg-green-600"
          }
        />
        {pending ? "Saving…" : club.visibility}
      </button>
      {state.error && (
        <span role="alert" className="max-w-44 text-xs text-destructive">
          {state.error}
        </span>
      )}
    </form>
  );
}

function AccessSection({ club }: { club: AssignmentClub }) {
  return (
    <section className="h-full overflow-y-auto bg-card p-5 sm:p-6">
      <div className="flex items-center gap-2">
        <ShieldCheck className="size-5 text-sccs-ember" />
        <h3 className="font-heading text-lg font-semibold">
          Assigned users ({club.users.length})
        </h3>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        Owners and editors can both update this club page.
      </p>

      {club.users.length === 0 ? (
        <p className="mt-4 rounded-xl border border-dashed border-border p-5 text-muted-foreground">
          This club is unclaimed and has no assigned users.
        </p>
      ) : (
        <ul className="mt-4 space-y-3">
          {club.users.map((user) => (
            <li key={user.id} className="rounded-xl border border-border p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="flex items-center gap-2 font-semibold">
                    <UserRound className="size-4 text-muted-foreground" />
                    {user.name ?? user.email ?? "Unknown SCCS user"}
                  </p>
                  {user.email ? (
                    <a
                      href={`mailto:${user.email}`}
                      className="mt-1 flex items-center gap-2 break-all text-sm text-muted-foreground hover:underline"
                    >
                      <Mail className="size-4 shrink-0" /> {user.email}
                    </a>
                  ) : (
                    <p className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                      <Mail className="size-4 shrink-0" /> No email on file
                    </p>
                  )}
                  <p className="mt-1 text-xs text-muted-foreground">
                    Assigned {user.grantedAtLabel}
                  </p>
                </div>
                <span className="rounded-full bg-sccs-orange/20 px-3 py-1 text-xs font-bold tracking-wide text-sccs-ink">
                  {user.role === "OWNER" ? "Owner" : "Editor"}
                </span>
              </div>
              <RoleForm user={user} />
              <RevokeForm user={user} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default function AdminClubAssignmentsPanel({
  clubs,
  initialQuery,
  resultLabel,
  currentPage,
  totalPages,
  initialTab,
}: {
  clubs: AssignmentClub[];
  initialQuery: string;
  resultLabel: string;
  currentPage: number;
  totalPages: number;
  initialTab: PanelTab;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedClubSnapshot, setSelectedClubSnapshot] =
    useState<AssignmentClub | null>(null);
  const [activeTab, setActiveTab] = useState<PanelTab>(initialTab);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const selectedClubFromResults =
    clubs.find((club) => club.id === selectedId) ?? null;
  const selectedClub =
    selectedClubFromResults ??
    (selectedClubSnapshot?.id === selectedId ? selectedClubSnapshot : null);
  const selectedClubId = selectedClub?.id;

  function selectTab(tab: PanelTab) {
    setActiveTab(tab);
    const secure = window.location.protocol === "https:" ? "; Secure" : "";
    document.cookie = `admin-club-panel-tab=${tab}; Path=/admin; Max-Age=31536000; SameSite=Lax${secure}`;
  }

  useEffect(() => {
    if (!selectedClubId) return;
    closeButtonRef.current?.focus();
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSelectedId(null);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [selectedClubId]);

  return (
    <div
      className={
        selectedClub
          ? "grid h-full min-h-0 lg:grid-cols-[minmax(0,1fr)_minmax(28rem,1fr)] lg:gap-4"
          : "h-full min-h-0"
      }
    >
      <section className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden rounded-2xl border border-border bg-card">
        <div className="shrink-0 border-b border-border p-4">
          <AdminAssignmentSearch initialQuery={initialQuery} />
          <p className="mt-1 min-h-5 text-sm text-muted-foreground" aria-live="polite">
            {resultLabel}
          </p>
        </div>
        <div className="min-h-0 flex-1 overflow-auto">
          <table className="w-full border-collapse text-left">
            <thead className="sticky top-0 z-10 bg-muted text-sm text-muted-foreground shadow-[0_1px_0_var(--border)]">
              <tr>
                <th className="px-5 py-3 font-semibold">Club</th>
                <th className="px-5 py-3 text-right font-semibold">Visibility</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {clubs.length === 0 && (
                <tr>
                  <td colSpan={2} className="px-5 py-10 text-center text-muted-foreground">
                    Try a different search.
                  </td>
                </tr>
              )}
              {clubs.map((club) => {
                const selected = club.id === selectedId;
                return (
                  <tr key={club.id} className={selected ? "bg-muted/65" : "hover:bg-muted/35"}>
                    <td className="px-5 py-4">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedId(club.id);
                          setSelectedClubSnapshot(club);
                        }}
                        className="block w-full text-left"
                        aria-expanded={selected}
                        aria-controls="club-preview-panel"
                      >
                        <span className="block font-heading font-semibold text-foreground hover:underline">
                          {club.name}
                        </span>
                        <span className="mt-1 block text-xs text-muted-foreground">
                          {club.users.length === 0
                            ? "Unclaimed"
                            : `${club.users.length} assigned ${club.users.length === 1 ? "user" : "users"}`}
                        </span>
                      </button>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <VisibilityForm club={club} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <nav
            className="flex shrink-0 items-center justify-between gap-2 border-t border-border bg-card p-3"
            aria-label="Club assignment pages"
          >
            {currentPage > 1 ? (
              <Link
                href={assignmentsHref(initialQuery, currentPage - 1)}
                className="inline-flex h-9 items-center rounded-xl border border-border px-3 text-sm font-semibold hover:bg-muted"
              >
                ← Previous
              </Link>
            ) : (
              <span className="text-sm text-muted-foreground opacity-50">
                ← Previous
              </span>
            )}
            <span className="text-xs font-medium text-muted-foreground">
              {currentPage} / {totalPages}
            </span>
            {currentPage < totalPages ? (
              <Link
                href={assignmentsHref(initialQuery, currentPage + 1)}
                className="inline-flex h-9 items-center rounded-xl border border-border px-3 text-sm font-semibold hover:bg-muted"
              >
                Next →
              </Link>
            ) : (
              <span className="text-sm text-muted-foreground opacity-50">
                Next →
              </span>
            )}
          </nav>
        )}
      </section>

      {selectedClub && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 bg-sccs-ink/45 lg:hidden"
            onClick={() => setSelectedId(null)}
            aria-label="Close club preview"
          />
          <aside
            id="club-preview-panel"
            aria-label={`${selectedClub.name} preview and access`}
            className="fixed inset-y-0 right-0 z-50 flex w-full max-w-xl animate-in flex-col overflow-hidden border-l border-border bg-background shadow-2xl duration-300 slide-in-from-right-8 lg:relative lg:inset-auto lg:z-0 lg:h-full lg:max-w-none lg:rounded-2xl lg:border lg:shadow-lg"
          >
            <header className="z-10 flex shrink-0 items-center justify-between gap-3 border-b border-border bg-card px-3 py-3 sm:px-4">
              <div
                role="tablist"
                aria-label="Club details"
                className="flex min-w-0 items-center rounded-xl bg-muted p-1"
              >
                <button
                  id="club-preview-tab"
                  type="button"
                  role="tab"
                  aria-selected={activeTab === "preview"}
                  aria-controls="club-preview-content"
                  onClick={() => selectTab("preview")}
                  className={
                    activeTab === "preview"
                      ? "h-9 rounded-lg bg-card px-4 text-sm font-semibold text-foreground shadow-sm"
                      : "h-9 rounded-lg px-4 text-sm font-medium text-muted-foreground hover:text-foreground"
                  }
                >
                  Preview
                </button>
                <button
                  id="club-users-tab"
                  type="button"
                  role="tab"
                  aria-selected={activeTab === "users"}
                  aria-controls="club-users-content"
                  onClick={() => selectTab("users")}
                  className={
                    activeTab === "users"
                      ? "h-9 rounded-lg bg-card px-4 text-sm font-semibold text-foreground shadow-sm"
                      : "h-9 rounded-lg px-4 text-sm font-medium text-muted-foreground hover:text-foreground"
                  }
                >
                  Users ({selectedClub.users.length})
                </button>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <Link
                  href={`/clubs/${selectedClub.slug}`}
                  target="_blank"
                  className="grid size-10 place-items-center rounded-full hover:bg-muted"
                  aria-label={`Open ${selectedClub.name} in a new tab`}
                >
                  <ExternalLink className="size-4.5" />
                </Link>
                <button
                  ref={closeButtonRef}
                  type="button"
                  onClick={() => setSelectedId(null)}
                  className="grid size-10 place-items-center rounded-full hover:bg-muted"
                  aria-label="Close club panel"
                >
                  <X className="size-5" />
                </button>
              </div>
            </header>

            <section
              id="club-preview-content"
              role="tabpanel"
              aria-labelledby="club-preview-tab"
              className={
                activeTab === "preview"
                  ? "flex min-h-0 flex-1 flex-col bg-muted/50 p-3 sm:p-4"
                  : "hidden"
              }
            >
              <iframe
                key={selectedClub.slug}
                src={`/clubs/${selectedClub.slug}`}
                title={`${selectedClub.name} live page preview`}
                onLoad={hidePreviewChrome}
                className="min-h-48 w-full flex-1 rounded-xl border border-border bg-background opacity-0 shadow-sm transition-opacity duration-200"
              />
            </section>

            <div
              id="club-users-content"
              role="tabpanel"
              aria-labelledby="club-users-tab"
              className={activeTab === "users" ? "min-h-0 flex-1" : "hidden"}
            >
              <AccessSection club={selectedClub} />
            </div>
          </aside>
        </>
      )}
    </div>
  );
}
