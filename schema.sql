-- Enable Realtime
drop publication if exists supabase_realtime;
create publication supabase_realtime for all tables;

-- Providers Table (e.g. AWS, GitHub)
create table public.providers (
  id uuid not null default gen_random_uuid() primary key,
  name text not null unique,
  logo_url text, -- optimized SVG url
  created_at timestamptz default now()
);

-- Incidents Table (Current State)
create table public.incidents (
  id uuid not null default gen_random_uuid() primary key,
  provider_id uuid references public.providers(id),
  title text not null,
  severity text check (severity in ('minor', 'major', 'critical', 'maintenance')),
  status text not null, -- e.g. "Investigating", "Resolved"
  url text,
  start_time timestamptz,
  last_update timestamptz default now(),
  raw_text text, -- full description for reference
  active boolean default true
);

-- Incident Events (History Log / Ticker Feed)
create table public.incident_events (
  id uuid not null default gen_random_uuid() primary key,
  incident_id uuid references public.incidents(id),
  description text not null, 
  event_type text, -- "new", "update", "resolve"
  created_at timestamptz default now()
);

-- Incident Regions (Many-to-Many)
create table public.regions (
  code text primary key, -- e.g. "us-east-1"
  label text,
  lat float,
  lon float
);

create table public.incident_regions (
  incident_id uuid references public.incidents(id) on delete cascade,
  region_code text references public.regions(code),
  primary key (incident_id, region_code)
);

-- Seed initial providers
insert into public.providers (name, logo_url) values 
('AWS', '/logos/aws.svg'),
('GitHub', '/logos/github.svg'),
('Google Cloud', '/logos/gcp.svg'),
('PyPI', '/logos/pypi.svg')
on conflict (name) do nothing;
