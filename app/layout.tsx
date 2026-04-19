import type { Metadata } from "next";
import Script from "next/script";

import "./globals.css";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const siteUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://github-star-alerter.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "GitHub Star Alerter",
    template: "%s | GitHub Star Alerter"
  },
  description:
    "Track GitHub topics by star velocity and get a daily digest of repos breaking your thresholds before everyone else notices.",
  keywords: [
    "GitHub topic monitoring",
    "star velocity",
    "market intelligence",
    "founder tools",
    "competitor tracking"
  ],
  openGraph: {
    title: "GitHub Star Alerter",
    description:
      "Daily email digests for high-velocity GitHub repos in your chosen topics. Built for founders watching market movement.",
    url: siteUrl,
    siteName: "GitHub Star Alerter",
    images: [
      {
        url: "/og-image",
        width: 1200,
        height: 630,
        alt: "GitHub Star Alerter dashboard preview"
      }
    ],
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: "GitHub Star Alerter",
    description: "Spot breakout repositories in your market niches with daily star-velocity digests.",
    images: ["/og-image"]
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
    <html lang="en" className={cn("dark", "font-sans", geist.variable)}>
      <body className="bg-[#0d1117] text-slate-100 antialiased">
        <Script src="https://assets.lemonsqueezy.com/lemon.js" strategy="afterInteractive" />
        {children}
      </body>
    </html>
  );
}
