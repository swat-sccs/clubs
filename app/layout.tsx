import type { Metadata, Viewport } from "next";
import { Geist_Mono, Raleway } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const raleway = Raleway({
  variable: "--font-raleway",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Swat Clubs",
  description:
    "Discover student organizations at Swarthmore College: browse, search, and bookmark clubs.",
};

export const viewport: Viewport = {
  themeColor: "#fbfcfe",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Display only; every mutation and protected page re-checks the session
  // itself.
  const session = await auth();
  const hasManagedClubs = session?.user?.id
    ? Boolean(
        await prisma.clubEditor.findFirst({
          where: { userId: session.user.id },
          select: { id: true },
        }),
      )
    : false;
  return (
    <html
      lang="en"
      className={cn(
        "h-full",
        "antialiased",
        raleway.variable,
        geistMono.variable,
        "font-sans",
      )}
    >
      <body className="min-h-full flex flex-col">
        <Header
          userName={session?.user?.name ?? session?.user?.email ?? null}
          isAdmin={session?.user?.isAdmin ?? false}
          hasManagedClubs={hasManagedClubs}
        />
        <div className="flex flex-1 flex-col">{children}</div>
        <Footer />
      </body>
    </html>
  );
}
