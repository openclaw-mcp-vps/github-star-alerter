import type { Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";

import { ClaimAccessForm } from "@/components/ClaimAccessForm";
import { PricingCards } from "@/components/PricingCards";
import { TopicManager } from "@/components/TopicManager";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ACCESS_COOKIE_NAME, verifyAccessCookieValue } from "@/lib/auth";
import { getUser } from "@/lib/db";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Manage topics, run scans, and monitor high-velocity GitHub repositories."
};

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const accessCookie = cookieStore.get(ACCESS_COOKIE_NAME)?.value;
  const email = verifyAccessCookieValue(accessCookie);

  if (!email) {
    return (
      <main className="mx-auto min-h-screen w-full max-w-5xl px-6 py-12">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
          <h1 className="[font-family:var(--font-heading)] text-3xl font-bold text-[#f0f6fc]">Dashboard Access</h1>
          <Link href="/">
            <Button variant="outline">Back to Home</Button>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Unlock your trend dashboard</CardTitle>
            <CardDescription>
              Complete checkout through Stripe, then claim access once with your purchase email.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PricingCards />
            <ClaimAccessForm />
          </CardContent>
        </Card>
      </main>
    );
  }

  const user = await getUser(email);

  if (!user?.accessActive) {
    return (
      <main className="mx-auto min-h-screen w-full max-w-5xl px-6 py-12">
        <Card>
          <CardHeader>
            <CardTitle>Access check failed</CardTitle>
            <CardDescription>
              Your cookie is valid but no active subscription was found for {email}. Try claiming again with your checkout email.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ClaimAccessForm />
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-6xl px-6 py-12">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="[font-family:var(--font-heading)] text-3xl font-bold text-[#f0f6fc]">GitHub Star Alerter</h1>
          <p className="mt-1 text-sm text-[#8b949e]">Daily market-intel pipeline for {user.email}</p>
        </div>

        <Link href="/">
          <Button variant="outline">View Landing Page</Button>
        </Link>
      </div>

      <TopicManager />
    </main>
  );
}
