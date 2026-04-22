import { Resend } from "resend";

import type { RepoMatch } from "@/lib/types";

type DailyDigestInput = {
  to: string;
  dateLabel: string;
  matches: RepoMatch[];
};

type DailyDigestResult = {
  sent: boolean;
  providerId: string | null;
  reason: string | null;
};

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? "alerts@githubstaralerter.com";

function buildTopicSections(matches: RepoMatch[]): string {
  const grouped = matches.reduce<Record<string, RepoMatch[]>>((accumulator, item) => {
    const key = item.topic;

    if (!accumulator[key]) {
      accumulator[key] = [];
    }

    accumulator[key].push(item);
    return accumulator;
  }, {});

  return Object.entries(grouped)
    .map(([topic, topicMatches]) => {
      const rows = topicMatches
        .map(
          (match) => `<li style="margin-bottom:12px;">
<a href="${match.url}" style="color:#58a6ff;text-decoration:none;font-weight:600;">${match.repoFullName}</a>
<div style="color:#8b949e;font-size:14px;">${match.description}</div>
<div style="color:#c9d1d9;font-size:13px;">${match.stars.toLocaleString()} total stars • ${match.velocity24h} stars in last 24h • ${match.language ?? "Unknown"}</div>
</li>`
        )
        .join("");

      return `<section style="margin-top:20px;">
<h2 style="font-size:18px;color:#f0f6fc;margin-bottom:8px;">#${topic}</h2>
<ul style="list-style:none;padding:0;margin:0;">${rows}</ul>
</section>`;
    })
    .join("");
}

export async function sendDailyDigestEmail(input: DailyDigestInput): Promise<DailyDigestResult> {
  if (!process.env.RESEND_API_KEY) {
    return {
      sent: false,
      providerId: null,
      reason: "RESEND_API_KEY is not configured"
    };
  }

  const resend = new Resend(process.env.RESEND_API_KEY);

  const html = `
<div style="font-family:ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica Neue, Arial; background:#0d1117; color:#c9d1d9; padding:24px;">
  <h1 style="margin:0;color:#f0f6fc;font-size:24px;">GitHub Star Alerter</h1>
  <p style="margin-top:8px;color:#8b949e;">Daily market-intel digest for ${input.dateLabel}</p>
  <p style="margin-top:16px;">${input.matches.length} repositories crossed your star velocity thresholds.</p>
  ${buildTopicSections(input.matches)}
  <p style="margin-top:24px;color:#8b949e;font-size:12px;">Update your thresholds anytime from your dashboard.</p>
</div>`;

  const textLines = input.matches.map(
    (match) => `${match.repoFullName} (${match.topic}) - ${match.velocity24h}/24h stars - ${match.url}`
  );

  const response = await resend.emails.send({
    from: FROM_EMAIL,
    to: input.to,
    subject: `GitHub Star Alerter: ${input.matches.length} high-velocity repos (${input.dateLabel})`,
    html,
    text: textLines.join("\n")
  });

  return {
    sent: Boolean(response.data?.id),
    providerId: response.data?.id ?? null,
    reason: response.error?.message ?? null
  };
}
