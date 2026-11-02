-- ---------------------------------------------------------------------
-- Team invite links: lets a player join a team himself from a shared link.
-- Run this once in the Supabase SQL editor.
--
-- The captain's link carries a secret code stored on the team
-- (data->>'inviteCode'). A player who opens the link calls this function.
-- It adds ONLY that player's own entry to the team's playerIds, and only when
-- the code matches, so players still cannot edit teams they don't own.
-- ---------------------------------------------------------------------
create or replace function public.join_team_by_invite(p_team text, p_code text, p_player text)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  t public.docs%rowtype;
  pl public.docs%rowtype;
  mine boolean;
begin
  if not public.is_active() then
    raise exception 'Your account is not active.' using errcode = '42501';
  end if;

  select * into t from public.docs where kind = 'teams' and id = p_team and not deleted for update;
  if not found then
    raise exception 'That team no longer exists.' using errcode = 'P0002';
  end if;
  if coalesce(t.data->>'inviteCode', '') = '' or t.data->>'inviteCode' <> coalesce(p_code, '') then
    raise exception 'This invite link is no longer valid. Ask the captain for a new one.' using errcode = '42501';
  end if;

  select * into pl from public.docs where kind = 'players' and id = p_player and not deleted;
  if not found then
    raise exception 'Your player entry has not been saved yet. Try again in a moment.' using errcode = 'P0002';
  end if;

  mine := pl.owner = auth.uid()
    or (coalesce(pl.data->>'email', '') <> '' and lower(pl.data->>'email') = lower(coalesce(auth.jwt()->>'email', '')))
    or (coalesce(pl.data->>'phone', '') <> ''
        and regexp_replace(pl.data->>'phone', '[\s\-().]', '', 'g') =
            (select regexp_replace(coalesce(pr.phone, ''), '[\s\-().]', '', 'g') from public.profiles pr where pr.id = auth.uid()));
  if not mine then
    raise exception 'That player entry is not yours.' using errcode = '42501';
  end if;

  if (coalesce(t.data->'playerIds', '[]'::jsonb)) ? p_player then
    return t.data;  -- already in the team
  end if;

  update public.docs
     set data = jsonb_set(data, '{playerIds}', coalesce(data->'playerIds', '[]'::jsonb) || to_jsonb(p_player), true)
   where kind = 'teams' and id = p_team
   returning data into t.data;
  return t.data;
end $$;

revoke all on function public.join_team_by_invite(text, text, text) from public, anon;
grant execute on function public.join_team_by_invite(text, text, text) to authenticated;
