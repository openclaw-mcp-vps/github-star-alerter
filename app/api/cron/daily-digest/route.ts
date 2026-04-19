import { NextResponse } from "next/server";

import { findMatchesForTopics } from "@/lib/github";
import { sendDailyDigestEmail } from "@/lib/email";
import { getActiveSubscribers, getUserTopicConfigs } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");

  if (secret && authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const subscribers = await getActiveSubscribers();
  let emailsSent = 0;
  let usersScanned = 0;

  for (const subscriber of subscribers) {
    const { email, plan } = subscriber;
    if (!email) {
      continue;
    }

    const topics = await getUserTopicConfigs(email);
    if (topics.length === 0) {
      continue;
    }

    usersScanned += 1;

    const matches = await findMatchesForTopics(topics);
    if (matches.length === 0) {
      continue;
    }

    const byTopic = topics.map((topicConfig) => ({
      topic: topicConfig.topic,
      threshold: topicConfig.minDailyStars,
      matches: matches.filter((match) => match.topic.toLowerCase() === topicConfig.topic.toLowerCase())
    }));

    await sendDailyDigestEmail({
      to: email,
      plan,
      byTopic,
      generatedAt: new Date().toISOString()
    });

    emailsSent += 1;
  }

  return NextResponse.json({
    ok: true,
    subscribers: subscribers.length,
    usersScanned,
    emailsSent
  });
}
