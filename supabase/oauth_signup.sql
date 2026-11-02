-- Google / Apple sign-in: take the person's name from the provider when they register.
-- Run once in the Supabase SQL editor. Safe to run again.
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare boot boolean;
begin
  select exists (select 1 from public.bootstrap_admins b where b.email = lower(new.email)) into boot;
  insert into public.profiles (id, email, name, role, phone, is_admin, is_primary)
  values (
    new.id,
    lower(new.email),
    coalesce(
      nullif(trim(new.raw_user_meta_data->>'name'), ''),
      nullif(trim(new.raw_user_meta_data->>'full_name'), ''),
      nullif(trim(concat_ws(' ', new.raw_user_meta_data->>'given_name', new.raw_user_meta_data->>'family_name')), ''),
      initcap(replace(split_part(lower(new.email), '@', 1), '.', ' '))
    ),
    coalesce(nullif(new.raw_user_meta_data->>'role', ''), 'Batter'),
    nullif(new.raw_user_meta_data->>'phone', ''),
    boot, boot
  )
  on conflict (id) do nothing;
  return new;
end $$;
