import { Resend } from "resend";

import type { RepoMatch } from "@/lib/github";

type TopicDigestBlock = {
  topic: string;
  threshold: number;
  matches: RepoMatch[];
};

type DailyDigestInput = {
  to: string;
  plan: string;
  byTopic: TopicDigestBlock[];
  generatedAt: string;
};

function buildDigestHtml(input: DailyDigestInput) {
  const topicSections = input.byTopic
    .filter((block) => block.matches.length > 0)
    .map((block) => {
      const rows = block.matches
        .map(
          (repo) => `
            <tr>
              <td style="padding:10px;border-bottom:1px solid #2f3742;vertical-align:top;">
                <a href="${repo.url}" style="color:#7dd3fc;text-decoration:none;font-weight:600;">${repo.repoFullName}</a>
                <div style="font-size:12px;color:#94a3b8;margin-top:4px;">${repo.description || "No description"}</div>
              </td>
              <td style="padding:10px;border-bottom:1px solid #2f3742;color:#86efac;text-align:right;white-space:nowrap;">${repo.dailyStars.toFixed(1)}/day</td>
              <td style="padding:10px;border-bottom:1px solid #2f3742;color:#cbd5e1;text-align:right;white-space:nowrap;">${repo.totalStars.toLocaleString()}</td>
            </tr>
          `
        )
        .join("");

      return `
        <section style="margin-top:20px;">
          <h2 style="margin:0 0 8px 0;color:#e2e8f0;font-size:16px;">#${block.topic}</h2>
          <p style="margin:0 0 10px 0;color:#94a3b8;font-size:12px;">Threshold: ${block.threshold}+ stars/day</p>
          <table width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;border:1px solid #2f3742;border-radius:8px;overflow:hidden;">
            <thead>
              <tr style="background:#111827;">
                <th style="text-align:left;padding:10px;color:#cbd5e1;font-size:12px;border-bottom:1px solid #2f3742;">Repository</th>
                <th style="text-align:right;padding:10px;color:#cbd5e1;font-size:12px;border-bottom:1px solid #2f3742;">Velocity</th>
                <th style="text-align:right;padding:10px;color:#cbd5e1;font-size:12px;border-bottom:1px solid #2f3742;">Total Stars</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </section>
      `;
    })
    .join("");

  return `
    <div style="background:#0d1117;color:#e2e8f0;padding:24px;font-family:Inter,ui-sans-serif,system-ui,-apple-system,Segoe UI,sans-serif;">
      <h1 style="margin:0 0 6px 0;font-size:20px;">GitHub Star Alerter Daily Digest</h1>
      <p style="margin:0 0 18px 0;color:#94a3b8;font-size:13px;">Generated ${new Date(input.generatedAt).toUTCString()} • Plan: ${input.plan}</p>
      ${topicSections || "<p style=\"color:#94a3b8;\">No repositories crossed your thresholds today.</p>"}
      <p style="margin-top:20px;color:#64748b;font-size:12px;">You are receiving this because your subscription is active in GitHub Star Alerter.</p>
    </div>
  `;
}

export async function sendDailyDigestEmail(input: DailyDigestInput) {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.warn("RESEND_API_KEY is missing. Skipping digest send.");
    return { skipped: true };
  }

  const resend = new Resend(apiKey);
  const from = process.env.DIGEST_FROM_EMAIL ?? "alerts@githubstaralerter.com";

  const totalMatches = input.byTopic.reduce((sum, block) => sum + block.matches.length, 0);

  await resend.emails.send({
    from,
    to: input.to,
    subject: `GitHub Star Digest: ${totalMatches} repos crossed your thresholds`,
    html: buildDigestHtml(input)
  });

  return { sent: true };
}
