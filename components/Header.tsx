"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "/clubs", label: "Clubs" },
  { href: "/match", label: "Match" },
  { href: "/events", label: "Events" },
  { href: "/faq", label: "FAQ" },
];

const Header = ({ userName }: { userName: string | null }) => {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  // Close the mobile menu when navigation changes the route.
  const [lastPathname, setLastPathname] = useState(pathname);
  if (lastPathname !== pathname) {
    setLastPathname(pathname);
    setMenuOpen(false);
  }

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 md:h-[4.5rem] lg:px-8">
        <Link
          href="/"
          className="flex items-center gap-2.5 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-foreground sm:gap-3"
        >
          <Image
            src="/logo.png"
            width={40}
            height={40}
            alt="Swat Clubs logo"
            className="size-9 md:size-10"
          />
          <span className="font-heading text-2xl font-bold tracking-tight text-foreground">
            Swat&nbsp;Clubs
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden items-center gap-8 md:flex">
          {navLinks.map(({ href, label }) => {
            const isActive = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "border-b-2 pb-0.5 text-[0.95rem] font-medium transition-colors",
                  isActive
                    ? "border-foreground text-foreground"
                    : "border-transparent text-foreground/65 hover:border-foreground/40 hover:text-foreground",
                )}
              >
                {label}
              </Link>
            );
          })}

          <Link
            href="/login"
            className="flex h-9 items-center rounded-[3px] bg-sccs-orange px-5 text-[0.95rem] font-semibold text-sccs-ink transition-colors hover:bg-sccs-orange/85 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
          >
            {userName ?? "Login"}
          </Link>
        </div>

        {/* Mobile menu button */}
        <button
          type="button"
          onClick={() => setMenuOpen((open) => !open)}
          aria-expanded={menuOpen}
          aria-controls="mobile-nav"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          className="flex size-10 items-center justify-center text-foreground md:hidden"
        >
          <span className="relative block h-3.5 w-5">
            <span
              className={cn(
                "absolute left-0 top-0 h-0.5 w-full bg-current transition-all duration-300",
                menuOpen && "top-1.5 rotate-45",
              )}
            />
            <span
              className={cn(
                "absolute left-0 top-1.5 h-0.5 w-full bg-current transition-all duration-300",
                menuOpen && "opacity-0",
              )}
            />
            <span
              className={cn(
                "absolute left-0 top-3 h-0.5 w-full bg-current transition-all duration-300",
                menuOpen && "top-1.5 -rotate-45",
              )}
            />
          </span>
        </button>
      </nav>

      {/* Mobile nav panel */}
      {menuOpen && (
        <div
          id="mobile-nav"
          className="animate-in border-t border-border bg-background fade-in slide-in-from-top-2 duration-200 md:hidden"
        >
          <div className="mx-auto flex max-w-7xl flex-col px-4 py-2 sm:px-6">
            {navLinks.map(({ href, label }) => {
              const isActive = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "border-b border-border py-3.5 text-lg transition-colors",
                    isActive
                      ? "font-semibold text-foreground"
                      : "font-medium text-foreground/70 hover:text-foreground",
                  )}
                >
                  {label}
                </Link>
              );
            })}
            <Link
              href="/login"
              className="mb-3 mt-4 flex h-11 items-center justify-center rounded-[3px] bg-sccs-orange text-lg font-semibold text-sccs-ink transition-colors hover:bg-sccs-orange/85"
            >
              {userName ?? "Login"}
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
