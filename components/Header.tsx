"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const navLinks = [
  { href: "/clubs", label: "Clubs" },
  { href: "/events", label: "Events" },
  { href: "/faq", label: "FAQ" },
];

const Header = () => {
  const pathname = usePathname();

  return (
    <header className="border-b border-border bg-background">
      <nav className="mx-auto flex h-24 max-w-7xl items-center justify-between px-8">
        <Link href="/" className="flex items-center gap-3">
          <Image src="/logo.png" width={56} height={56} alt="Logo" />
          <span className="text-3xl font-bold text-sccs">Swat Clubs</span>
        </Link>

        <div className="hidden items-center gap-2 md:flex">
          {navLinks.map(({ href, label }) => {
            const isActive = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "rounded-full px-5 py-2.5 text-lg font-medium transition-colors",
                  isActive
                    ? "bg-sccs text-white"
                    : "text-foreground/80 hover:bg-blue-100 hover:text-sccs",
                )}
              >
                {label}
              </Link>
            );
          })}

          <Button
            asChild
            size="lg"
            className="ml-6 h-12 rounded-full bg-sccs-orange px-8 text-lg text-white hover:bg-sccs-orange/90"
          >
            <Link href="/login">Login</Link>
          </Button>
        </div>
      </nav>
    </header>
  );
};

export default Header;
