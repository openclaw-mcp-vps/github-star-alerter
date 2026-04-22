import { NextResponse } from "next/server";
import { z } from "zod";

import { ACCESS_COOKIE_NAME, createAccessCookieValue } from "@/lib/auth";
import { getUser } from "@/lib/db";

const claimSchema = z.object({
  email: z.string().trim().email().max(200)
});

export async function POST(request: Request) {
  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = claimSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json({ error: "A valid purchase email is required." }, { status: 400 });
  }

  const email = parsed.data.email.toLowerCase();
  const user = await getUser(email);

  if (!user?.accessActive) {
    return NextResponse.json(
      {
        error:
          "No active purchase found for this email yet. Complete Stripe checkout first, then retry after webhook confirmation."
      },
      { status: 403 }
    );
  }

  const cookieValue = createAccessCookieValue(email);

  const response = NextResponse.json({ message: "Access confirmed. Dashboard unlocked." });
  response.cookies.set({
    name: ACCESS_COOKIE_NAME,
    value: cookieValue,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
    path: "/"
  });

  return response;
}
