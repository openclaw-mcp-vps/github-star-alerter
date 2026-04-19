import { NextResponse } from "next/server";
import { z } from "zod";

import { getSubscriptionByEmail } from "@/lib/supabase";

const bodySchema = z.object({
  email: z.string().email()
});

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const { email } = bodySchema.parse(json);

    const subscription = await getSubscriptionByEmail(email);

    if (!subscription || !["active", "on_trial"].includes(subscription.status)) {
      return NextResponse.json(
        { error: "No active subscription found for that email." },
        { status: 403 }
      );
    }

    const response = NextResponse.json({ ok: true, plan: subscription.plan });
    response.cookies.set({
      name: "ghsa_paid",
      value: "1",
      path: "/",
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30
    });
    response.cookies.set({
      name: "ghsa_email",
      value: email,
      path: "/",
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30
    });
    response.cookies.set({
      name: "ghsa_plan",
      value: subscription.plan,
      path: "/",
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30
    });

    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid request";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
