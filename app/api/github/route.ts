import { NextResponse } from "next/server";
import { z } from "zod";

import { findMatchesForTopics, topicThresholdSchema } from "@/lib/github";
import { saveUserTopicConfigs } from "@/lib/supabase";

const previewSchema = z.object({
  action: z.literal("preview"),
  topics: z.array(topicThresholdSchema).min(1).max(25)
});

const saveConfigSchema = z.object({
  action: z.literal("save_config"),
  email: z.string().email(),
  topics: z.array(topicThresholdSchema).max(200)
});

const requestSchema = z.discriminatedUnion("action", [previewSchema, saveConfigSchema]);

export async function POST(request: Request) {
  try {
    const payload = requestSchema.parse(await request.json());

    if (payload.action === "preview") {
      const matches = await findMatchesForTopics(payload.topics);
      return NextResponse.json({ matches });
    }

    await saveUserTopicConfigs(payload.email, payload.topics);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Request failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
