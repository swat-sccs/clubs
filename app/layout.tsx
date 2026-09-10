import type { Metadata, Viewport } from "next";
import { Geist_Mono, Raleway } from "next/font/google";
import { headers } from "next/headers";
import "./globals.css";
import { cn } from "@/lib/utils";
import { auth } from "@/lib/auth";
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
  applicationName: "Swat Clubs",
  appleWebApp: {
    capable: true,
    title: "Swat Clubs",
    statusBarStyle: "default",
  },
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
  const nonce = (await headers()).get("x-nonce") ?? undefined;
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
      <head>
        {/* Privacy-friendly analytics by Plausible */}
        <script
          async
          nonce={nonce}
          src="https://plausible.sccs.swarthmore.edu/js/pa-j74xOoT2bxp0YTUZwe_wQ.js"
        />
        <script
          nonce={nonce}
          dangerouslySetInnerHTML={{
            __html:
              "window.plausible=window.plausible||function(){(plausible.q=plausible.q||[]).push(arguments)},plausible.init=plausible.init||function(i){plausible.o=i||{}};plausible.init()",
          }}
        />
      </head>
      <body className="min-h-full flex flex-col">
        <Header
          userName={session?.user?.name ?? session?.user?.email ?? null}
          isAdmin={session?.user?.isAdmin ?? false}
        />
        <div className="flex flex-1 flex-col">{children}</div>
        <Footer />
      </body>
    </html>
  );
}
