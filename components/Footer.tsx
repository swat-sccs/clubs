"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

const footerLinks = [
  { href: "/clubs", label: "Clubs" },
  { href: "/match", label: "Match" },
  { href: "/faq", label: "FAQ" },
];

const Footer = () => {
  const pathname = usePathname();
  const isClubDetailPage = /^\/clubs\/(?!new(?:\/|$))[^/]+\/?$/.test(pathname);

  if (isClubDetailPage) {
    return (
      <footer className="mt-auto">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="rule-accent" />
          <div className="flex flex-col items-start justify-between gap-2 py-5 text-sm text-muted-foreground md:flex-row md:items-center">
            <p>The student organization directory of Swarthmore College.</p>
            <p>
              Set with care by{" "}
              <a
                href="https://sccs.swarthmore.edu"
                className="font-medium text-foreground/80 underline decoration-border underline-offset-4 transition-colors hover:decoration-foreground"
              >
                SCCS
              </a>
            </p>
          </div>
        </div>
      </footer>
    );
  }

  return (
    <footer className="mt-auto">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="rule-accent" />
        <div className="flex flex-col items-start justify-between gap-8 pb-4 pt-10 md:flex-row md:items-center">
          <Link href="/" aria-label="Swat Clubs home" className="flex items-center gap-3">
            <Image
              src="/sccs-logo.png"
              width={48}
              height={48}
              alt=""
              className="size-12 rounded-xl"
            />
            <span className="font-heading text-2xl font-bold tracking-tight text-black">
              Swat&nbsp;Clubs
            </span>
          </Link>

          <nav className="flex flex-wrap items-center gap-x-8 gap-y-3">
            {footerLinks.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="text-[0.95rem] font-medium text-foreground/70 underline-offset-4 transition-colors hover:text-foreground hover:underline"
              >
                {label}
              </Link>
            ))}
            <a
              href="mailto:staff@sccs.swarthmore.edu"
              className="text-[0.95rem] font-medium text-foreground/70 underline-offset-4 transition-colors hover:text-foreground hover:underline"
            >
              Contact
            </a>
          </nav>
        </div>

        <div className="flex flex-col items-start justify-between gap-2 border-t border-border py-5 text-sm text-muted-foreground md:flex-row md:items-center">
          <p>The student organization directory of Swarthmore College.</p>
          <p>
            Set with care by{" "}
            <a
              href="https://sccs.swarthmore.edu"
              className="font-medium text-foreground/80 underline decoration-border underline-offset-4 transition-colors hover:decoration-foreground"
            >
              SCCS
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
