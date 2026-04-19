import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import type { TopicThreshold } from "@/lib/github";

type SubscriptionRow = {
  email: string;
  status: string;
  plan: string;
  topics_limit: number | null;
  updated_at: string;
};

type TopicConfigRow = {
  user_email: string;
  topic: string;
  min_daily_stars: number;
  min_total_stars: number;
  lookback_days: number;
};

type SubscriptionUpsert = {
  email: string;
  status: string;
  plan: string;
  topicsLimit: number | null;
};

let cachedClient: SupabaseClient | null = null;

function getSupabaseAdminClient(): SupabaseClient | null {
  if (cachedClient) {
    return cachedClient;
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    return null;
  }

  cachedClient = createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  return cachedClient;
}

export async function getUserTopicConfigs(email: string): Promise<TopicThreshold[]> {
  const client = getSupabaseAdminClient();

  if (!client || !email) {
    return [];
  }

  const { data, error } = await client
    .from("topic_configs")
    .select("topic,min_daily_stars,min_total_stars,lookback_days")
    .eq("user_email", email)
    .order("topic", { ascending: true });

  if (error) {
    console.error("Failed to load topic configs", error.message);
    return [];
  }

  return (data as TopicConfigRow[]).map((row) => ({
    topic: row.topic,
    minDailyStars: row.min_daily_stars,
    minTotalStars: row.min_total_stars,
    lookbackDays: row.lookback_days
  }));
}

export async function saveUserTopicConfigs(email: string, topics: TopicThreshold[]) {
  const client = getSupabaseAdminClient();

  if (!client) {
    throw new Error("Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.");
  }

  const { error: deleteError } = await client.from("topic_configs").delete().eq("user_email", email);

  if (deleteError) {
    throw new Error(`Could not clear old topic settings: ${deleteError.message}`);
  }

  if (topics.length === 0) {
    return;
  }

  const rows: TopicConfigRow[] = topics.map((topic) => ({
    user_email: email,
    topic: topic.topic,
    min_daily_stars: topic.minDailyStars,
    min_total_stars: topic.minTotalStars,
    lookback_days: topic.lookbackDays
  }));

  const { error: insertError } = await client.from("topic_configs").insert(rows);

  if (insertError) {
    throw new Error(`Could not save topic settings: ${insertError.message}`);
  }
}

export async function upsertSubscription(payload: SubscriptionUpsert) {
  const client = getSupabaseAdminClient();

  if (!client || !payload.email) {
    return;
  }

  const row: SubscriptionRow = {
    email: payload.email,
    status: payload.status,
    plan: payload.plan,
    topics_limit: payload.topicsLimit,
    updated_at: new Date().toISOString()
  };

  const { error } = await client.from("subscriptions").upsert(row, { onConflict: "email" });

  if (error) {
    console.error("Failed to upsert subscription", error.message);
  }
}

export async function getSubscriptionByEmail(email: string) {
  const client = getSupabaseAdminClient();

  if (!client) {
    throw new Error("Supabase is not configured.");
  }

  const { data, error } = await client
    .from("subscriptions")
    .select("email,status,plan,topics_limit")
    .eq("email", email)
    .maybeSingle();

  if (error) {
    throw new Error(`Could not fetch subscription: ${error.message}`);
  }

  if (!data) {
    return null;
  }

  return {
    email: data.email as string,
    status: data.status as string,
    plan: (data.plan as string) || "starter",
    topicsLimit: (data.topics_limit as number | null) ?? 5
  };
}

export async function getActiveSubscribers() {
  const client = getSupabaseAdminClient();

  if (!client) {
    return [] as Array<{ email: string; plan: string }>;
  }

  const { data, error } = await client
    .from("subscriptions")
    .select("email,plan,status")
    .in("status", ["active", "on_trial"]);

  if (error) {
    console.error("Could not fetch active subscribers", error.message);
    return [];
  }

  return (data ?? [])
    .map((row) => ({
      email: row.email as string,
      plan: (row.plan as string) || "starter"
    }))
    .filter((row) => row.email);
}
