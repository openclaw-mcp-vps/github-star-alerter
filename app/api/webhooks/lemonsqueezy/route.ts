import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    {
      error:
        "LemonSqueezy webhook endpoint is disabled for this deployment. Use /api/webhooks/stripe with STRIPE_WEBHOOK_SECRET.",
      next: "/api/webhooks/stripe"
    },
    { status: 410 }
  );
}
