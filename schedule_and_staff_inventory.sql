-- =====================================================================
-- Backend additions for two new pages:
--   src/pages/customer/schedule.jsx  (calendar-based event booking)
--   src/pages/staff/StaffInventory.jsx (staff stock updates)
--
-- Run this in the Supabase SQL editor AFTER rls_repair.sql. Idempotent —
-- every object is dropped-if-exists first, safe to re-run.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. get_booked_event_dates() — powers the Schedule calendar.
--
-- Customers need to see which dates are already booked so they can pick
-- an open day, but the existing "reservations_select_own" RLS policy
-- only lets a customer see their OWN reservations. Rather than loosen
-- RLS on the whole table (which would leak other customers' guest
-- counts, notes, etc.), this SECURITY DEFINER function exposes only
-- the date and event type — nothing customer-identifying. Open to
-- anon + authenticated so people can browse availability before
-- logging in, matching the rest of the storefront.
-- ---------------------------------------------------------------------
create or replace function public.get_booked_event_dates()
returns table (event_date date, event_type text)
language sql
stable
security definer
set search_path = public
as $$
  select r.event_date, b.event_type
  from public.catering_reservations r
  left join public.event_bookings b on b.reservation_id = r.id
  where r.event_date is not null
    and r.status not in ('rejected', 'cancelled');
$$;

grant execute on function public.get_booked_event_dates() to anon, authenticated;

-- ---------------------------------------------------------------------
-- 2. Staff permissions for inventory updates.
--
-- The existing policies only let 'administrator' update products or
-- write inventory_transactions. StaffInventory.jsx needs staff to do
-- both. Kept as separate additive policies so the admin policies are
-- untouched.
-- ---------------------------------------------------------------------
alter table public.products enable row level security;

drop policy if exists "products_select_staff" on public.products;
create policy "products_select_staff" on public.products for select
  using (public.my_role() in ('administrator', 'staff'));

drop policy if exists "products_update_staff" on public.products;
create policy "products_update_staff" on public.products for update
  using (public.my_role() in ('administrator', 'staff'))
  with check (public.my_role() in ('administrator', 'staff'));

alter table public.inventory_transactions enable row level security;

-- Staff can log a transaction only as themselves (created_by = auth.uid()).
drop policy if exists "inventory_insert_staff" on public.inventory_transactions;
create policy "inventory_insert_staff" on public.inventory_transactions for insert
  with check (public.my_role() = 'staff' and created_by = auth.uid());

-- Staff can see their own transaction history (the "Recent stock
-- updates" list). Admins already see everything via inventory_select_admin.
drop policy if exists "inventory_select_own_staff" on public.inventory_transactions;
create policy "inventory_select_own_staff" on public.inventory_transactions for select
  using (created_by = auth.uid());

-- ---------------------------------------------------------------------
-- Verify (optional): run standalone.
-- ---------------------------------------------------------------------
-- select tablename, policyname, cmd from pg_policies
-- where schemaname = 'public' and tablename in ('products', 'inventory_transactions')
-- order by tablename, policyname;
