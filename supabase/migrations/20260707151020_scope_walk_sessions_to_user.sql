-- Existing rows have no owner (they predate auth); this is only ever mock/test
-- data at this point, so it's fine to drop it rather than try to backfill it.
delete from walk_sessions;

alter table walk_sessions
  add column user_id uuid not null default auth.uid() references auth.users (id) on delete cascade;

drop policy if exists "Anon can read walk_sessions" on walk_sessions;
drop policy if exists "Anon can insert walk_sessions" on walk_sessions;
drop policy if exists "Anon can delete walk_sessions" on walk_sessions;

create policy "Users can read own walk_sessions" on walk_sessions
  for select using (auth.uid() = user_id);

create policy "Users can insert own walk_sessions" on walk_sessions
  for insert with check (auth.uid() = user_id);

create policy "Users can update own walk_sessions" on walk_sessions
  for update using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own walk_sessions" on walk_sessions
  for delete using (auth.uid() = user_id);
