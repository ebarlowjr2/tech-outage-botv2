create table if not exists producer_events (
  id uuid default uuid_generate_v4() primary key,
  type text not null, -- SIM_OUTAGE, RESOLVE, CONTEXT_SET, ANNOUNCE
  payload jsonb,
  created_at timestamp with time zone default now(),
  created_by text
);

alter publication supabase_realtime add table producer_events;
