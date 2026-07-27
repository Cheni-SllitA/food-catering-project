-- =====================================================================
-- Fix: signup RLS violation + "cart couldn't be loaded"
--
-- Run this ONCE in the Supabase SQL editor. It is idempotent and safe
-- to re-run.
--
-- What it does:
--   1. Auto-creates a public.profiles row whenever an auth user is
--      created, via a SECURITY DEFINER trigger (bypasses RLS, needs no
--      client session) — this is the standard Supabase pattern and
--      removes the need for the browser to insert the profile.
--   2. Backfills profiles for any existing auth users that don't have
--      one yet (e.g. accounts created while signup was failing).
--   3. Re-asserts the carts / cart_items RLS policies, in case they
--      didn't get created when rls_policies.sql was first run.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Auto-create profile on new auth user
-- ---------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, phone, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    new.raw_user_meta_data->>'phone',
    'customer'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------
-- 2. Backfill profiles for existing users that are missing one
-- ---------------------------------------------------------------------
insert into public.profiles (id, full_name, phone, role)
select
  u.id,
  coalesce(u.raw_user_meta_data->>'full_name', ''),
  u.raw_user_meta_data->>'phone',
  'customer'
from auth.users u
where not exists (select 1 from public.profiles p where p.id = u.id);

-- ---------------------------------------------------------------------
-- 3. Re-assert carts / cart_items RLS policies
-- ---------------------------------------------------------------------
alter table public.carts enable row level security;
drop policy if exists "carts_all_own" on public.carts;
create policy "carts_all_own" on public.carts for all
  using (customer_id = auth.uid())
  with check (customer_id = auth.uid());

alter table public.cart_items enable row level security;
drop policy if exists "cart_items_all_own" on public.cart_items;
create policy "cart_items_all_own" on public.cart_items for all
  using (exists (select 1 from public.carts c where c.id = cart_id and c.customer_id = auth.uid()))
  with check (exists (select 1 from public.carts c where c.id = cart_id and c.customer_id = auth.uid()));

-- ---------------------------------------------------------------------
-- Optional: verify the policies now exist. Run this SELECT on its own
-- and confirm you see carts_all_own, cart_items_all_own, and the
-- profiles_* policies.
-- ---------------------------------------------------------------------
-- select tablename, policyname, cmd
-- from pg_policies
-- where schemaname = 'public'
--   and tablename in ('carts', 'cart_items', 'profiles')
-- order by tablename, policyname;
