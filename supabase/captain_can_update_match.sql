-- CricCorner: let a match's CAPTAINS update (and so delete) that match.
-- Run once in Supabase -> SQL Editor. Safe to run again.
--
-- A captain is the player chosen as captain of Team A or Team B when the match
-- was scheduled. The server decides who "is" that player by comparing the
-- player's email (or mobile number) with the logged-in account's.
-- Everything else is unchanged: the match creator and administrators can still
-- change matches, as before.

create or replace function public.is_match_captain(d jsonb) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1
    from public.docs p
    where p.kind = 'players' and not p.deleted
      and p.id in (coalesce(d->>'captainA', ''), coalesce(d->>'captainB', ''))
      and (
        (coalesce(p.data->>'email', '') <> ''
          and lower(p.data->>'email') = lower(coalesce(auth.jwt()->>'email', '')))
        or
        (coalesce(p.data->>'phone', '') <> ''
          and regexp_replace(p.data->>'phone', '[\s\-().]', '', 'g') =
              (select regexp_replace(coalesce(pr.phone, ''), '[\s\-().]', '', 'g') from public.profiles pr where pr.id = auth.uid()))
      )
  );
$$;
revoke all on function public.is_match_captain(jsonb) from public, anon;
grant execute on function public.is_match_captain(jsonb) to authenticated;

drop policy if exists docs_update_captain on public.docs;
create policy docs_update_captain on public.docs for update to authenticated
  using (public.is_active() and kind = 'matches' and public.is_match_captain(data))
  with check (public.is_active());
