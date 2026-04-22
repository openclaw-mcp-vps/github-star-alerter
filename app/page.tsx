import type { Metadata } from "next";
import Link from "next/link";
import { BellRing, Compass, Flame, Mail, Radar, Sparkles } from "lucide-react";

import { PricingCards } from "@/components/PricingCards";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Daily GitHub Trend Alerts",
  description:
    "GitHub Star Alerter sends a daily digest of repos in your topics that cross star velocity thresholds, so you can spot fast-moving markets early."
};

const problemPoints = [
  {
    title: "Explore is too broad",
    body: "Founders need a narrow signal for their exact niche, not a global feed dominated by hype cycles.",
    icon: Compass
  },
  {
    title: "Timing is everything",
    body: "By the time a repo is everywhere on social feeds, the first-mover advantage is already gone.",
    icon: Flame
  },
  {
    title: "Manual tracking burns time",
    body: "Checking star charts and topic pages every day is repetitive and easy to miss during busy product sprints.",
    icon: Radar
  }
];

const solutionSteps = [
  {
    title: "Define your market topics",
    body: "Track categories like ai-agents, static-site-generators, or workflow-automation with custom star filters.",
    icon: Sparkles
  },
  {
    title: "Set velocity thresholds",
    body: "Only surface repositories that cross both total stars and 24-hour star velocity requirements.",
    icon: BellRing
  },
  {
    title: "Read one daily digest",
    body: "Each morning, get an email with links, star counts, velocity, and topic labels so you can act quickly.",
    icon: Mail
  }
];

const faqItems = [
  {
    question: "How is velocity measured?",
    answer:
      "Velocity uses the last 24 hours of GitHub watch/star events for each candidate repo. Repositories must pass both your total-star floor and daily velocity floor."
  },
  {
    question: "Can I run scans manually between digests?",
    answer:
      "Yes. The dashboard includes a Run Scan button so you can refresh results before launches, investor calls, or product planning sessions."
  },
  {
    question: "How does access work after purchase?",
    answer:
      "Checkout is hosted by Stripe. After payment, enter your purchase email in the dashboard to claim access, which sets a secure cookie for future visits."
  },
  {
    question: "Who is this built for?",
    answer:
      "Indie founders, product operators, and small teams that need lightweight competitive intelligence without enterprise tooling overhead."
  }
];

export default function HomePage() {
  return (
    <main>
      <header className="border-b border-[#30363d] bg-[#0d1117]/80 backdrop-blur">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#58a6ff]">GitHub Star Alerter</p>
          <div className="flex items-center gap-3">
            <Link href="/dashboard">
              <Button variant="outline">Dashboard</Button>
            </Link>
          </div>
        </nav>
      </header>

      <section className="mx-auto flex max-w-6xl flex-col gap-8 px-6 pb-24 pt-20 lg:flex-row lg:items-center lg:gap-14">
        <div className="flex-1">
          <p className="mb-4 inline-flex rounded-full border border-[#30363d] bg-[#111827] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#8b949e]">
            Market-Intel SaaS for Founders
          </p>
          <h1 className="[font-family:var(--font-heading)] text-4xl font-bold leading-tight text-[#f0f6fc] sm:text-5xl">
            Catch emerging GitHub competitors before everyone else notices.
          </h1>
          <p className="mt-6 max-w-xl text-lg text-[#8b949e]">
            Configure topic thresholds once, then get a daily digest of repositories accelerating in stars. No noisy feeds, no manual polling, no missed shifts.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/dashboard">
              <Button size="lg">Start Tracking Topics</Button>
            </Link>
            <a href="#pricing">
              <Button size="lg" variant="outline">
                View Pricing
              </Button>
            </a>
          </div>
        </div>

        <Card className="flex-1 bg-[#0f1622]">
          <CardHeader>
            <CardTitle>What you get every day</CardTitle>
            <CardDescription>One concise digest designed for fast founder decisions.</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-4 text-sm text-[#c9d1d9]">
              <li className="rounded-lg border border-[#30363d] bg-[#0d1117] p-3">
                Repo links sorted by 24h star velocity so the fastest movers are first.
              </li>
              <li className="rounded-lg border border-[#30363d] bg-[#0d1117] p-3">
                Topic context attached to each result so trends map back to markets you care about.
              </li>
              <li className="rounded-lg border border-[#30363d] bg-[#0d1117] p-3">
                Threshold-driven filtering that ignores low-signal projects and vanity spikes.
              </li>
            </ul>
          </CardContent>
        </Card>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-24" id="problem">
        <h2 className="[font-family:var(--font-heading)] text-3xl font-bold text-[#f0f6fc]">The Problem</h2>
        <p className="mt-3 max-w-3xl text-[#8b949e]">
          Founders tracking fast markets need sharp competitive intelligence. GitHub has the signal, but discovering it in time is still too manual.
        </p>
        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {problemPoints.map(({ title, body, icon: Icon }) => (
            <Card key={title}>
              <CardHeader>
                <Icon className="h-5 w-5 text-[#f0883e]" />
                <CardTitle className="mt-3 text-xl">{title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-[#8b949e]">{body}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-24" id="solution">
        <h2 className="[font-family:var(--font-heading)] text-3xl font-bold text-[#f0f6fc]">How It Works</h2>
        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {solutionSteps.map(({ title, body, icon: Icon }) => (
            <Card key={title}>
              <CardHeader>
                <Icon className="h-5 w-5 text-[#58a6ff]" />
                <CardTitle className="mt-3 text-xl">{title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-[#8b949e]">{body}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-24" id="pricing">
        <h2 className="[font-family:var(--font-heading)] text-3xl font-bold text-[#f0f6fc]">Simple Pricing</h2>
        <p className="mt-3 max-w-2xl text-[#8b949e]">
          Hosted checkout runs through Stripe payment links. Pick your plan and unlock your dashboard in under a minute.
        </p>
        <div className="mt-8">
          <PricingCards />
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-24" id="faq">
        <h2 className="[font-family:var(--font-heading)] text-3xl font-bold text-[#f0f6fc]">FAQ</h2>
        <div className="mt-8 space-y-4">
          {faqItems.map((item) => (
            <Card key={item.question}>
              <CardHeader>
                <CardTitle className="text-lg">{item.question}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-[#8b949e]">{item.answer}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </main>
  );
}
