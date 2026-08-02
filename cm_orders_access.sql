-- =====================================================================
-- Let catering_manager view (not edit) product_orders.
--
-- Run in the Supabase SQL editor. Idempotent — safe to re-run.
--
-- Previously only 'administrator' could select from product_orders.
-- The Orders page is now also linked into the Catering Manager
-- dashboard (src/pages/admin/OrdersAdmin.jsx, reused there), but it
-- renders status as read-only (StatusBadge) for any role other than
-- administrator — no update policy is added here, so a catering
-- manager genuinely cannot change order/payment status even if they
-- tried to call the API directly.
-- =====================================================================

alter table public.product_orders enable row level security;

drop policy if exists "orders_select_cm" on public.product_orders;
create policy "orders_select_cm" on public.product_orders for select
  using (public.my_role() = 'catering_manager');

-- ---------------------------------------------------------------------
-- Verify (optional): run standalone.
-- ---------------------------------------------------------------------
-- select policyname, cmd from pg_policies
-- where schemaname = 'public' and tablename = 'product_orders'
-- order by policyname;
