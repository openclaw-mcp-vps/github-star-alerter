"use client";

import { FormEvent, useMemo, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import * as Select from "@radix-ui/react-select";
import { ChevronDown, CircleHelp, Loader2, Plus, Trash2 } from "lucide-react";
import { z } from "zod";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type TopicThreshold = {
  topic: string;
  minDailyStars: number;
  minTotalStars: number;
  lookbackDays: number;
};

type RepoMatch = {
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

type TopicConfigProps = {
  email: string;
  plan: string;
  initialTopics: TopicThreshold[];
};

const topicRuleSchema = z.object({
  topic: z
    .string()
    .trim()
    .min(2, "Topic must have at least 2 characters")
    .max(39, "Topic must be 39 characters or fewer")
    .regex(/^[a-z0-9-]+$/i, "Use letters, numbers, or dashes"),
  minDailyStars: z.number().int().min(1).max(200),
  minTotalStars: z.number().int().min(10).max(500000),
  lookbackDays: z.number().int().min(1).max(14)
});

const topicArraySchema = z.array(topicRuleSchema).max(200);

const defaultTopic: TopicThreshold = {
  topic: "developer-tools",
  minDailyStars: 8,
  minTotalStars: 200,
  lookbackDays: 3
};

export function TopicConfig({ email, plan, initialTopics }: TopicConfigProps) {
  const [topics, setTopics] = useState<TopicThreshold[]>(
    initialTopics.length > 0 ? initialTopics : [defaultTopic]
  );
  const [matches, setMatches] = useState<RepoMatch[]>([]);
  const [scanMode, setScanMode] = useState<"strict" | "broad">("strict");
  const [isSaving, setIsSaving] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [message, setMessage] = useState("");

  const topicCap = plan === "unlimited" ? Infinity : 5;
  const canAddTopic = topics.length < topicCap;

  const groupedMatches = useMemo(() => {
    const groups = new Map<string, RepoMatch[]>();

    for (const match of matches) {
      const key = match.topic.toLowerCase();
      const existing = groups.get(key) ?? [];
      existing.push(match);
      groups.set(key, existing);
    }

    return groups;
  }, [matches]);

  function updateTopic(index: number, patch: Partial<TopicThreshold>) {
    setTopics((current) => {
      const clone = [...current];
      clone[index] = {
        ...clone[index],
        ...patch
      };
      return clone;
    });
  }

  function addTopic() {
    if (!canAddTopic) {
      setMessage(`Your plan allows ${topicCap} topics. Upgrade to Unlimited for more.`);
      return;
    }

    setTopics((current) => [
      ...current,
      {
        topic: "",
        minDailyStars: 5,
        minTotalStars: 120,
        lookbackDays: 3
      }
    ]);
  }

  function removeTopic(index: number) {
    setTopics((current) => current.filter((_, itemIndex) => itemIndex !== index));
  }

  function normalizeTopics() {
    const normalized = topics.map((topic) => ({
      ...topic,
      topic: topic.topic.trim().toLowerCase()
    }));

    return topicArraySchema.parse(normalized);
  }

  async function saveConfig(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    if (!email) {
      setMessage("Missing subscriber email cookie. Re-claim access from the paywall screen.");
      return;
    }

    try {
      setIsSaving(true);
      const payload = normalizeTopics();

      const response = await fetch("/api/github", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          action: "save_config",
          email,
          topics: payload
        })
      });

      if (!response.ok) {
        const body = (await response.json()) as { error?: string };
        throw new Error(body.error ?? "Unable to save topic settings.");
      }

      setMessage("Topic settings saved. Daily digest will use this configuration.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not save settings.");
    } finally {
      setIsSaving(false);
    }
  }

  async function runPreview() {
    setMessage("");

    try {
      setIsScanning(true);
      const payload = normalizeTopics().map((topic) => {
        if (scanMode === "broad") {
          return {
            ...topic,
            minDailyStars: Math.max(1, topic.minDailyStars - 2),
            minTotalStars: Math.max(10, Math.floor(topic.minTotalStars * 0.75))
          };
        }

        return topic;
      });

      const response = await fetch("/api/github", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          action: "preview",
          topics: payload
        })
      });

      if (!response.ok) {
        const body = (await response.json()) as { error?: string };
        throw new Error(body.error ?? "Preview scan failed.");
      }

      const body = (await response.json()) as { matches: RepoMatch[] };
      setMatches(body.matches ?? []);

      if ((body.matches ?? []).length === 0) {
        setMessage("No repositories crossed your thresholds in this scan.");
      }
    } catch (error) {
      setMatches([]);
      setMessage(error instanceof Error ? error.message : "Could not run preview.");
    } finally {
      setIsScanning(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.15fr_1fr]">
      <Card className="border-slate-700 bg-slate-900/70">
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <div>
              <CardTitle className="text-slate-100">Topic Rules</CardTitle>
              <CardDescription className="text-slate-300">
                Define what qualifies as a breakout repo in each niche.
              </CardDescription>
            </div>
            <Dialog.Root>
              <Dialog.Trigger asChild>
                <Button variant="outline" size="sm" className="border-slate-600 bg-slate-900">
                  <CircleHelp className="mr-2 h-4 w-4" />
                  How It Works
                </Button>
              </Dialog.Trigger>
              <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 z-40 bg-black/70" />
                <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[92vw] max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-xl border border-slate-700 bg-slate-950 p-6">
                  <Dialog.Title className="text-lg font-semibold text-slate-100">Threshold tuning guide</Dialog.Title>
                  <Dialog.Description className="mt-3 text-sm text-slate-300">
                    Use <strong>minimum daily stars</strong> to capture momentum and <strong>minimum total stars</strong> to
                    remove tiny noise repos. A lookback of 3 days usually balances speed and confidence.
                  </Dialog.Description>
                  <ul className="mt-4 space-y-2 text-sm text-slate-300">
                    <li>Early-signal mode: 4 to 8 stars/day, 80+ total stars</li>
                    <li>Mid-stage signal: 8 to 15 stars/day, 250+ total stars</li>
                    <li>Late confirmation: 15+ stars/day, 1000+ total stars</li>
                  </ul>
                  <Dialog.Close asChild>
                    <Button className="mt-5">Close</Button>
                  </Dialog.Close>
                </Dialog.Content>
              </Dialog.Portal>
            </Dialog.Root>
          </div>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={saveConfig}>
            {topics.map((topic, index) => (
              <div key={`${topic.topic}-${index}`} className="rounded-lg border border-slate-700 bg-slate-950/60 p-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Topic</label>
                    <Input
                      value={topic.topic}
                      onChange={(event) => updateTopic(index, { topic: event.target.value })}
                      placeholder="e.g. ai-agents"
                      className="mt-1 bg-slate-950"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                      Min daily stars
                    </label>
                    <Input
                      type="number"
                      min={1}
                      max={200}
                      value={topic.minDailyStars}
                      onChange={(event) =>
                        updateTopic(index, { minDailyStars: Number.parseInt(event.target.value, 10) || 1 })
                      }
                      className="mt-1 bg-slate-950"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                      Min total stars
                    </label>
                    <Input
                      type="number"
                      min={10}
                      value={topic.minTotalStars}
                      onChange={(event) =>
                        updateTopic(index, { minTotalStars: Number.parseInt(event.target.value, 10) || 10 })
                      }
                      className="mt-1 bg-slate-950"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                      Lookback days
                    </label>
                    <Input
                      type="number"
                      min={1}
                      max={14}
                      value={topic.lookbackDays}
                      onChange={(event) =>
                        updateTopic(index, { lookbackDays: Number.parseInt(event.target.value, 10) || 1 })
                      }
                      className="mt-1 bg-slate-950"
                    />
                  </div>
                  <div className="flex items-end justify-end">
                    <Button
                      type="button"
                      variant="outline"
                      className="border-slate-700 text-slate-300"
                      onClick={() => removeTopic(index)}
                      disabled={topics.length <= 1}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Remove
                    </Button>
                  </div>
                </div>
              </div>
            ))}

            <div className="flex flex-wrap items-center gap-3">
              <Button type="button" variant="outline" className="border-slate-700" onClick={addTopic}>
                <Plus className="mr-2 h-4 w-4" />
                Add Topic
              </Button>

              <Button type="submit" disabled={isSaving}>
                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Save Config
              </Button>

              <Button type="button" variant="secondary" disabled={isScanning} onClick={runPreview}>
                {isScanning ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Run Preview Scan
              </Button>

              <div>
                <Select.Root value={scanMode} onValueChange={(value) => setScanMode(value as "strict" | "broad")}
>
                  <Select.Trigger className="inline-flex h-10 min-w-36 items-center justify-between rounded-md border border-slate-700 bg-slate-950 px-3 text-sm text-slate-200">
                    <Select.Value placeholder="Scan mode" />
                    <Select.Icon>
                      <ChevronDown className="h-4 w-4" />
                    </Select.Icon>
                  </Select.Trigger>
                  <Select.Portal>
                    <Select.Content className="z-50 overflow-hidden rounded-md border border-slate-700 bg-slate-950 p-1 shadow-lg">
                      <Select.Viewport>
                        <Select.Item value="strict" className="cursor-pointer rounded px-3 py-2 text-sm text-slate-200 outline-none hover:bg-slate-800">
                          <Select.ItemText>Strict thresholds</Select.ItemText>
                        </Select.Item>
                        <Select.Item value="broad" className="cursor-pointer rounded px-3 py-2 text-sm text-slate-200 outline-none hover:bg-slate-800">
                          <Select.ItemText>Broad discovery</Select.ItemText>
                        </Select.Item>
                      </Select.Viewport>
                    </Select.Content>
                  </Select.Portal>
                </Select.Root>
              </div>
            </div>

            {message ? <p className="text-sm text-cyan-300">{message}</p> : null}
          </form>
        </CardContent>
      </Card>

      <Card className="border-slate-700 bg-slate-900/70">
        <CardHeader>
          <CardTitle className="text-slate-100">Preview Results</CardTitle>
          <CardDescription className="text-slate-300">
            Repositories that would appear in your next daily digest.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {matches.length === 0 ? (
            <p className="text-sm text-slate-400">Run a preview scan to populate results.</p>
          ) : (
            <div className="space-y-4">
              {topics.map((topic) => {
                const topicMatches = groupedMatches.get(topic.topic.toLowerCase()) ?? [];

                return (
                  <div key={topic.topic} className="rounded-lg border border-slate-700 bg-slate-950/60 p-4">
                    <div className="mb-3 flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-slate-100">#{topic.topic}</p>
                      <Badge variant="outline" className="border-emerald-500/40 text-emerald-300">
                        {topicMatches.length} hit{topicMatches.length === 1 ? "" : "s"}
                      </Badge>
                    </div>

                    {topicMatches.length === 0 ? (
                      <p className="text-xs text-slate-400">No matches for this topic.</p>
                    ) : (
                      <ul className="space-y-2">
                        {topicMatches.map((match) => (
                          <li key={`${match.topic}-${match.repoFullName}`} className="rounded-md border border-slate-800 p-3">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <a
                                  className="text-sm font-semibold text-cyan-300 hover:underline"
                                  href={match.url}
                                  target="_blank"
                                  rel="noreferrer"
                                >
                                  {match.repoFullName}
                                </a>
                                <p className="mt-1 line-clamp-2 text-xs text-slate-300">{match.description || "No description"}</p>
                              </div>
                              <div className="text-right text-xs text-slate-300">
                                <p className="font-semibold text-emerald-300">{match.dailyStars.toFixed(1)}/day</p>
                                <p>{match.totalStars.toLocaleString()} total</p>
                              </div>
                            </div>
                            <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-400">
                              <span>{match.language ?? "Unknown language"}</span>
                              <span>•</span>
                              <span>{match.starsInLookback} stars in {match.lookbackDays}d</span>
                              <span>•</span>
                              <span>updated {new Date(match.pushedAt).toLocaleDateString()}</span>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
