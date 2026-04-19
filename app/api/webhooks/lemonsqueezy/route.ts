import { NextResponse } from "next/server";

import {
  inferSubscriptionFromWebhook,
  isValidLemonSqueezySignature,
  parseLemonSqueezyWebhook
} from "@/lib/lemonsqueezy";
import { upsertSubscription } from "@/lib/supabase";

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-signature") ?? "";
  const webhookSecret = process.env.LEMON_SQUEEZY_WEBHOOK_SECRET;

  if (!webhookSecret) {
    return NextResponse.json({ error: "Webhook secret missing" }, { status: 500 });
  }

  if (!isValidLemonSqueezySignature(rawBody, signature, webhookSecret)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const payload = parseLemonSqueezyWebhook(rawBody);

  if (!payload) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const subscription = inferSubscriptionFromWebhook(payload);

  if (subscription?.email) {
    await upsertSubscription(subscription);
  }

  return NextResponse.json({ received: true });
}
