create table if not exists public.subscriptions (
  email text primary key,
  status text not null default 'active',
  plan text not null default 'starter',
  topics_limit integer,
  updated_at timestamptz not null default now()
);

create table if not exists public.topic_configs (
  id uuid primary key default gen_random_uuid(),
  user_email text not null references public.subscriptions(email) on delete cascade,
  topic text not null,
  min_daily_stars integer not null,
  min_total_stars integer not null,
  lookback_days integer not null default 3,
  created_at timestamptz not null default now(),
  unique (user_email, topic)
);

alter table public.subscriptions enable row level security;
alter table public.topic_configs enable row level security;
