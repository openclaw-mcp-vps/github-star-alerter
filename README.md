# GitHub Star Alerter

GitHub Star Alerter is a Next.js 15 SaaS app that tracks GitHub topics by star velocity and sends a daily digest of repositories that cross custom thresholds.

## What it includes

- Landing page with conversion-focused sections and pricing.
- Subscriber dashboard behind cookie-based access.
- Topic configuration and live preview scan.
- Lemon Squeezy webhook ingestion for subscription state.
- Daily digest cron endpoint.
- Supabase-backed subscription + topic config storage.

## Setup

1. Copy `.env.example` to `.env.local` and fill variables.
2. Create Supabase tables by running SQL in `supabase/schema.sql`.
3. Install and build:

```bash
npm install
npm run build
```

## Key routes

- `/` landing page
- `/dashboard` paid dashboard
- `/api/health` health check
- `/api/github` preview and topic save API
- `/api/webhooks/lemonsqueezy` Lemon Squeezy webhook target
- `/api/cron/daily-digest` daily digest trigger (protect with `CRON_SECRET`)
