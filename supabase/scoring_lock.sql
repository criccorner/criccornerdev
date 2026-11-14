-- CricCorner: one scorer per match + hand-over of scoring. Run once in Supabase (SQL Editor -> New query -> Run).

-- 1) The player the scoring was handed to may update that match.
create or replace function public.is_match_scorer(d jsonb) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.docs p
    where p.kind = 'players' and not p.deleted and p.id = coalesce(d->>'scorerId', '')
      and (
        (coalesce(p.data->>'email', '') <> '' and lower(p.data->>'email') = lower(coalesce(auth.jwt()->>'email', '')))
        or
        (coalesce(p.data->>'phone', '') <> '' and regexp_replace(p.data->>'phone', '[\s\-().]', '', 'g') =
           (select regexp_replace(coalesce(pr.phone, ''), '[\s\-().]', '', 'g') from public.profiles pr where pr.id = auth.uid()))
      )
  );
$$;
revoke all on function public.is_match_scorer(jsonb) from public, anon;
grant execute on function public.is_match_scorer(jsonb) to authenticated;

drop policy if exists docs_update_scorer on public.docs;
create policy docs_update_scorer on public.docs for update to authenticated
  using (public.is_active() and kind = 'matches' and public.is_match_scorer(data))
  with check (public.is_active());

-- 2) Only the scorer may change the score of a match that is still being played
--    (the creator until scoring is handed over, then only the chosen player; admins always).
create or replace function public.enforce_single_scorer() returns trigger
language plpgsql security definer set search_path = public as $$
declare ok boolean;
begin
  if new.kind <> 'matches' or public.is_admin() then return new; end if;
  if coalesce(old.data->>'status', '') = 'completed' then return new; end if;
  if (new.data->'innings1') is not distinct from (old.data->'innings1')
     and (new.data->'innings2') is not distinct from (old.data->'innings2')
     and coalesce(new.data->>'status', '') is not distinct from coalesce(old.data->>'status', '') then
    return new; -- not a scoring change
  end if;
  if coalesce(old.data->>'scorerId', '') <> '' then
    ok := public.is_match_scorer(old.data);
  else
    ok := (old.owner = auth.uid());
  end if;
  if not ok then raise exception 'Only the scorer of this match can score it' using errcode = '42501'; end if;
  return new;
end $$;
drop trigger if exists docs_single_scorer on public.docs;
create trigger docs_single_scorer before update on public.docs
  for each row execute function public.enforce_single_scorer();
