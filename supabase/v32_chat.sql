-- CricCorner v32: player-to-player chat. Run once in the Supabase SQL editor (safe to run again).
create table if not exists public.chat_messages (
  id         bigint generated always as identity primary key,
  sender     uuid not null default auth.uid() references auth.users(id) on delete cascade,
  recipient  uuid not null references auth.users(id) on delete cascade,
  body       text not null check (char_length(btrim(body)) between 1 and 1000),
  read_at    timestamptz,
  created_at timestamptz not null default now(),
  check (sender <> recipient)
);
create index if not exists chat_recipient_idx on public.chat_messages (recipient, created_at desc);
create index if not exists chat_sender_idx on public.chat_messages (sender, created_at desc);

alter table public.chat_messages enable row level security;
drop policy if exists chat_select on public.chat_messages;
drop policy if exists chat_insert on public.chat_messages;
drop policy if exists chat_update on public.chat_messages;
-- You can only ever see messages you sent or received.
create policy chat_select on public.chat_messages for select to authenticated
  using (sender = auth.uid() or recipient = auth.uid());
create policy chat_insert on public.chat_messages for insert to authenticated
  with check (public.is_active() and sender = auth.uid());
-- The recipient can mark messages as read (nothing else may change - see the trigger).
create policy chat_update on public.chat_messages for update to authenticated
  using (recipient = auth.uid()) with check (recipient = auth.uid());

create or replace function public.chat_only_read() returns trigger language plpgsql as $$
begin
  if new.sender is distinct from old.sender or new.recipient is distinct from old.recipient or new.body is distinct from old.body or new.created_at is distinct from old.created_at then
    raise exception 'Messages cannot be edited.';
  end if;
  return new;
end $$;
drop trigger if exists chat_only_read on public.chat_messages;
create trigger chat_only_read before update on public.chat_messages for each row execute function public.chat_only_read();

-- Who to message for a player (their registered account) or a team (its owner). Returns null when there is nobody to message.
create or replace function public.chat_target(p_kind text, p_id text) returns uuid
language plpgsql security definer set search_path = public as $$
declare d jsonb; o uuid; r uuid; ph text; em text;
begin
  if not public.is_active() then return null; end if;
  if p_kind not in ('players','teams') then return null; end if;
  select data, owner into d, o from public.docs where kind = p_kind and id = p_id and not deleted limit 1;
  if d is null then return null; end if;
  if p_kind = 'teams' then
    return case when o = auth.uid() then null else o end;
  end if;
  em := lower(coalesce(d->>'email', ''));
  ph := regexp_replace(coalesce(d->>'phone', ''), '\D', '', 'g');
  select p.id into r from public.profiles p
   where not p.blocked and ((em <> '' and lower(p.email) = em)
      or (length(ph) >= 8 and right(regexp_replace(coalesce(p.phone, ''), '\D', '', 'g'), 9) = right(ph, 9)))
   limit 1;
  return case when r = auth.uid() then null else r end;
end $$;
revoke all on function public.chat_target(text, text) from public;
grant execute on function public.chat_target(text, text) to authenticated;

-- Names / photos of the people in your conversations (profiles are otherwise private).
create or replace function public.chat_people(ids uuid[]) returns table (id uuid, name text, photo_url text)
language sql security definer set search_path = public as $$
  select p.id, p.name, p.photo_url from public.profiles p
   where public.is_active() and p.id = any(ids)
     and (p.id in (select recipient from public.chat_messages where sender = auth.uid())
       or p.id in (select sender from public.chat_messages where recipient = auth.uid())
       or p.id = auth.uid());
$$;
revoke all on function public.chat_people(uuid[]) from public;
grant execute on function public.chat_people(uuid[]) to authenticated;
