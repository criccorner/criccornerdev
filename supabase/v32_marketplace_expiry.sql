-- CricCorner v32: marketplace expiry dates + Umpire category. Run after marketplace.sql (safe to run again).
alter table public.marketplace_listings add column if not exists expires_at timestamptz;

alter table public.marketplace_listings drop constraint if exists marketplace_listings_category_check;
alter table public.marketplace_listings add constraint marketplace_listings_category_check
  check (category in ('Cricket Uniforms Store','Cricket Gears Store','Physio','Fitness and Gym','Clubs to Join','Cricket Coaching','Umpire','Other'));

-- Everyone sees only listings that are approved AND not past their expiry date. Owners and admins still see their own / all.
drop policy if exists mkt_select on public.marketplace_listings;
create policy mkt_select on public.marketplace_listings for select to authenticated
  using (public.is_active() and ((status = 'approved' and (expires_at is null or expires_at > now())) or owner = auth.uid() or public.is_admin()));

create or replace function public.mkt_guard() returns trigger language plpgsql security definer set search_path = public as $$
begin
  new.updated_at := now();
  if public.is_admin() then
    if new.status = 'approved' and (new.expires_at is null or new.expires_at <= now()) then
      raise exception 'Choose an expiry date in the future to approve a listing.';
    end if;
    if new.status is distinct from 'approved' then new.expires_at := null; end if;
    if new.status is distinct from 'rejected' then new.reject_reason := null; end if;
    if tg_op = 'INSERT' or new.status is distinct from old.status then new.reviewed_at := now(); end if;
    return new;
  end if;
  new.owner := case when tg_op = 'INSERT' then auth.uid() else old.owner end;
  new.status := 'pending';
  new.reject_reason := null;
  new.reviewed_at := null;
  new.expires_at := null;
  return new;
end $$;
