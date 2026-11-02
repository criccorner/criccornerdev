-- CricCorner v17: app-level sponsors + editing your own issue / suggestion.
-- Run this once in the Supabase SQL editor (Run again later is safe).

-- 1. Sponsors an administrator adds; shown above every match in their city.
create table if not exists public.app_sponsors (
  id          uuid primary key default gen_random_uuid(),
  name        text not null check (char_length(name) between 1 and 80),
  tagline     text,
  contact     text,
  image_url   text,
  city        text,
  city_lat    double precision,
  city_lng    double precision,
  active      boolean not null default true,
  sort        int not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
alter table public.app_sponsors enable row level security;
drop policy if exists app_sponsors_select on public.app_sponsors;
drop policy if exists app_sponsors_write  on public.app_sponsors;
create policy app_sponsors_select on public.app_sponsors for select to authenticated
  using (public.is_active() and (active or public.is_admin()));
create policy app_sponsors_write on public.app_sponsors for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- 2. A person may edit their own issue / suggestion while it is still Open and unanswered.
drop policy if exists feedback_update_own on public.feedback;
create policy feedback_update_own on public.feedback for update to authenticated
  using (user_id = auth.uid() and status = 'Open' and reply is null)
  with check (user_id = auth.uid() and status = 'Open' and reply is null);
