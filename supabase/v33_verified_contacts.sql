-- v33: which of MY players now have a verified mobile number / email (so they leave my Players tab).
-- Run once in Supabase: SQL Editor -> New query -> paste -> Run.
-- A contact counts as verified when a CricCorner account exists for it: the email must be a confirmed email on that
-- account, or the mobile number must be the number on a registered account.
create or replace function public.verified_player_ids(ids text[]) returns text[]
language plpgsql stable security definer set search_path = public, auth as $$
declare out text[];
begin
  if auth.uid() is null then return '{}'; end if;
  select coalesce(array_agg(d.id), '{}') into out
  from public.docs d
  where d.kind = 'players' and not d.deleted and d.owner = auth.uid() and d.id = any(ids)
    and (
      (coalesce(d.data->>'email', '') <> '' and exists (
         select 1 from auth.users u join public.profiles p on p.id = u.id
         where lower(u.email) = lower(trim(d.data->>'email')) and u.email_confirmed_at is not null and not p.blocked))
      or
      (length(regexp_replace(coalesce(d.data->>'phone', ''), '\D', '', 'g')) >= 8 and exists (
         select 1 from public.profiles p
         where not p.blocked and right(regexp_replace(coalesce(p.phone, ''), '\D', '', 'g'), 9)
             = right(regexp_replace(d.data->>'phone', '\D', '', 'g'), 9)))
    );
  return out;
end $$;
revoke all on function public.verified_player_ids(text[]) from public;
grant execute on function public.verified_player_ids(text[]) to authenticated;
