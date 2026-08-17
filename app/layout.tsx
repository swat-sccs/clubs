import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Fraunces } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { auth } from "@/lib/auth";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-heading",
  style: ["normal", "italic"],
  axes: ["SOFT", "WONK"],
});

const geistSans = Geist({
  variable: "--font-geist-sans",
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
  themeColor: "#faf6ef",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Display only; every mutation and protected page re-checks the session
  // itself.
  const session = await auth();
  return (
    <html
      lang="en"
      className={cn(
        "h-full",
        "antialiased",
        geistSans.variable,
        geistMono.variable,
        "font-sans",
        fraunces.variable,
      )}
    >
      <body className="min-h-full flex flex-col">
        <Header userName={session?.user?.name ?? session?.user?.email ?? null} />
        <div className="flex flex-1 flex-col">{children}</div>
        <Footer />
      </body>
    </html>
  );
}
