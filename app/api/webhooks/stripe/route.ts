import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";

import { grantAccess } from "@/lib/db";
import type { Plan } from "@/lib/types";

const stripeEventSchema = z.object({
  type: z.string(),
  data: z.object({
    object: z.object({
      customer_email: z.string().email().optional(),
      customer_details: z
        .object({
          email: z.string().email().optional()
        })
        .optional(),
      amount_total: z.number().nullable().optional(),
      metadata: z.record(z.string()).optional()
    })
  })
});

function secureCompare(a: string, b: string): boolean {
  const left = Buffer.from(a, "utf8");
  const right = Buffer.from(b, "utf8");

  if (left.length !== right.length) {
    return false;
  }

  return timingSafeEqual(left, right);
}

function verifyStripeSignature(payload: string, header: string | null, secret: string): boolean {
  if (!header || !secret) {
    return false;
  }

  const parts = header.split(",");
  const timestamp = parts.find((part) => part.startsWith("t="))?.slice(2);
  const signatures = parts.filter((part) => part.startsWith("v1=")).map((part) => part.slice(3));

  if (!timestamp || signatures.length === 0) {
    return false;
  }

  const ageSeconds = Math.abs(Date.now() / 1000 - Number(timestamp));

  if (!Number.isFinite(ageSeconds) || ageSeconds > 300) {
    return false;
  }

  const signedPayload = `${timestamp}.${payload}`;
  const expected = createHmac("sha256", secret).update(signedPayload).digest("hex");

  return signatures.some((signature) => secureCompare(signature, expected));
}

function inferPlan(amountTotal: number | null | undefined, metadata: Record<string, string> | undefined): Plan {
  const planFromMetadata = metadata?.plan?.toLowerCase();

  if (planFromMetadata === "starter" || planFromMetadata === "pro") {
    return planFromMetadata;
  }

  if ((amountTotal ?? 0) >= 1500) {
    return "pro";
  }

  return "starter";
}

export async function POST(request: Request) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    return NextResponse.json({ error: "STRIPE_WEBHOOK_SECRET is not configured." }, { status: 500 });
  }

  const payload = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!verifyStripeSignature(payload, signature, webhookSecret)) {
    return NextResponse.json({ error: "Invalid Stripe signature." }, { status: 400 });
  }

  let jsonPayload: unknown;

  try {
    jsonPayload = JSON.parse(payload);
  } catch {
    return NextResponse.json({ error: "Invalid Stripe payload." }, { status: 400 });
  }

  const parsedEvent = stripeEventSchema.safeParse(jsonPayload);

  if (!parsedEvent.success) {
    return NextResponse.json({ error: "Unsupported Stripe event schema." }, { status: 400 });
  }

  const event = parsedEvent.data;

  if (
    event.type !== "checkout.session.completed" &&
    event.type !== "checkout.session.async_payment_succeeded"
  ) {
    return NextResponse.json({ received: true, ignored: event.type });
  }

  const checkout = event.data.object;
  const email = checkout.customer_email ?? checkout.customer_details?.email;

  if (!email) {
    return NextResponse.json({ error: "Checkout event missing customer email." }, { status: 400 });
  }

  const plan = inferPlan(checkout.amount_total, checkout.metadata);
  await grantAccess(email, plan);

  return NextResponse.json({ received: true, granted: email.toLowerCase(), plan });
}
