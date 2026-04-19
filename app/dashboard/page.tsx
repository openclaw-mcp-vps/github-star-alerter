import Link from "next/link";
import { cookies } from "next/headers";
import { Lock, Zap } from "lucide-react";

import { PricingCards } from "@/components/PricingCards";
import { TopicConfig } from "@/components/TopicConfig";
import { getUserTopicConfigs } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const paidCookie = cookieStore.get("ghsa_paid")?.value;
  const email = cookieStore.get("ghsa_email")?.value ?? "";
  const plan = cookieStore.get("ghsa_plan")?.value ?? "starter";

  const hasAccess = paidCookie === "1";

  if (!hasAccess) {
    return (
      <main className="mx-auto max-w-5xl px-6 pb-24 pt-12">
        <div className="rounded-2xl border border-slate-700 bg-slate-900/70 p-8">
          <div className="flex items-center gap-3">
            <Lock className="h-5 w-5 text-amber-300" />
            <h1 className="text-2xl font-semibold text-slate-100">Dashboard Locked</h1>
          </div>
          <p className="mt-3 max-w-2xl text-sm text-slate-300">
            This workspace is available to paying subscribers. Purchase a plan or claim access using your checkout email.
          </p>
          <div className="mt-6">
            <PricingCards showAccessClaim />
          </div>
          <p className="mt-6 text-sm text-slate-400">
            Need the overview first? <Link className="text-cyan-300 underline" href="/">Read how the alerts work</Link>.
          </p>
        </div>
      </main>
    );
  }

  const topicConfigs = email ? await getUserTopicConfigs(email) : [];

  return (
    <main className="mx-auto max-w-6xl px-6 pb-20 pt-12">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-emerald-300">Subscriber Dashboard</p>
          <h1 className="mt-1 text-3xl font-semibold text-slate-100">GitHub Star Alerter</h1>
          <p className="mt-2 text-sm text-slate-300">
            Configure topics and thresholds, then preview exactly what appears in your daily digest.
          </p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-md border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">
          <Zap className="h-4 w-4" />
          <span>{plan === "unlimited" ? "Unlimited topics" : "5-topic plan"}</span>
        </div>
      </div>

      <div className="mt-8">
        <TopicConfig email={email} plan={plan} initialTopics={topicConfigs} />
      </div>
    </main>
  );
}
