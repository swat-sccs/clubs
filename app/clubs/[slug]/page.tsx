import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  AtSign,
  CalendarDays,
  CheckCircle2,
  Clock,
  ExternalLink,
  Mail,
  MapPin,
  Pencil,
  ShieldCheck,
  Users,
  XCircle,
} from "lucide-react";
import ClubAvatar from "@/components/ClubAvatar";
import ClubLogoUpload from "@/components/ClubLogoUpload";
import FollowButton from "@/components/FollowButton";
import { auth } from "@/lib/auth";
import { getClubBySlug } from "@/lib/data";
import { prisma } from "@/lib/db";
import { instagramHref, websiteHref } from "@/lib/contact";
import {
  campusNow,
  formatCompactEventDate,
  formatEventTime,
} from "@/lib/events";

export const dynamic = "force-dynamic";

export async function generateMetadata(
  props: PageProps<"/clubs/[slug]">,
): Promise<Metadata> {
  const { slug } = await props.params;
  const club = await getClubBySlug(slug);
  if (!club) return { title: "Club not found | Swat Clubs" };
  return {
    title: `${club.name} | Swat Clubs`,
    description: club.description,
  };
}

export default async function ClubPage(props: PageProps<"/clubs/[slug]">) {
  const { slug } = await props.params;
  const session = await auth();
  const access = session?.user?.id
    ? await prisma.club.findUnique({
        where: { slug },
        select: {
          editors: {
            where: { userId: session.user.id },
            select: { id: true },
            take: 1,
          },
          claimRequests: {
            where: { requesterId: session.user.id, status: "PENDING" },
            select: { id: true },
            take: 1,
          },
          followers: {
            where: { userId: session.user.id },
            select: { id: true },
            take: 1,
          },
        },
      })
    : null;
  const isAdmin = session?.user.isAdmin ?? false;
  const isAssignedEditor = Boolean(access?.editors.length);
  const club = await getClubBySlug(slug, {
    includeHidden: isAdmin || isAssignedEditor,
  });
  if (!club) notFound();

  const canEdit = isAdmin || isAssignedEditor;
  const claimPending = Boolean(access?.claimRequests.length);
  const now = campusNow();
  const upcomingEvents = await prisma.clubPost.findMany({
    where: {
      clubId: club.id,
      moderationStatus: "PUBLISHED",
      OR: [
        { eventDate: { gt: now.date } },
        { eventDate: now.date, eventTime: { gte: now.time } },
      ],
    },
    orderBy: [{ eventDate: "asc" }, { eventTime: "asc" }],
    take: 3,
    select: {
      id: true,
      title: true,
      eventDate: true,
      eventTime: true,
      location: true,
    },
  });

  type ContactItem = {
    key: string;
    label: string;
    value: string;
    href?: string;
    icon: typeof Clock;
    external?: boolean;
  };

  const contacts: ContactItem[] = [];
  if (club.meetingInfo) {
    contacts.push({
      key: "meeting",
      label: "When & where",
      value: club.meetingInfo,
      icon: Clock,
    });
  }
  if (club.email) {
    contacts.push({
      key: "email",
      label: "Email",
      href: `mailto:${club.email}`,
      value: club.email,
      icon: Mail,
    });
  }
  if (club.instagram) {
    contacts.push({
      key: "instagram",
      label: "Instagram",
      href: instagramHref(club.instagram),
      value: club.instagram.startsWith("http")
        ? club.instagram
        : `@${club.instagram.replace(/^@/, "")}`,
      icon: AtSign,
      external: true,
    });
  }
  if (club.website) {
    contacts.push({
      key: "website",
      label: "Website",
      href: websiteHref(club.website),
      value: club.website.replace(/^https?:\/\//i, ""),
      icon: ExternalLink,
      external: true,
    });
  }

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:px-6 lg:px-8">
      <p className="animate-fade-rise text-sm font-medium text-muted-foreground">
        <Link
          href="/clubs"
          className="underline-offset-4 transition-colors hover:text-foreground hover:underline"
        >
          ← All clubs
        </Link>
      </p>

      <div className="mt-6 grid gap-10 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-start">
      <div className="min-w-0">
      <div className="flex animate-fade-rise items-start gap-4 animation-delay-100">
        {canEdit ? (
          <ClubLogoUpload
            id={club.id}
            slug={slug}
            name={club.name}
            hasLogo={club.hasLogo}
            className="size-16 text-2xl"
          />
        ) : (
          <ClubAvatar
            id={club.id}
            name={club.name}
            hasLogo={club.hasLogo}
            className="size-16 text-2xl"
          />
        )}
        <div className="min-w-0">
          <h1 className="font-heading text-3xl font-bold text-foreground md:text-4xl [text-wrap:balance]">
            {club.name}
          </h1>
        </div>
      </div>

      <div className="mt-5 flex animate-fade-rise flex-wrap gap-2 animation-delay-100">
        {club.tags.map((tag) => (
          <Link
            key={tag}
            href={`/clubs?tags=${encodeURIComponent(tag)}`}
            className="rounded-full bg-sccs/8 px-3 py-1 text-sm font-medium text-sccs transition-colors hover:bg-sccs/15"
          >
            {tag}
          </Link>
        ))}
      </div>

      <div className="mt-6 flex animate-fade-rise flex-wrap gap-2 animation-delay-100">
        <FollowButton
          clubId={club.id}
          initialFollowing={Boolean(access?.followers.length)}
          isAuthenticated={Boolean(session?.user?.id)}
          nextPath={`/clubs/${slug}`}
        />
        {canEdit && (
          <Link
            href={`/clubs/${slug}/edit`}
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-sccs-orange px-4 font-semibold text-sccs-ink"
          >
            <Pencil className="size-4" /> Edit club page
          </Link>
        )}
        {isAdmin && !isAssignedEditor && (
          <Link
            href={`/clubs/${slug}/claim`}
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-foreground px-4 font-medium text-foreground hover:bg-foreground hover:text-background"
          >
            <ShieldCheck className="size-4" /> Claim as owner
          </Link>
        )}
        {!canEdit && claimPending && (
          <span className="inline-flex h-10 items-center gap-2 rounded-xl border border-border px-4 text-sm font-medium text-muted-foreground">
            <ShieldCheck className="size-4" /> Claim awaiting review
          </span>
        )}
        {!canEdit && !claimPending && (
          <Link
            href={`/clubs/${slug}/claim`}
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-foreground px-4 font-medium text-foreground hover:bg-foreground hover:text-background"
          >
            <ShieldCheck className="size-4" /> Claim this club
          </Link>
        )}
      </div>

      <p className="mt-8 animate-fade-rise text-lg leading-[1.7] text-foreground/85 animation-delay-200">
        {club.description}
      </p>

      <dl className="mt-10 grid animate-fade-rise grid-cols-1 gap-x-8 gap-y-6 border-t border-border pt-8 animation-delay-200 sm:grid-cols-2">
        <div>
          <dt className="text-sm font-medium tracking-wide text-muted-foreground uppercase">
            Size
          </dt>
          <dd className="mt-1 flex items-center gap-1.5 text-foreground">
            <Users className="size-4 text-muted-foreground" />
            {club.size}
          </dd>
        </div>
        <div>
          <dt className="text-sm font-medium tracking-wide text-muted-foreground uppercase">
            Membership
          </dt>
          <dd className="mt-1 text-foreground">{club.membershipProcess}</dd>
        </div>
        <div>
          <dt className="text-sm font-medium tracking-wide text-muted-foreground uppercase">
            Recruiting
          </dt>
          <dd className="mt-1 text-foreground">{club.recruitingCycle}</dd>
        </div>
        <div>
          <dt className="text-sm font-medium tracking-wide text-muted-foreground uppercase">
            Status
          </dt>
          <dd className="mt-1">
            {club.isAcceptingMembers ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-green-600/10 px-2.5 py-0.5 text-sm font-medium text-green-700">
                <CheckCircle2 className="size-4" />
                Taking members
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-red-600/8 px-2.5 py-0.5 text-sm font-medium text-red-700/80">
                <XCircle className="size-4" />
                Not taking members
              </span>
            )}
          </dd>
        </div>
      </dl>

      <section className="mt-10 animate-fade-rise border-t border-border pt-8 animation-delay-300">
        <h2 className="font-heading text-2xl font-semibold text-foreground">
          How to get involved
        </h2>
        {contacts.length === 0 ? (
          <p className="mt-3 leading-[1.6] text-muted-foreground">
            No meeting time or contact is listed yet. If you run this club, you
            can <Link href={`/clubs/${slug}/claim`} className="font-medium text-foreground underline">claim its page</Link> and request edit access.
          </p>
        ) : (
          <ul className="mt-4 flex flex-col gap-4">
            {contacts.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.key} className="flex items-start gap-3">
                  <Icon className="mt-0.5 size-5 shrink-0 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium tracking-wide text-muted-foreground uppercase">
                      {item.label}
                    </p>
                    {item.href ? (
                      <a
                        href={item.href}
                        className="font-medium text-sccs underline decoration-sccs-orange/50 decoration-2 underline-offset-4 hover:decoration-sccs-orange"
                        {...(item.external
                          ? { target: "_blank", rel: "noreferrer" }
                          : {})}
                      >
                        {item.value}
                      </a>
                    ) : (
                      <p className="text-foreground">{item.value}</p>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
      </div>

      <aside className="animate-fade-rise animation-delay-300 lg:sticky lg:top-28">
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <CalendarDays className="size-5 text-sccs" />
            <h2 className="font-heading text-lg font-bold text-foreground">
              Upcoming events
            </h2>
          </div>
          {upcomingEvents.length === 0 ? (
            <p className="mt-4 text-sm leading-6 text-muted-foreground">
              This club has no upcoming events posted yet.
            </p>
          ) : (
            <ol className="mt-4 divide-y divide-border">
              {upcomingEvents.map((event) => (
                <li key={event.id} className="py-4 first:pt-0 last:pb-0">
                  <Link
                    href={`/posts/${event.id}`}
                    className="group block rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
                  >
                    <h3 className="font-heading font-semibold leading-snug text-foreground group-hover:underline">
                      {event.title}
                    </h3>
                    <p className="mt-2 flex items-center gap-1.5 text-sm font-medium text-sccs">
                      <Clock className="size-3.5" />
                      {formatCompactEventDate(event.eventDate)} · {formatEventTime(event.eventTime)}
                    </p>
                    <p className="mt-1 flex items-start gap-1.5 text-sm text-muted-foreground">
                      <MapPin className="mt-0.5 size-3.5 shrink-0" />
                      <span className="line-clamp-2">{event.location}</span>
                    </p>
                  </Link>
                </li>
              ))}
            </ol>
          )}
          <Link
            href="/feed"
            className="mt-5 inline-flex text-sm font-semibold text-sccs underline decoration-sccs-orange/60 decoration-2 underline-offset-4"
          >
            View full feed →
          </Link>
        </div>
      </aside>
      </div>
    </main>
  );
}
