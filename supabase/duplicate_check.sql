-- Duplicate email / mobile number check for registration.
-- Run once in Supabase: SQL Editor -> New query -> paste -> Run.

-- 1) Lets the app ask "is this email / mobile already registered?" BEFORE sign-up (it answers only yes/no).
create or replace function public.account_exists(p_email text, p_phone text)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'email',
      coalesce(trim(p_email), '') <> ''
      and exists (select 1 from public.profiles where lower(email) = lower(trim(p_email))),
    'phone',
      coalesce(trim(p_phone), '') <> ''
      and exists (
        select 1 from public.profiles
        where coalesce(phone, '') <> ''
          and regexp_replace(phone, '[\s\-().]', '', 'g') = regexp_replace(p_phone, '[\s\-().]', '', 'g')
      )
  );
$$;
revoke all on function public.account_exists(text, text) from public;
grant execute on function public.account_exists(text, text) to anon, authenticated;

-- 2) Safety net: the database itself refuses two accounts with the same mobile number.
--    Only created when there are no duplicates today (if there are, it tells you which numbers to fix first).
do $$
declare dups text;
begin
  select string_agg(n, ', ') into dups from (
    select regexp_replace(phone, '[\s\-().]', '', 'g') as n
    from public.profiles
    where coalesce(phone, '') <> ''
    group by 1 having count(*) > 1
  ) d;
  if dups is not null then
    raise notice 'Unique mobile index NOT created: these numbers are used by more than one account: %', dups;
  else
    create unique index if not exists profiles_phone_unique
      on public.profiles ((regexp_replace(phone, '[\s\-().]', '', 'g')))
      where coalesce(phone, '') <> '';
  end if;
end $$;
