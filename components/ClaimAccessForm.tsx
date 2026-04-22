"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ClaimAccessForm() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleClaim = () => {
    setMessage(null);
    setError(null);

    startTransition(async () => {
      try {
        const response = await fetch("/api/access/claim", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ email })
        });

        const data = (await response.json()) as { message?: string; error?: string };

        if (!response.ok) {
          setError(data.error ?? "Access could not be verified.");
          return;
        }

        setMessage(data.message ?? "Access granted. Redirecting to dashboard...");
        router.refresh();
      } catch {
        setError("Network error while verifying purchase.");
      }
    });
  };

  return (
    <div className="mt-6 rounded-lg border border-[#30363d] bg-[#111827] p-4">
      <h3 className="text-base font-semibold text-[#f0f6fc]">Already purchased?</h3>
      <p className="mt-1 text-sm text-[#8b949e]">Enter the same email used during Stripe checkout to unlock your dashboard.</p>

      <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
        <div className="space-y-2">
          <Label htmlFor="claim-email">Purchase email</Label>
          <Input
            autoComplete="email"
            id="claim-email"
            onChange={(event) => setEmail(event.target.value)}
            placeholder="founder@yourcompany.com"
            type="email"
            value={email}
          />
        </div>

        <Button disabled={isPending || email.trim().length === 0} onClick={handleClaim}>
          {isPending ? "Verifying..." : "Unlock Dashboard"}
        </Button>
      </div>

      {message ? <p className="mt-3 text-sm text-[#2ea043]">{message}</p> : null}
      {error ? <p className="mt-3 text-sm text-[#f85149]">{error}</p> : null}
    </div>
  );
}
