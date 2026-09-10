"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const adminLinks = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/requests", label: "Requests" },
  { href: "/admin/assignments", label: "Users & clubs" },
  { href: "/admin/activity", label: "Activity" },
];

export default function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="mt-6 flex flex-wrap gap-2" aria-label="Administration">
      {adminLinks.map((link) => {
        const active =
          link.href === "/admin"
            ? pathname === link.href
            : pathname.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "inline-flex h-10 items-center rounded-xl border px-4 text-sm font-semibold transition-colors",
              active
                ? "border-sccs bg-sccs text-white"
                : "border-border bg-card text-foreground hover:border-sccs/35 hover:text-sccs",
            )}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
