import { NextResponse } from "next/server";

import { hasDigestForDate, listUsersWithAccess, markDigestSent, updateScanResults } from "@/lib/db";
import { sendDailyDigestEmail } from "@/lib/email";
import { scanTopics } from "@/lib/github";

function isAuthorizedCronRequest(request: Request): boolean {
  const secret = process.env.CRON_SECRET;

  if (!secret) {
    return true;
  }

  const authHeader = request.headers.get("authorization");
  return authHeader === `Bearer ${secret}`;
}

async function runDailyDigest(request: Request) {
  if (!isAuthorizedCronRequest(request)) {
    return NextResponse.json({ error: "Unauthorized cron request." }, { status: 401 });
  }

  const users = await listUsersWithAccess();
  const dateKey = new Date().toISOString().slice(0, 10);
  const dateLabel = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric"
  });

  const summary: Array<{
    email: string;
    matchedRepos: number;
    emailed: boolean;
    reason: string | null;
  }> = [];

  for (const user of users) {
    if (user.topics.length === 0) {
      summary.push({
        email: user.email,
        matchedRepos: 0,
        emailed: false,
        reason: "No topics configured"
      });
      continue;
    }

    const alreadySent = await hasDigestForDate(user.email, dateKey);

    if (alreadySent) {
      summary.push({
        email: user.email,
        matchedRepos: user.lastMatches.length,
        emailed: false,
        reason: "Digest already sent for today"
      });
      continue;
    }

    try {
      const matches = await scanTopics(user.topics);
      await updateScanResults(user.email, matches);

      if (matches.length === 0) {
        summary.push({
          email: user.email,
          matchedRepos: 0,
          emailed: false,
          reason: "No repositories crossed thresholds"
        });
        continue;
      }

      const emailResult = await sendDailyDigestEmail({
        to: user.email,
        dateLabel,
        matches
      });

      if (emailResult.sent) {
        await markDigestSent(user.email, dateKey);
      }

      summary.push({
        email: user.email,
        matchedRepos: matches.length,
        emailed: emailResult.sent,
        reason: emailResult.reason
      });
    } catch (cause: unknown) {
      summary.push({
        email: user.email,
        matchedRepos: 0,
        emailed: false,
        reason: cause instanceof Error ? cause.message : "Unexpected digest error"
      });
    }
  }

  return NextResponse.json({
    date: dateKey,
    usersProcessed: users.length,
    summary
  });
}

export async function GET(request: Request) {
  return runDailyDigest(request);
}

export async function POST(request: Request) {
  return runDailyDigest(request);
}
