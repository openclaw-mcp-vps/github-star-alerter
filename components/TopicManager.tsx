"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { Loader2, RefreshCw, Trash2, TrendingUp } from "lucide-react";

import type { RepoMatch, TopicConfig } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type DashboardResponse = {
  user: {
    email: string;
    plan: "starter" | "pro";
    accessActive: boolean;
  };
  topics: TopicConfig[];
  lastScanAt: string | null;
  lastMatches: RepoMatch[];
};

export function TopicManager() {
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [topic, setTopic] = useState("");
  const [minStars, setMinStars] = useState("150");
  const [minVelocity, setMinVelocity] = useState("12");
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const refreshData = useCallback(async () => {
    const response = await fetch("/api/github", { method: "GET" });
    const payload = (await response.json()) as DashboardResponse & { error?: string };

    if (!response.ok) {
      throw new Error(payload.error ?? "Unable to load dashboard data.");
    }

    setData(payload);
  }, []);

  useEffect(() => {
    refreshData().catch((cause: unknown) => {
      if (cause instanceof Error) {
        setError(cause.message);
      } else {
        setError("Unable to load dashboard data.");
      }
    });
  }, [refreshData]);

  const topicLimit = data?.user.plan === "starter" ? 5 : Infinity;
  const reachedLimit = useMemo(() => {
    if (!data) {
      return false;
    }

    return data.user.plan === "starter" && data.topics.length >= 5;
  }, [data]);

  const addTopic = () => {
    setError(null);
    setStatus(null);

    startTransition(async () => {
      try {
        const response = await fetch("/api/github", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            topic,
            minStars: Number(minStars),
            minVelocity: Number(minVelocity)
          })
        });

        const payload = (await response.json()) as DashboardResponse & { error?: string };

        if (!response.ok) {
          throw new Error(payload.error ?? "Unable to save topic.");
        }

        setData(payload);
        setTopic("");
        setStatus(`Topic saved. Monitoring ${payload.topics.length} topic${payload.topics.length === 1 ? "" : "s"}.`);
      } catch (cause: unknown) {
        if (cause instanceof Error) {
          setError(cause.message);
        } else {
          setError("Unable to save topic.");
        }
      }
    });
  };

  const removeTopic = (topicId: string) => {
    setError(null);
    setStatus(null);

    startTransition(async () => {
      try {
        const response = await fetch("/api/github", {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ topicId })
        });

        const payload = (await response.json()) as DashboardResponse & { error?: string };

        if (!response.ok) {
          throw new Error(payload.error ?? "Unable to remove topic.");
        }

        setData(payload);
      } catch (cause: unknown) {
        if (cause instanceof Error) {
          setError(cause.message);
        } else {
          setError("Unable to remove topic.");
        }
      }
    });
  };

  const runScan = () => {
    setError(null);
    setStatus("Scanning GitHub for high-velocity repositories...");

    startTransition(async () => {
      try {
        const response = await fetch("/api/github?scan=1", {
          method: "GET"
        });

        const payload = (await response.json()) as DashboardResponse & { error?: string };

        if (!response.ok) {
          throw new Error(payload.error ?? "Scan failed.");
        }

        setData(payload);
        setStatus(`Scan complete. Found ${payload.lastMatches.length} matching repositories.`);
      } catch (cause: unknown) {
        if (cause instanceof Error) {
          setError(cause.message);
        } else {
          setError("Scan failed.");
        }
      }
    });
  };

  if (!data) {
    return (
      <div className="flex min-h-[320px] items-center justify-center rounded-xl border border-[#30363d] bg-[#111827]">
        <Loader2 className="h-6 w-6 animate-spin text-[#58a6ff]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle>Topic Tracker</CardTitle>
              <CardDescription>
                Signed in as {data.user.email}. Your {data.user.plan === "starter" ? "Starter" : "Pro"} plan allows{" "}
                {Number.isFinite(topicLimit) ? `${topicLimit} topics` : "unlimited topics"}.
              </CardDescription>
            </div>
            <Button onClick={runScan} variant="secondary">
              <RefreshCw className="mr-2 h-4 w-4" />
              Run Scan Now
            </Button>
          </div>
        </CardHeader>

        <CardContent className="grid gap-3 md:grid-cols-4">
          <div className="md:col-span-2">
            <Label htmlFor="topic">GitHub topic</Label>
            <Input
              className="mt-2"
              id="topic"
              onChange={(event) => setTopic(event.target.value)}
              placeholder="ai-agent, devtools, postgres"
              value={topic}
            />
          </div>

          <div>
            <Label htmlFor="min-stars">Minimum stars</Label>
            <Input
              className="mt-2"
              id="min-stars"
              min={1}
              onChange={(event) => setMinStars(event.target.value)}
              type="number"
              value={minStars}
            />
          </div>

          <div>
            <Label htmlFor="min-velocity">Min stars in 24h</Label>
            <Input
              className="mt-2"
              id="min-velocity"
              min={1}
              onChange={(event) => setMinVelocity(event.target.value)}
              type="number"
              value={minVelocity}
            />
          </div>
        </CardContent>

        <CardFooter className="flex flex-wrap items-center justify-between gap-3">
          <Button disabled={isPending || reachedLimit || topic.trim().length === 0} onClick={addTopic}>
            Save Topic Threshold
          </Button>
          <p className="text-sm text-[#8b949e]">
            {data.topics.length} configured topic{data.topics.length === 1 ? "" : "s"}
            {data.user.plan === "starter" ? " (limit 5)" : ""}
          </p>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Configured Topics</CardTitle>
          <CardDescription>Each topic fires when a repository crosses both thresholds.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {data.topics.length === 0 ? (
            <p className="text-sm text-[#8b949e]">No topics configured yet. Add your first market segment above.</p>
          ) : (
            data.topics.map((item) => (
              <div
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[#30363d] bg-[#0d1117] p-3"
                key={item.id}
              >
                <div className="flex items-center gap-2">
                  <Badge>#{item.topic}</Badge>
                  <span className="text-sm text-[#8b949e]">
                    {item.minStars}+ total stars • {item.minVelocity}+ stars in 24h
                  </span>
                </div>

                <Button onClick={() => removeTopic(item.id)} size="sm" variant="ghost">
                  <Trash2 className="mr-1 h-4 w-4" />
                  Remove
                </Button>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Latest Matches</CardTitle>
          <CardDescription>
            {data.lastScanAt
              ? `Last scan: ${new Date(data.lastScanAt).toLocaleString()}`
              : "Run your first scan to populate high-velocity repositories."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {data.lastMatches.length === 0 ? (
            <p className="text-sm text-[#8b949e]">No repositories currently exceed your configured thresholds.</p>
          ) : (
            data.lastMatches.map((match) => (
              <article className="rounded-lg border border-[#30363d] bg-[#0d1117] p-4" key={`${match.topic}-${match.repoFullName}`}>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline">#{match.topic}</Badge>
                  <a
                    className="font-semibold text-[#58a6ff] hover:text-[#79c0ff]"
                    href={match.url}
                    rel="noreferrer"
                    target="_blank"
                  >
                    {match.repoFullName}
                  </a>
                </div>

                <p className="mt-2 text-sm text-[#c9d1d9]">{match.description}</p>

                <div className="mt-3 flex flex-wrap gap-3 text-xs text-[#8b949e]">
                  <span>{match.stars.toLocaleString()} total stars</span>
                  <span className="inline-flex items-center gap-1 text-[#2ea043]">
                    <TrendingUp className="h-3.5 w-3.5" />
                    {match.velocity24h} stars in 24h
                  </span>
                  <span>{match.language ?? "Unknown language"}</span>
                </div>
              </article>
            ))
          )}
        </CardContent>
      </Card>

      {status ? <p className="text-sm text-[#2ea043]">{status}</p> : null}
      {error ? <p className="text-sm text-[#f85149]">{error}</p> : null}
    </div>
  );
}
