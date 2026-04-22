import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";

import { ACCESS_COOKIE_NAME, verifyAccessCookieValue } from "@/lib/auth";
import { addTopic, getUser, removeTopic, updateScanResults } from "@/lib/db";
import { scanTopics } from "@/lib/github";

const addTopicSchema = z.object({
  topic: z
    .string()
    .trim()
    .min(1)
    .max(48)
    .regex(/^[a-z0-9-]+$/i, "Topic can include letters, numbers, and hyphens."),
  minStars: z.coerce.number().int().min(1).max(500000),
  minVelocity: z.coerce.number().int().min(1).max(50000)
});

const deleteTopicSchema = z.object({
  topicId: z.string().min(1).max(100)
});

function parseError(cause: unknown): string {
  if (cause instanceof Error) {
    return cause.message;
  }

  return "Unexpected server error.";
}

async function getAuthorizedUser() {
  const cookieStore = await cookies();
  const accessCookie = cookieStore.get(ACCESS_COOKIE_NAME)?.value;
  const email = verifyAccessCookieValue(accessCookie);

  if (!email) {
    return null;
  }

  const user = await getUser(email);

  if (!user?.accessActive) {
    return null;
  }

  return user;
}

function toPayload(user: NonNullable<Awaited<ReturnType<typeof getAuthorizedUser>>>) {
  return {
    user: {
      email: user.email,
      plan: user.plan,
      accessActive: user.accessActive
    },
    topics: user.topics,
    lastScanAt: user.lastScanAt,
    lastMatches: user.lastMatches
  };
}

export async function GET(request: Request) {
  const user = await getAuthorizedUser();

  if (!user) {
    return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  }

  const searchParams = new URL(request.url).searchParams;
  const shouldScan = searchParams.get("scan") === "1";

  if (!shouldScan) {
    return NextResponse.json(toPayload(user));
  }

  try {
    const matches = user.topics.length > 0 ? await scanTopics(user.topics) : [];
    const updatedUser = await updateScanResults(user.email, matches);
    return NextResponse.json(toPayload(updatedUser));
  } catch (cause: unknown) {
    return NextResponse.json({ error: parseError(cause) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const user = await getAuthorizedUser();

  if (!user) {
    return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  }

  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = addTopicSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid payload." }, { status: 400 });
  }

  try {
    const updatedUser = await addTopic(
      user.email,
      parsed.data.topic,
      parsed.data.minStars,
      parsed.data.minVelocity
    );

    return NextResponse.json(toPayload(updatedUser));
  } catch (cause: unknown) {
    return NextResponse.json({ error: parseError(cause) }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  const user = await getAuthorizedUser();

  if (!user) {
    return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  }

  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = deleteTopicSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json({ error: "topicId is required." }, { status: 400 });
  }

  try {
    const updatedUser = await removeTopic(user.email, parsed.data.topicId);
    return NextResponse.json(toPayload(updatedUser));
  } catch (cause: unknown) {
    return NextResponse.json({ error: parseError(cause) }, { status: 500 });
  }
}
