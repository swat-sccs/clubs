import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  AtSign,
  CheckCircle2,
  Clock,
  ExternalLink,
  Mail,
  Users,
  XCircle,
} from "lucide-react";
import ClubMonogram from "@/components/ClubMonogram";
import { getClubBySlug } from "@/lib/data";
import { instagramHref, websiteHref } from "@/lib/contact";

export const dynamic = "force-dynamic";

export async function generateMetadata(
  props: PageProps<"/clubs/[slug]">
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
  const club = await getClubBySlug(slug);
  if (!club) notFound();

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
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:px-6 lg:px-8">
      <p className="animate-fade-rise text-sm font-medium text-muted-foreground">
        <Link
          href="/clubs"
          className="underline-offset-4 transition-colors hover:text-foreground hover:underline"
        >
          ← All clubs
        </Link>
      </p>

      <div className="mt-6 flex animate-fade-rise items-start gap-4 animation-delay-100">
        <ClubMonogram name={club.name} className="size-16 text-2xl" />
        <div className="min-w-0">
          <h1 className="font-heading text-3xl font-bold text-foreground md:text-4xl [text-wrap:balance]">
            {club.name}
          </h1>
          <p className="mt-1 text-muted-foreground">{club.affiliation}</p>
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
            No meeting time or contact is listed yet. If you run this club,
            email{" "}
            <a
              href="mailto:sccs@sccs.swarthmore.edu"
              className="font-medium text-foreground underline decoration-border underline-offset-4 hover:decoration-foreground"
            >
              sccs@sccs.swarthmore.edu
            </a>{" "}
            and we&apos;ll add it.
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
    </main>
  );
}
