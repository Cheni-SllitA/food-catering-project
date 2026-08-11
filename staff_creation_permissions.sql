-- =====================================================================
-- Lets catering_manager (in addition to administrator) turn a freshly
-- signed-up account into a staff account, without giving them any
-- broader role-management power.
--
-- Run in the Supabase SQL editor. Idempotent — safe to re-run.
--
-- Two things currently block this for catering_manager:
--   1. profiles has no UPDATE policy for catering_manager at all
--      (profiles_update_admin is administrator-only).
--   2. Even if a policy existed, the prevent_role_self_escalation
--      trigger unconditionally resets role back to its old value for
--      anyone who isn't 'administrator'.
-- Both are addressed below, scoped so a catering_manager can only ever
-- set role to 'staff' — never 'administrator' or 'catering_manager' —
-- so this can't be used to self-escalate or escalate anyone else.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. RLS: catering_manager may update a profile, but only landing on
--    role = 'staff'.
-- ---------------------------------------------------------------------
drop policy if exists "profiles_update_staff_role_cm" on public.profiles;
create policy "profiles_update_staff_role_cm" on public.profiles for update
  using (public.my_role() = 'catering_manager')
  with check (public.my_role() = 'catering_manager' and role = 'staff');

-- ---------------------------------------------------------------------
-- 2. Trigger: allow that specific transition through instead of
--    reverting it. Administrator keeps unrestricted role changes.
-- ---------------------------------------------------------------------
create or replace function public.prevent_role_self_escalation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.my_role() = 'administrator' then
    return new;
  elsif public.my_role() = 'catering_manager' and new.role = 'staff' then
    return new;
  else
    new.role := old.role;
    return new;
  end if;
end;
$$;

-- The trigger itself already exists (from fix_signup_and_cart.sql) and
-- points at this function by name, so no need to redrop/recreate it —
-- create or replace above is enough.

-- ---------------------------------------------------------------------
-- Verify (optional): run standalone.
-- ---------------------------------------------------------------------
-- select policyname, cmd from pg_policies
-- where schemaname = 'public' and tablename = 'profiles'
-- order by policyname;
