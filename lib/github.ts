import type { RepoMatch, TopicConfig } from "@/lib/types";

type SearchRepositoryItem = {
  full_name: string;
  html_url: string;
  description: string | null;
  language: string | null;
  stargazers_count: number;
};

type SearchResponse = {
  items: SearchRepositoryItem[];
};

type RepoEvent = {
  type: string;
  created_at: string;
};

const GITHUB_API_BASE = "https://api.github.com";

function getHeaders(accept: string = "application/vnd.github+json"): HeadersInit {
  const token = process.env.GITHUB_TOKEN;

  if (!token) {
    return {
      Accept: accept,
      "User-Agent": "github-star-alerter"
    };
  }

  return {
    Accept: accept,
    Authorization: `Bearer ${token}`,
    "User-Agent": "github-star-alerter"
  };
}

async function githubFetch<T>(url: string, accept?: string): Promise<T> {
  const response = await fetch(url, {
    headers: getHeaders(accept),
    next: { revalidate: 0 }
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`GitHub API error ${response.status}: ${body}`);
  }

  return (await response.json()) as T;
}

async function fetchTopicCandidates(topic: string, minStars: number): Promise<SearchRepositoryItem[]> {
  const query = `topic:${topic} stars:>=${minStars} archived:false fork:false`;
  const encodedQuery = encodeURIComponent(query);
  const url = `${GITHUB_API_BASE}/search/repositories?q=${encodedQuery}&sort=updated&order=desc&per_page=20`;

  const data = await githubFetch<SearchResponse>(url);
  return data.items ?? [];
}

async function fetchRecentStarVelocity(repoFullName: string): Promise<number> {
  const url = `${GITHUB_API_BASE}/repos/${repoFullName}/events?per_page=100`;

  try {
    const events = await githubFetch<RepoEvent[]>(url);
    const now = Date.now();
    const threshold = now - 24 * 60 * 60 * 1000;

    return events.filter((event) => {
      if (event.type !== "WatchEvent") {
        return false;
      }

      const timestamp = Date.parse(event.created_at);
      return Number.isFinite(timestamp) && timestamp >= threshold;
    }).length;
  } catch {
    return 0;
  }
}

export async function scanSingleTopic(topicConfig: TopicConfig): Promise<RepoMatch[]> {
  const repos = await fetchTopicCandidates(topicConfig.topic, topicConfig.minStars);

  const checks = repos.slice(0, 12).map(async (repo): Promise<RepoMatch | null> => {
    const velocity24h = await fetchRecentStarVelocity(repo.full_name);

    if (velocity24h < topicConfig.minVelocity) {
      return null;
    }

    return {
      topic: topicConfig.topic,
      repoFullName: repo.full_name,
      url: repo.html_url,
      description: repo.description ?? "No description provided",
      language: repo.language,
      stars: repo.stargazers_count,
      velocity24h,
      matchedAt: new Date().toISOString()
    };
  });

  const rawMatches = await Promise.all(checks);

  return rawMatches
    .filter((match): match is RepoMatch => match !== null)
    .sort((a, b) => b.velocity24h - a.velocity24h || b.stars - a.stars);
}

export async function scanTopics(topics: TopicConfig[]): Promise<RepoMatch[]> {
  const allMatches = await Promise.all(topics.map((topic) => scanSingleTopic(topic)));

  return allMatches
    .flat()
    .sort((a, b) => b.velocity24h - a.velocity24h || b.stars - a.stars)
    .slice(0, 50);
}
