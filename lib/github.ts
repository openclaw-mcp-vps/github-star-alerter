import { z } from "zod";

export const topicThresholdSchema = z.object({
  topic: z.string().trim().min(2).max(39),
  minDailyStars: z.number().int().min(1).max(300),
  minTotalStars: z.number().int().min(10).max(2000000),
  lookbackDays: z.number().int().min(1).max(14)
});

export type TopicThreshold = z.infer<typeof topicThresholdSchema>;

export type RepoMatch = {
  topic: string;
  repoFullName: string;
  url: string;
  description: string;
  totalStars: number;
  dailyStars: number;
  starsInLookback: number;
  lookbackDays: number;
  language: string | null;
  pushedAt: string;
};

type GitHubSearchRepo = {
  full_name: string;
  html_url: string;
  description: string | null;
  stargazers_count: number;
  pushed_at: string;
  language: string | null;
  created_at: string;
};

function githubHeaders() {
  const token = process.env.GITHUB_TOKEN;

  return {
    Accept: "application/vnd.github+json",
    "User-Agent": "github-star-alerter",
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
}

async function searchTopicRepositories(topicConfig: TopicThreshold): Promise<GitHubSearchRepo[]> {
  const query = [
    `topic:${topicConfig.topic}`,
    `stars:>=${topicConfig.minTotalStars}`,
    "archived:false",
    "fork:false"
  ].join(" ");

  const params = new URLSearchParams({
    q: query,
    sort: "updated",
    order: "desc",
    per_page: "20"
  });

  const response = await fetch(`https://api.github.com/search/repositories?${params.toString()}`, {
    headers: githubHeaders(),
    next: { revalidate: 0 }
  });

  if (!response.ok) {
    throw new Error(`GitHub search failed for topic "${topicConfig.topic}" with ${response.status}`);
  }

  const payload = (await response.json()) as { items: GitHubSearchRepo[] };
  return payload.items ?? [];
}

async function fetchStarsInLookback(repoFullName: string, lookbackDays: number): Promise<number | null> {
  const [owner, repo] = repoFullName.split("/");
  if (!owner || !repo) {
    return null;
  }

  const since = new Date(Date.now() - lookbackDays * 24 * 60 * 60 * 1000);

  const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/stargazers?per_page=100`, {
    headers: {
      ...githubHeaders(),
      Accept: "application/vnd.github.star+json"
    },
    next: { revalidate: 0 }
  });

  if (!response.ok) {
    return null;
  }

  const payload = (await response.json()) as Array<{ starred_at?: string }>;
  const recent = payload.filter((entry) => {
    if (!entry.starred_at) {
      return false;
    }

    return new Date(entry.starred_at).getTime() >= since.getTime();
  });

  return recent.length;
}

function heuristicLookbackStars(totalStars: number, createdAt: string, lookbackDays: number) {
  const ageMs = Date.now() - new Date(createdAt).getTime();
  const ageDays = Math.max(1, ageMs / (24 * 60 * 60 * 1000));
  const starsPerDay = totalStars / ageDays;
  return Math.round(starsPerDay * lookbackDays);
}

async function withConcurrency<T, U>(
  items: T[],
  limit: number,
  run: (item: T, index: number) => Promise<U>
): Promise<U[]> {
  const results: U[] = [];
  const executing = new Set<Promise<void>>();

  for (let index = 0; index < items.length; index += 1) {
    const item = items[index];
    const task = run(item, index).then((result) => {
      results.push(result);
    });

    const tracked = task.finally(() => {
      executing.delete(tracked);
    });

    executing.add(tracked);

    if (executing.size >= limit) {
      await Promise.race(executing);
    }
  }

  await Promise.all(executing);
  return results;
}

export async function findMatchesForTopic(topicConfig: TopicThreshold): Promise<RepoMatch[]> {
  const repos = await searchTopicRepositories(topicConfig);

  const rawMatches = await withConcurrency(repos, 4, async (repo) => {
    const exactLookbackStars = await fetchStarsInLookback(repo.full_name, topicConfig.lookbackDays);
    const starsInLookback =
      typeof exactLookbackStars === "number"
        ? exactLookbackStars
        : heuristicLookbackStars(repo.stargazers_count, repo.created_at, topicConfig.lookbackDays);

    const dailyStars = Number((starsInLookback / topicConfig.lookbackDays).toFixed(2));

    if (dailyStars < topicConfig.minDailyStars) {
      return null;
    }

    return {
      topic: topicConfig.topic,
      repoFullName: repo.full_name,
      url: repo.html_url,
      description: repo.description ?? "",
      totalStars: repo.stargazers_count,
      dailyStars,
      starsInLookback,
      lookbackDays: topicConfig.lookbackDays,
      language: repo.language,
      pushedAt: repo.pushed_at
    } satisfies RepoMatch;
  });

  return rawMatches
    .filter((repo): repo is RepoMatch => repo !== null)
    .sort((a, b) => b.dailyStars - a.dailyStars || b.totalStars - a.totalStars)
    .slice(0, 25);
}

export async function findMatchesForTopics(topicConfigs: TopicThreshold[]): Promise<RepoMatch[]> {
  const parsedTopics = z.array(topicThresholdSchema).parse(topicConfigs);

  const perTopic = await Promise.all(parsedTopics.map((topicConfig) => findMatchesForTopic(topicConfig)));

  return perTopic.flat().sort((a, b) => b.dailyStars - a.dailyStars || b.totalStars - a.totalStars);
}
