create table if not exists public.outage_events (
  id uuid primary key default gen_random_uuid(),

  event_id text not null,
  source text not null,
  source_type text not null,

  category text not null,
  provider text,
  service text,

  status text not null,
  severity text not null,
  confidence text not null,
  confidence_score numeric not null default 0,

  country text,
  region text,
  city text,
  lat numeric,
  lon numeric,

  asn text,
  as_name text,
  prefix text,
  ip_version text,

  affected_users integer,
  affected_customers integer,
  affected_regions jsonb,
  impacted_services jsonb,

  started_at timestamptz not null,
  updated_at timestamptz not null,
  resolved_at timestamptz,

  title text not null,
  summary text not null,
  raw_url text,
  raw_payload jsonb,

  dedupe_key text not null,
  created_at timestamptz not null default now(),

  unique(source, event_id)
);

create index if not exists idx_outage_events_category
on public.outage_events(category);

create index if not exists idx_outage_events_status
on public.outage_events(status);

create index if not exists idx_outage_events_confidence
on public.outage_events(confidence);

create index if not exists idx_outage_events_started_at
on public.outage_events(started_at desc);

create index if not exists idx_outage_events_location
on public.outage_events(country, region, city);

create index if not exists idx_outage_events_dedupe_key
on public.outage_events(dedupe_key);

alter table public.outage_events enable row level security;

drop policy if exists "Public can read outage events" on public.outage_events;

create policy "Public can read outage events"
on public.outage_events
for select
using (true);
