import crypto from "node:crypto";
import { z } from "zod";

const webhookSchema = z.object({
  meta: z
    .object({
      event_name: z.string()
    })
    .optional(),
  data: z
    .object({
      attributes: z.record(z.unknown()).optional()
    })
    .optional()
});

export function isValidLemonSqueezySignature(rawBody: string, signature: string, secret: string) {
  if (!signature || !secret) {
    return false;
  }

  const digest = crypto.createHmac("sha256", secret).update(rawBody, "utf8").digest("hex");
  return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(signature));
}

export function parseLemonSqueezyWebhook(rawBody: string) {
  try {
    return webhookSchema.parse(JSON.parse(rawBody));
  } catch {
    return null;
  }
}

function getPlanFromAttributes(attributes: Record<string, unknown>) {
  const variantName = String(attributes.variant_name ?? "").toLowerCase();
  const productName = String(attributes.product_name ?? "").toLowerCase();
  const candidate = `${variantName} ${productName}`;

  if (candidate.includes("unlimited")) {
    return { plan: "unlimited", topicsLimit: null as number | null };
  }

  return { plan: "starter", topicsLimit: 5 };
}

export function inferSubscriptionFromWebhook(payload: z.infer<typeof webhookSchema>) {
  const attributes = payload.data?.attributes ?? {};
  const eventName = payload.meta?.event_name ?? "unknown";

  const emailCandidate = [
    attributes.user_email,
    attributes.customer_email,
    attributes.email,
    typeof attributes.custom_data === "object" && attributes.custom_data
      ? (attributes.custom_data as Record<string, unknown>).email
      : undefined
  ].find((value) => typeof value === "string" && value.length > 3) as string | undefined;

  if (!emailCandidate) {
    return null;
  }

  const status = eventName.includes("cancel")
    ? "cancelled"
    : (String(attributes.status ?? "active") || "active").toLowerCase();

  const planInfo = getPlanFromAttributes(attributes);

  return {
    email: emailCandidate.toLowerCase(),
    status,
    plan: planInfo.plan,
    topicsLimit: planInfo.topicsLimit
  };
}
