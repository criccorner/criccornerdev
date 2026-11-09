-- CricCorner activity log (who logged in, and what they did). Run once in Supabase: SQL Editor -> New query -> paste -> Run.
create table if not exists public.activity_log (
  id         bigint generated always as identity primary key,
  user_id    uuid not null default auth.uid() references auth.users(id) on delete cascade,
  user_name  text,
  phone      text,
  email      text,
  action     text not null,          -- short code, e.g. login, add_player
  detail     text,                   -- small human description
  created_at timestamptz not null default now()
);
create index if not exists activity_log_created_idx on public.activity_log (created_at desc);
create index if not exists activity_log_user_idx on public.activity_log (user_id, created_at desc);

alter table public.activity_log enable row level security;
drop policy if exists activity_insert on public.activity_log;
drop policy if exists activity_select on public.activity_log;
-- Anyone signed in can record their OWN activity; only an administrator can read the log.
create policy activity_insert on public.activity_log for insert to authenticated
  with check (user_id = auth.uid());
create policy activity_select on public.activity_log for select to authenticated
  using (public.is_admin());
