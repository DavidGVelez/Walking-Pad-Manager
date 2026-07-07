create table if not exists walk_sessions (
  id text primary key,
  started_at timestamptz not null,
  ended_at timestamptz not null,
  duration_seconds integer not null,
  distance_meters double precision,
  average_speed_kmh double precision,
  max_speed_kmh double precision,
  calories_kcal double precision,
  created_at timestamptz not null default now()
);

alter table walk_sessions enable row level security;

-- No login for now: the anon key can read/write freely.
-- Tighten these (e.g. scope to auth.uid()) if you add Supabase Auth later.
create policy "Anon can read walk_sessions" on walk_sessions
  for select using (true);

create policy "Anon can insert walk_sessions" on walk_sessions
  for insert with check (true);

create policy "Anon can delete walk_sessions" on walk_sessions
  for delete using (true);
