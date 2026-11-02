-- Lets a signed-in person delete their OWN account from inside the app (Google Play requires this).
-- Run once in the Supabase SQL editor. Safe to run again.
--
-- What it does:
--   * scrubs the person's own player entry (name -> "Deleted player", no email/phone/photo/answers)
--     so old scorecards and team lists keep working for everyone else
--   * scrubs their name/contact from feedback they sent
--   * deletes the login and profile (auth.users; the profile row goes with it)
--   * teams, matches and players they created for other people stay (their owner becomes empty; admins can manage them)
create or replace function public.docs_touch() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  new.updated_at := now();
  if tg_op = 'UPDATE' then
    -- ownership never changes, except when an account is being deleted (delete_my_account sets this flag)
    if coalesce(current_setting('app.releasing_owner', true), '') = '1' and new.owner is null then
      null;
    else
      new.owner := old.owner;
    end if;
    new.kind  := old.kind;
    new.id    := old.id;
  end if;
  return new;
end $$;

create or replace function public.delete_my_account()
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  me uuid := auth.uid();
  prof public.profiles%rowtype;
  ph text;
begin
  if me is null then
    raise exception 'Please log in again.' using errcode = '42501';
  end if;
  select * into prof from public.profiles where id = me;
  if found and prof.is_primary then
    raise exception 'The main administrator account cannot be deleted. Make another person the administrator first.' using errcode = '42501';
  end if;

  ph := regexp_replace(coalesce(prof.phone, ''), '[\s\-().]', '', 'g');

  -- the person's own player entries (same email, same mobile, or the one they created for themselves)
  update public.docs d
     set data = (d.data - 'email' - 'phone' - 'photoUrl' - 'availability' - 'city' - 'battingStyle' - 'bowlingStyle')
                || jsonb_build_object('name', 'Deleted player', 'deletedAccount', true),
         updated_at = now()
   where d.kind = 'players'
     and not d.deleted
     and (
       (coalesce(prof.email, '') <> '' and lower(coalesce(d.data->>'email', '')) = lower(prof.email))
       or (ph <> '' and regexp_replace(coalesce(d.data->>'phone', ''), '[\s\-().]', '', 'g') = ph)
     );

  update public.feedback
     set user_name = 'Deleted user', user_contact = null, updated_at = now()
   where user_id = me;

  -- hand the shared items they created over to "nobody" (admins can still manage them)
  perform set_config('app.releasing_owner', '1', true);
  update public.docs set owner = null where owner = me;
  perform set_config('app.releasing_owner', '', true);

  delete from auth.users where id = me;  -- cascades to profiles
  return jsonb_build_object('deleted', true);
end $$;

revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
