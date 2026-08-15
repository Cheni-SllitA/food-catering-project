-- =====================================================================
-- Minor consistency fix: the auto-profile-creation trigger only ever
-- captured full_name and phone from signup metadata, never address.
-- CreateStaffModal.jsx now sets address explicitly via a follow-up
-- update, so this isn't required for staff creation to work — but it
-- closes the gap for any other signup path that passes address in
-- metadata (e.g. if the customer signup form grows an address field
-- later).
--
-- Run in the Supabase SQL editor. Idempotent — safe to re-run.
-- =====================================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, phone, address, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    new.raw_user_meta_data->>'phone',
    new.raw_user_meta_data->>'address',
    'customer'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- The trigger itself already exists (from fix_signup_and_cart.sql) and
-- points at this function by name, so no need to redrop/recreate it.
