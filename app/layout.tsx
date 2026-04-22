import type { Metadata } from "next";
import { Space_Grotesk, Source_Sans_3 } from "next/font/google";

import "@/app/globals.css";

const headingFont = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-heading"
});

const bodyFont = Source_Sans_3({
  subsets: ["latin"],
  variable: "--font-body"
});

export const metadata: Metadata = {
  metadataBase: new URL("https://githubstaralerter.com"),
  title: {
    default: "GitHub Star Alerter",
    template: "%s | GitHub Star Alerter"
  },
  description:
    "Daily market-intel digests for GitHub topics. Track star velocity thresholds and catch emerging competitors before they trend.",
  keywords: [
    "GitHub stars",
    "market intelligence",
    "founder tools",
    "competitor tracking",
    "GitHub topic monitoring"
  ],
  openGraph: {
    title: "GitHub Star Alerter",
    description:
      "Configure topic-level star thresholds and receive a daily digest of repositories crossing your velocity targets.",
    url: "https://githubstaralerter.com",
    siteName: "GitHub Star Alerter",
    locale: "en_US",
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: "GitHub Star Alerter",
    description: "Daily GitHub trend intelligence for founders tracking new entrants and fast-moving tools."
  },
  robots: {
    index: true,
    follow: true
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html className={`${headingFont.variable} ${bodyFont.variable}`} lang="en">
      <body className="bg-[#0d1117] text-[#c9d1d9] [font-family:var(--font-body)] antialiased">{children}</body>
    </html>
  );
}
