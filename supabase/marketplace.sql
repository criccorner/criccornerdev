-- CricCorner: Cricket Marketplace. Run once in the Supabase SQL editor (running it again is safe).
-- One listing per person; it is hidden from everyone else until an administrator approves it.
create table if not exists public.marketplace_listings (
  id            uuid primary key default gen_random_uuid(),
  owner         uuid not null default auth.uid() references auth.users(id) on delete cascade,
  owner_name    text,
  title         text not null check (char_length(title) between 1 and 80),
  description   text check (description is null or char_length(description) <= 500),
  category      text not null check (category in ('Cricket Uniforms Store','Cricket Gears Store','Physio','Fitness and Gym','Clubs to Join','Cricket Coaching','Other')),
  image_url     text not null,
  contact       text not null check (char_length(contact) between 6 and 30),
  address       text not null check (char_length(address) between 1 and 200),
  city          text not null check (char_length(city) between 1 and 80),
  status        text not null default 'pending' check (status in ('pending','approved','rejected')),
  reject_reason text,
  reviewed_at   timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
-- at most one listing per person
create unique index if not exists marketplace_one_per_owner on public.marketplace_listings(owner);
create index if not exists marketplace_status_idx on public.marketplace_listings(status, category);

alter table public.marketplace_listings enable row level security;
drop policy if exists mkt_select on public.marketplace_listings;
drop policy if exists mkt_insert on public.marketplace_listings;
drop policy if exists mkt_update on public.marketplace_listings;
drop policy if exists mkt_delete on public.marketplace_listings;
create policy mkt_select on public.marketplace_listings for select to authenticated
  using (public.is_active() and (status = 'approved' or owner = auth.uid() or public.is_admin()));
create policy mkt_insert on public.marketplace_listings for insert to authenticated
  with check (public.is_active() and owner = auth.uid());
create policy mkt_update on public.marketplace_listings for update to authenticated
  using (public.is_admin() or owner = auth.uid())
  with check (public.is_admin() or owner = auth.uid());
create policy mkt_delete on public.marketplace_listings for delete to authenticated
  using (public.is_admin() or owner = auth.uid());

-- Whatever a person submits or edits goes back to "pending"; only an administrator can approve or reject.
create or replace function public.mkt_guard() returns trigger language plpgsql security definer set search_path = public as $$
begin
  new.updated_at := now();
  if public.is_admin() then
    if new.status is distinct from 'rejected' then new.reject_reason := null; end if;
    if tg_op = 'INSERT' or new.status is distinct from old.status then new.reviewed_at := now(); end if;
    return new;
  end if;
  new.owner := case when tg_op = 'INSERT' then auth.uid() else old.owner end;
  new.status := 'pending';
  new.reject_reason := null;
  new.reviewed_at := null;
  return new;
end $$;
drop trigger if exists mkt_guard on public.marketplace_listings;
create trigger mkt_guard before insert or update on public.marketplace_listings
  for each row execute function public.mkt_guard();
