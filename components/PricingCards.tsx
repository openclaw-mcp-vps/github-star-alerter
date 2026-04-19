"use client";

import { FormEvent, useMemo, useState } from "react";
import { Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type PricingCardsProps = {
  showAccessClaim?: boolean;
};

const plans = [
  {
    id: "starter",
    name: "Starter",
    price: "$5/mo",
    description: "Perfect for one founder tracking a handful of niches.",
    bullets: [
      "Up to 5 topics",
      "Daily digest email",
      "Custom star velocity thresholds",
      "Dashboard previews before digest send"
    ],
    cta: "Start Starter"
  },
  {
    id: "unlimited",
    name: "Unlimited",
    price: "$15/mo",
    description: "For operators tracking multiple markets in parallel.",
    bullets: [
      "Unlimited topics",
      "Daily digest email",
      "Priority scan depth",
      "Best for agencies and portfolio founders"
    ],
    cta: "Start Unlimited"
  }
] as const;

function buildCheckoutUrl(planId: "starter" | "unlimited") {
  const starterVariantId = process.env.NEXT_PUBLIC_LEMON_SQUEEZY_PRODUCT_ID;
  const unlimitedVariantId = process.env.NEXT_PUBLIC_LEMON_SQUEEZY_UNLIMITED_VARIANT_ID;

  if (!starterVariantId) {
    return "#";
  }

  const variantId = planId === "unlimited" ? unlimitedVariantId ?? starterVariantId : starterVariantId;

  return `https://app.lemonsqueezy.com/checkout/buy/${variantId}?embed=1&media=0&logo=0&checkout[custom][plan]=${planId}`;
}

export function PricingCards({ showAccessClaim = false }: PricingCardsProps) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<string>("");
  const [isClaiming, setIsClaiming] = useState(false);

  const checkoutLinks = useMemo(
    () => ({
      starter: buildCheckoutUrl("starter"),
      unlimited: buildCheckoutUrl("unlimited")
    }),
    []
  );

  async function onClaimAccess(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("");
    setIsClaiming(true);

    try {
      const response = await fetch("/api/access/claim", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email })
      });

      if (!response.ok) {
        const body = (await response.json()) as { error?: string };
        throw new Error(body.error ?? "Could not verify your subscription email.");
      }

      setStatus("Access granted. Reloading dashboard...");
      window.location.reload();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Something went wrong while claiming access.");
    } finally {
      setIsClaiming(false);
    }
  }

  return (
    <div className="space-y-8">
      <div className="grid gap-5 md:grid-cols-2">
        {plans.map((plan) => (
          <Card key={plan.id} className="border-slate-700 bg-slate-900/70 text-slate-100">
            <CardHeader>
              <CardTitle className="text-xl">{plan.name}</CardTitle>
              <CardDescription className="text-slate-300">{plan.description}</CardDescription>
              <p className="text-3xl font-semibold text-emerald-300">{plan.price}</p>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {plan.bullets.map((bullet) => (
                  <li key={bullet} className="flex items-start gap-2 text-sm text-slate-200">
                    <Check className="mt-0.5 h-4 w-4 text-emerald-300" />
                    <span>{bullet}</span>
                  </li>
                ))}
              </ul>
              <Button asChild className="mt-6 w-full bg-emerald-500 text-slate-950 hover:bg-emerald-400">
                <a href={checkoutLinks[plan.id]} className="lemonsqueezy-button">
                  {plan.cta}
                </a>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {showAccessClaim ? (
        <div className="rounded-xl border border-slate-700 bg-slate-900/60 p-5">
          <h3 className="text-base font-semibold text-slate-100">Already paid? Claim dashboard access</h3>
          <p className="mt-2 text-sm text-slate-300">
            Enter the email used at checkout. If your Lemon Squeezy subscription is active, we set your access cookie.
          </p>
          <form className="mt-4 flex flex-col gap-3 sm:flex-row" onSubmit={onClaimAccess}>
            <Input
              type="email"
              required
              placeholder="you@company.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="bg-slate-950"
            />
            <Button type="submit" disabled={isClaiming}>
              {isClaiming ? "Verifying..." : "Claim Access"}
            </Button>
          </form>
          {status ? <p className="mt-3 text-sm text-cyan-300">{status}</p> : null}
        </div>
      ) : null}
    </div>
  );
}
