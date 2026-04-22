import { CheckCircle2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

const starterFeatures = [
  "Track up to 5 niche topics",
  "Set minimum total stars + 24h velocity",
  "Daily digest with direct repo links",
  "Manual scan from dashboard"
];

const proFeatures = [
  "Unlimited topic tracking",
  "Priority scan capacity for larger topic sets",
  "Expanded digest depth for crowded topics",
  "Best for agencies or serial founders"
];

export function PricingCards() {
  const checkoutHref = process.env.NEXT_PUBLIC_STRIPE_PAYMENT_LINK ?? "";

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <Badge className="mb-3 w-fit" variant="outline">
            Starter
          </Badge>
          <CardTitle>$5/month</CardTitle>
          <CardDescription>For indie founders tracking a tight market segment.</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3 text-sm text-[#c9d1d9]">
            {starterFeatures.map((feature) => (
              <li key={feature} className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 text-[#2ea043]" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </CardContent>
        <CardFooter>
          <a className="w-full" href={checkoutHref} rel="noreferrer" target="_blank">
            <Button className="w-full" size="lg">
              Start Starter Plan
            </Button>
          </a>
        </CardFooter>
      </Card>

      <Card className="border-[#1f6feb]/50 shadow-[0_0_32px_-16px_rgba(31,111,235,0.8)]">
        <CardHeader>
          <Badge className="mb-3 w-fit">Most Popular</Badge>
          <CardTitle>$15/month</CardTitle>
          <CardDescription>
            Unlimited topic intelligence for founders running multiple bets at once.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3 text-sm text-[#c9d1d9]">
            {proFeatures.map((feature) => (
              <li key={feature} className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 text-[#58a6ff]" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </CardContent>
        <CardFooter>
          <a className="w-full" href={checkoutHref} rel="noreferrer" target="_blank">
            <Button className="w-full" size="lg" variant="secondary">
              Start Pro Plan
            </Button>
          </a>
        </CardFooter>
      </Card>
    </div>
  );
}
