"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { signOutFromMenu } from "@/app/actions/auth";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "/clubs", label: "Clubs" },
  { href: "/match", label: "Match" },
  { href: "/faq", label: "FAQ" },
];

function linkIsActive(pathname: string, href: string) {
  if (href === "/clubs") {
    return pathname === "/clubs" || pathname.startsWith("/clubs/");
  }
  return pathname === href;
}

const Header = ({
  userName,
  isAdmin,
  hasManagedClubs,
}: {
  userName: string | null;
  isAdmin: boolean;
  hasManagedClubs: boolean;
}) => {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const accountMenuRef = useRef<HTMLDetailsElement>(null);

  function closeAccountMenu() {
    if (accountMenuRef.current) accountMenuRef.current.open = false;
  }

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      const menu = accountMenuRef.current;
      if (menu?.open && !menu.contains(event.target as Node)) menu.open = false;
    }
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, []);

  // Close the mobile menu when navigation changes the route.
  const [lastPathname, setLastPathname] = useState(pathname);
  if (lastPathname !== pathname) {
    setLastPathname(pathname);
    setMenuOpen(false);
  }

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background">
      <nav className="mx-auto flex min-h-20 max-w-7xl items-center justify-between px-4 py-3 sm:min-h-24 sm:px-6 lg:px-8">
        <Link
          href="/"
          aria-label="Swat Clubs home"
          className="flex items-center gap-3 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-foreground"
        >
          <Image
            src="/sccs-logo.png"
            width={56}
            height={56}
            alt=""
            className="size-12 rounded-xl sm:size-14"
            preload
          />
          <span className="font-heading text-2xl font-bold tracking-tight text-black sm:text-3xl lg:text-4xl">
            Swat&nbsp;Clubs
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden items-center gap-8 md:flex">
          {navLinks.map(({ href, label }) => {
            const isActive = linkIsActive(pathname, href);
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

          {userName && hasManagedClubs && (
            <Link
              href="/my-clubs"
              className={cn(
                "border-b-2 pb-0.5 text-[0.95rem] font-medium transition-colors",
                pathname === "/my-clubs"
                  ? "border-foreground text-foreground"
                  : "border-transparent text-foreground/65 hover:border-foreground/40 hover:text-foreground",
              )}
            >
              My clubs
            </Link>
          )}

          {userName ? (
            <details ref={accountMenuRef} className="relative">
              <summary className="flex h-9 cursor-pointer list-none items-center gap-1.5 rounded-xl bg-sccs-orange px-4 text-[0.95rem] font-semibold text-sccs-ink transition-colors hover:bg-sccs-orange/85 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground [&::-webkit-details-marker]:hidden">
                {userName}
                <ChevronDown aria-hidden="true" className="size-4" />
              </summary>
              <div className="absolute right-0 top-full mt-2 w-44 rounded-2xl border border-border bg-background p-1 shadow-lg">
                <Link
                  href="/clubs/new"
                  onClick={closeAccountMenu}
                  className="block rounded-xl px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                >
                  Add a club
                </Link>
                {isAdmin && (
                  <Link
                    href="/admin"
                    onClick={closeAccountMenu}
                    className="block rounded-xl px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                  >
                    Admin
                  </Link>
                )}
                <form action={signOutFromMenu}>
                  <button
                    type="submit"
                    onClick={closeAccountMenu}
                    className="w-full rounded-xl px-3 py-2 text-left text-sm font-medium text-foreground transition-colors hover:bg-muted"
                  >
                    Sign out
                  </button>
                </form>
              </div>
            </details>
          ) : (
            <Link
              href={userName ? "/clubs/new" : "/login"}
              className="flex h-9 items-center rounded-xl bg-sccs-orange px-5 text-[0.95rem] font-semibold text-sccs-ink transition-colors hover:bg-sccs-orange/85 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
            >
              Login
            </Link>
          )}
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
              const isActive = linkIsActive(pathname, href);
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
            {userName && hasManagedClubs && (
              <Link
                href="/my-clubs"
                className={cn(
                  "border-b border-border py-3.5 text-lg transition-colors",
                  pathname === "/my-clubs"
                    ? "font-semibold text-foreground"
                    : "font-medium text-foreground/70 hover:text-foreground",
                )}
              >
                My clubs
              </Link>
            )}
            <Link
              href={userName ? "/clubs/new" : "/login"}
              className="mb-3 mt-4 flex h-11 items-center justify-center rounded-xl bg-sccs-orange text-lg font-semibold text-sccs-ink transition-colors hover:bg-sccs-orange/85"
            >
              {userName ? "Add a club" : "Login"}
            </Link>
            {userName && isAdmin && (
              <Link
                href="/admin"
                className="border-b border-border py-3.5 text-lg font-medium text-foreground/70"
              >
                Admin
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
