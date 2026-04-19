import Link from "next/link";
import { BellRing, LineChart, Radar, ShieldCheck } from "lucide-react";

import { PricingCards } from "@/components/PricingCards";

const problemPoints = [
  "GitHub Explore and Trending are broad and noisy for niche market research.",
  "By the time a repo reaches your timeline, early growth signals are usually gone.",
  "Manual searching across multiple topics burns time and misses fast-moving projects."
];

const solutionPoints = [
  {
    title: "Topic-level monitoring",
    detail: "Track exactly the markets you care about with custom thresholds per topic.",
    icon: Radar
  },
  {
    title: "Star velocity filtering",
    detail: "Surface repos gaining stars quickly, not just repos that already became famous.",
    icon: LineChart
  },
  {
    title: "Daily founder digest",
    detail: "Get one concise email each day with only the breakout repos worth your attention.",
    icon: BellRing
  }
];

const faqs = [
  {
    q: "How does star velocity work?",
    a: "Each topic rule checks stars added over your chosen lookback window and compares the daily average against your threshold."
  },
  {
    q: "Do I need a GitHub token?",
    a: "Public repo discovery works without one, but adding a token improves reliability and rate limits for deeper scans."
  },
  {
    q: "What happens after payment?",
    a: "Lemon Squeezy sends a webhook to activate your subscription. Use the same purchase email to unlock the dashboard cookie instantly."
  },
  {
    q: "Who is this for?",
    a: "Indie founders, PMs, and technical operators tracking early signs of new competitors or technology shifts."
  }
];

export default function HomePage() {
  return (
    <main className="relative overflow-x-hidden">
      <div className="absolute left-[-10rem] top-[-8rem] h-72 w-72 rounded-full bg-cyan-500/15 blur-3xl" />
      <div className="absolute right-[-12rem] top-[8rem] h-80 w-80 rounded-full bg-emerald-500/10 blur-3xl" />

      <section className="mx-auto max-w-6xl px-6 pb-16 pt-12 md:pt-20">
        <div className="rounded-2xl border border-slate-700/60 bg-slate-900/50 p-8 shadow-[0_0_80px_rgba(45,212,191,0.08)] md:p-12">
          <p className="inline-flex items-center rounded-full border border-emerald-400/40 bg-emerald-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300">
            Market Intel for Founders
          </p>
          <h1 className="mt-5 text-4xl font-semibold leading-tight text-slate-50 md:text-6xl">
            GitHub Star Alerter
            <span className="mt-2 block text-2xl font-medium text-slate-300 md:text-3xl">
              Daily digest of repos in your topics hitting star velocity thresholds.
            </span>
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-slate-300">
            Stop scraping Explore pages. Define your niches, set minimum momentum, and receive a daily shortlist of repos
            that are actually accelerating.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link
              href="/dashboard"
              className="rounded-lg bg-emerald-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400"
            >
              Open Dashboard
            </Link>
            <a
              href="#pricing"
              className="rounded-lg border border-slate-600 px-5 py-3 text-sm font-semibold text-slate-100 transition hover:border-slate-400"
            >
              View Pricing
            </a>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-14" id="problem">
        <h2 className="text-2xl font-semibold text-slate-100 md:text-3xl">Why founder teams miss the signal</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {problemPoints.map((point) => (
            <article key={point} className="rounded-xl border border-slate-800 bg-slate-900/50 p-5">
              <p className="text-sm text-slate-300">{point}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-14" id="solution">
        <h2 className="text-2xl font-semibold text-slate-100 md:text-3xl">A practical workflow that stays focused</h2>
        <div className="mt-6 grid gap-5 md:grid-cols-3">
          {solutionPoints.map((point) => (
            <article key={point.title} className="rounded-xl border border-slate-700/60 bg-slate-900 p-6">
              <point.icon className="h-6 w-6 text-cyan-300" />
              <h3 className="mt-3 text-base font-semibold text-slate-100">{point.title}</h3>
              <p className="mt-2 text-sm text-slate-300">{point.detail}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-10" id="pricing">
        <PricingCards showAccessClaim={false} />
      </section>

      <section className="mx-auto max-w-4xl px-6 pb-20" id="faq">
        <div className="mb-5 flex items-center gap-2 text-sm text-emerald-300">
          <ShieldCheck className="h-4 w-4" />
          <span>FAQ</span>
        </div>
        <h2 className="text-2xl font-semibold text-slate-100 md:text-3xl">Questions founders ask before subscribing</h2>
        <div className="mt-6 space-y-3">
          {faqs.map((faq) => (
            <article key={faq.q} className="rounded-lg border border-slate-800 bg-slate-900/60 p-5">
              <h3 className="text-sm font-semibold text-slate-100">{faq.q}</h3>
              <p className="mt-2 text-sm text-slate-300">{faq.a}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
