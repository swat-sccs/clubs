import Image from "next/image";
import Link from "next/link";

const footerLinks = [
  { href: "/clubs", label: "Clubs" },
  { href: "/events", label: "Events" },
  { href: "/faq", label: "FAQ" },
];

const Footer = () => {
  return (
    <footer className="mt-auto">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="rule-double" />
        <div className="flex flex-col items-start justify-between gap-8 pb-4 pt-10 md:flex-row md:items-center">
          <Link href="/" className="flex items-center gap-3">
            <Image
              src="/logo.png"
              width={40}
              height={40}
              alt="Swat Clubs logo"
              className="size-10"
            />
            <span className="font-heading text-2xl font-bold tracking-tight text-foreground">
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
              href="mailto:sccs@sccs.swarthmore.edu"
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
              href="mailto:sccs@sccs.swarthmore.edu"
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
