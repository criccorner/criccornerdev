-- =====================================================================
-- CricCorner cloud database. Run this ONCE in Supabase:
--   Dashboard -> SQL Editor -> New query -> paste everything -> Run.
-- It is safe to run again (it uses "if not exists" / "or replace").
-- =====================================================================

-- >>> 1. PUT YOUR ADMIN EMAIL(S) HERE (the email you will REGISTER with) <<<
create table if not exists public.bootstrap_admins (email text primary key);
insert into public.bootstrap_admins (email) values (lower('criccornerdevdb@gmail.com'))
on conflict do nothing;
alter table public.bootstrap_admins enable row level security;  -- no policies: invisible through the app API

-- ---------------------------------------------------------------------
-- 2. Player accounts (one row per login). Login itself is handled by Supabase Auth.
-- ---------------------------------------------------------------------
create table if not exists public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  email         text not null,
  phone         text,
  name          text not null default '',
  role          text not null default 'Batter',
  batting_style text,
  bowling_style text,
  city          text,
  photo_url     text,
  is_admin      boolean not null default false,
  is_primary    boolean not null default false,
  blocked       boolean not null default false,
  blocked_at    timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select p.is_admin and not p.blocked from public.profiles p where p.id = auth.uid()), false)
$$;

create or replace function public.is_active() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select not p.blocked from public.profiles p where p.id = auth.uid()), false)
$$;

-- Create the profile automatically when someone registers.
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare boot boolean;
begin
  select exists (select 1 from public.bootstrap_admins b where b.email = lower(new.email)) into boot;
  insert into public.profiles (id, email, name, role, phone, is_admin, is_primary)
  values (
    new.id,
    lower(new.email),
    coalesce(new.raw_user_meta_data->>'name', ''),
    coalesce(nullif(new.raw_user_meta_data->>'role', ''), 'Batter'),
    nullif(new.raw_user_meta_data->>'phone', ''),
    boot, boot
  )
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
for each row execute function public.handle_new_user();

-- Players can edit their own details, but never their own admin/blocked flags.
create or replace function public.protect_profile() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is not null and not public.is_admin() then
    new.is_admin   := old.is_admin;
    new.is_primary := old.is_primary;
    new.blocked    := old.blocked;
    new.blocked_at := old.blocked_at;
  end if;
  new.email := old.email;
  if old.is_primary then           -- the main administrator can't be demoted or blocked
    new.is_admin := true;
    new.blocked := false;
    new.blocked_at := null;
  end if;
  new.updated_at := now();
  return new;
end $$;

drop trigger if exists profiles_protect on public.profiles;
create trigger profiles_protect before update on public.profiles
for each row execute function public.protect_profile();

alter table public.profiles enable row level security;
drop policy if exists profiles_select on public.profiles;
drop policy if exists profiles_update on public.profiles;
create policy profiles_select on public.profiles for select to authenticated
  using (id = auth.uid() or public.is_admin());
create policy profiles_update on public.profiles for update to authenticated
  using (id = auth.uid() or public.is_admin())
  with check (id = auth.uid() or public.is_admin());

-- ---------------------------------------------------------------------
-- 3. Shared cricket data: players, teams, matches, tournaments.
--    One generic table; the app stores each item as JSON in "data".
--    Deleting is a "soft delete" (deleted = true) so other phones find out.
-- ---------------------------------------------------------------------
create table if not exists public.docs (
  kind       text not null check (kind in ('players','teams','matches','tournaments')),
  id         text not null,
  owner      uuid default auth.uid() references auth.users(id) on delete set null,
  data       jsonb not null,
  deleted    boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (kind, id)
);
create index if not exists docs_updated_idx on public.docs (updated_at, kind, id);

create or replace function public.docs_touch() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  new.updated_at := now();
  if tg_op = 'UPDATE' then
    new.owner := old.owner;      -- ownership never changes
    new.kind  := old.kind;
    new.id    := old.id;
  end if;
  return new;
end $$;

drop trigger if exists docs_touch_trg on public.docs;
create trigger docs_touch_trg before insert or update on public.docs
for each row execute function public.docs_touch();

alter table public.docs enable row level security;
drop policy if exists docs_select on public.docs;
drop policy if exists docs_insert on public.docs;
drop policy if exists docs_update on public.docs;

-- Everyone who is logged in (and not blocked) can SEE all shared data.
create policy docs_select on public.docs for select to authenticated
  using (public.is_active());

-- Anyone logged in can create items; they become the owner.
create policy docs_insert on public.docs for insert to authenticated
  with check (public.is_active() and owner = auth.uid());

-- Only the owner or an admin can change an item, with two exceptions:
--  * teams: any member can respond to a join request, so teams are editable by any logged-in player
--  * players: the person whose email is on the player entry can edit it (their own profile)
create policy docs_update on public.docs for update to authenticated
  using (
    public.is_active() and (
      owner = auth.uid()
      or public.is_admin()
      or kind = 'teams'
      or (kind = 'players' and lower(coalesce(data->>'email','')) = lower(coalesce(auth.jwt()->>'email','')))
    )
  )
  with check (public.is_active());

-- ---------------------------------------------------------------------
-- 4. Issues & suggestions
-- ---------------------------------------------------------------------
create table if not exists public.feedback (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid default auth.uid() references auth.users(id) on delete set null,
  user_name    text,
  user_contact text,
  type         text not null check (type in ('Issue','Suggestion')),
  detail       text not null check (char_length(detail) between 10 and 1000),
  status       text not null default 'Open' check (status in ('Open','In Progress','Resolved','Rejected')),
  reply        text,
  replied_by   text,
  replied_at   timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

alter table public.feedback enable row level security;
drop policy if exists feedback_select on public.feedback;
drop policy if exists feedback_insert on public.feedback;
drop policy if exists feedback_update on public.feedback;
create policy feedback_select on public.feedback for select to authenticated
  using (user_id = auth.uid() or public.is_admin());
create policy feedback_insert on public.feedback for insert to authenticated
  with check (public.is_active() and user_id = auth.uid());
create policy feedback_update on public.feedback for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------
-- 5. Profile photos (public bucket; each person writes only to their own folder)
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public) values ('avatars', 'avatars', true)
on conflict (id) do nothing;

drop policy if exists avatars_read   on storage.objects;
drop policy if exists avatars_insert on storage.objects;
drop policy if exists avatars_update on storage.objects;
drop policy if exists avatars_delete on storage.objects;
create policy avatars_read on storage.objects for select using (bucket_id = 'avatars');
create policy avatars_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy avatars_update on storage.objects for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy avatars_delete on storage.objects for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

-- Done. If you registered BEFORE adding your email at the top, run this once:
--   update public.profiles set is_admin = true, is_primary = true where email = lower('YOUR_EMAIL_HERE@example.com');
