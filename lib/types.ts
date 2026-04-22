export type Plan = "starter" | "pro";

export type TopicConfig = {
  id: string;
  topic: string;
  minStars: number;
  minVelocity: number;
  createdAt: string;
};

export type RepoMatch = {
  topic: string;
  repoFullName: string;
  url: string;
  description: string;
  language: string | null;
  stars: number;
  velocity24h: number;
  matchedAt: string;
};

export type UserRecord = {
  email: string;
  plan: Plan;
  accessActive: boolean;
  purchasedAt: string;
  topics: TopicConfig[];
  lastDigestDate: string | null;
  lastScanAt: string | null;
  lastMatches: RepoMatch[];
};

export type DataStore = {
  users: Record<string, UserRecord>;
};
