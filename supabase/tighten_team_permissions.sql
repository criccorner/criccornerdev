-- CricCorner: only the creator of a team (or an admin) can change it.
-- Run once in Supabase -> SQL Editor. Safe to run again.
-- Before this, ANY logged-in player could change ANY team. Now:
--   * the team's creator or an admin can change it, and
--   * a player with a pending invitation to the team can accept / decline it.
-- Also run captain_can_update_match.sql if you have not already.

-- True when the logged-in account is the player named in a PENDING join request of this team.
create or replace function public.is_invited_to_team(d jsonb) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1
    from jsonb_array_elements(coalesce(d->'joinRequests', '[]'::jsonb)) r
    join public.docs p on p.kind = 'players' and not p.deleted and p.id = r->>'playerId'
    where r->>'status' = 'pending'
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
revoke all on function public.is_invited_to_team(jsonb) from public, anon;
grant execute on function public.is_invited_to_team(jsonb) to authenticated;

drop policy if exists docs_update on public.docs;
create policy docs_update on public.docs for update to authenticated
  using (
    public.is_active() and (
      owner = auth.uid()
      or public.is_admin()
      or (kind = 'teams' and public.is_invited_to_team(data))
      or (kind = 'players' and lower(coalesce(data->>'email','')) = lower(coalesce(auth.jwt()->>'email','')))
    )
  )
  with check (public.is_active());
