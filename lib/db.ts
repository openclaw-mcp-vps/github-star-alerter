import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

import type { DataStore, Plan, RepoMatch, TopicConfig, UserRecord } from "@/lib/types";

const DATA_DIR = path.join(process.cwd(), "data");
const STORE_PATH = path.join(DATA_DIR, "store.json");

const EMPTY_STORE: DataStore = {
  users: {}
};

let mutationLock: Promise<void> = Promise.resolve();

function normalizeEmail(input: string): string {
  return input.trim().toLowerCase();
}

async function ensureStoreFile(): Promise<void> {
  await mkdir(DATA_DIR, { recursive: true });

  try {
    await readFile(STORE_PATH, "utf8");
  } catch {
    await writeFile(STORE_PATH, JSON.stringify(EMPTY_STORE, null, 2), "utf8");
  }
}

async function readStore(): Promise<DataStore> {
  await ensureStoreFile();

  const raw = await readFile(STORE_PATH, "utf8");

  if (!raw.trim()) {
    return EMPTY_STORE;
  }

  try {
    const parsed = JSON.parse(raw) as DataStore;

    if (!parsed.users || typeof parsed.users !== "object") {
      return EMPTY_STORE;
    }

    return parsed;
  } catch {
    return EMPTY_STORE;
  }
}

async function writeStore(store: DataStore): Promise<void> {
  await ensureStoreFile();
  await writeFile(STORE_PATH, JSON.stringify(store, null, 2), "utf8");
}

async function withMutation<T>(mutate: (store: DataStore) => T | Promise<T>): Promise<T> {
  const previousLock = mutationLock;
  let releaseLock: () => void = () => undefined;

  mutationLock = new Promise<void>((resolve) => {
    releaseLock = resolve;
  });

  await previousLock;

  try {
    const store = await readStore();
    const result = await mutate(store);
    await writeStore(store);
    return result;
  } finally {
    releaseLock();
  }
}

function getOrCreateUser(store: DataStore, email: string): UserRecord {
  const key = normalizeEmail(email);

  if (!store.users[key]) {
    store.users[key] = {
      email: key,
      plan: "starter",
      accessActive: false,
      purchasedAt: new Date().toISOString(),
      topics: [],
      lastDigestDate: null,
      lastScanAt: null,
      lastMatches: []
    };
  }

  return store.users[key];
}

export async function grantAccess(email: string, plan: Plan): Promise<UserRecord> {
  return withMutation((store) => {
    const user = getOrCreateUser(store, email);
    user.accessActive = true;
    user.plan = plan;
    user.purchasedAt = new Date().toISOString();
    return user;
  });
}

export async function getUser(email: string): Promise<UserRecord | null> {
  const store = await readStore();
  const key = normalizeEmail(email);
  return store.users[key] ?? null;
}

export async function listUsersWithAccess(): Promise<UserRecord[]> {
  const store = await readStore();
  return Object.values(store.users).filter((user) => user.accessActive);
}

export async function addTopic(
  email: string,
  topic: string,
  minStars: number,
  minVelocity: number
): Promise<UserRecord> {
  return withMutation((store) => {
    const user = getOrCreateUser(store, email);

    const normalizedTopic = topic.trim().toLowerCase();
    const existingTopic = user.topics.find((item) => item.topic === normalizedTopic);

    if (existingTopic) {
      existingTopic.minStars = minStars;
      existingTopic.minVelocity = minVelocity;
      return user;
    }

    if (user.plan === "starter" && user.topics.length >= 5) {
      throw new Error("Starter plan supports up to 5 topics.");
    }

    const newTopic: TopicConfig = {
      id: randomUUID(),
      topic: normalizedTopic,
      minStars,
      minVelocity,
      createdAt: new Date().toISOString()
    };

    user.topics.push(newTopic);
    return user;
  });
}

export async function removeTopic(email: string, topicId: string): Promise<UserRecord> {
  return withMutation((store) => {
    const user = getOrCreateUser(store, email);
    user.topics = user.topics.filter((topic) => topic.id !== topicId);
    return user;
  });
}

export async function updateScanResults(email: string, matches: RepoMatch[]): Promise<UserRecord> {
  return withMutation((store) => {
    const user = getOrCreateUser(store, email);
    user.lastScanAt = new Date().toISOString();
    user.lastMatches = matches;
    return user;
  });
}

export async function hasDigestForDate(email: string, dateKey: string): Promise<boolean> {
  const user = await getUser(email);
  return user?.lastDigestDate === dateKey;
}

export async function markDigestSent(email: string, dateKey: string): Promise<UserRecord> {
  return withMutation((store) => {
    const user = getOrCreateUser(store, email);
    user.lastDigestDate = dateKey;
    return user;
  });
}

export async function listTopics(email: string): Promise<TopicConfig[]> {
  const user = await getUser(email);
  return user?.topics ?? [];
}
