-- Helper: current user's role (renamed away from reserved current_role)
create or replace function public.my_role()
returns public.user_role
language sql stable security definer set search_path = public
as $func$ select role from public.profiles where id = auth.uid(); $func$;

-- ---------------- profiles ----------------
alter table public.profiles enable row level security;
create policy "profiles_select_own" on public.profiles for select
  using (auth.uid() = id);
create policy "profiles_select_staff_admin_cm" on public.profiles for select
  using (public.my_role() in ('administrator','staff','catering_manager'));
create policy "profiles_insert_self" on public.profiles for insert
  with check (auth.uid() = id and role = 'customer');
create policy "profiles_update_own" on public.profiles for update
  using (auth.uid() = id);
create policy "profiles_update_admin" on public.profiles for update
  using (public.my_role() = 'administrator');
create policy "profiles_delete_admin" on public.profiles for delete
  using (public.my_role() = 'administrator');

create or replace function public.prevent_role_self_escalation()
returns trigger language plpgsql security definer set search_path = public
as $func$
begin
  if public.my_role() <> 'administrator' then
    new.role := old.role;
  end if;
  return new;
end; $func$;

drop trigger if exists trg_prevent_role_self_escalation on public.profiles;
create trigger trg_prevent_role_self_escalation
  before update on public.profiles
  for each row execute function public.prevent_role_self_escalation();

-- ---------------- food_categories ----------------
alter table public.food_categories enable row level security;
create policy "food_categories_select_all" on public.food_categories for select using (true);
create policy "food_categories_write_admin" on public.food_categories for all
  using (public.my_role() = 'administrator') with check (public.my_role() = 'administrator');

-- ---------------- products ----------------
alter table public.products enable row level security;
create policy "products_select_active" on public.products for select using (is_active = true);
create policy "products_select_admin" on public.products for select using (public.my_role() = 'administrator');
create policy "products_write_admin" on public.products for insert with check (public.my_role() = 'administrator');
create policy "products_update_admin" on public.products for update
  using (public.my_role() = 'administrator') with check (public.my_role() = 'administrator');
create policy "products_delete_admin" on public.products for delete using (public.my_role() = 'administrator');

-- ---------------- catering_packages ----------------
alter table public.catering_packages enable row level security;
create policy "packages_select_active" on public.catering_packages for select using (is_active = true);
create policy "packages_select_staff" on public.catering_packages for select
  using (public.my_role() in ('administrator','catering_manager'));
create policy "packages_write_admin_cm" on public.catering_packages for insert
  with check (public.my_role() in ('administrator','catering_manager'));
create policy "packages_update_admin_cm" on public.catering_packages for update
  using (public.my_role() in ('administrator','catering_manager')) with check (public.my_role() in ('administrator','catering_manager'));
create policy "packages_delete_admin_cm" on public.catering_packages for delete
  using (public.my_role() in ('administrator','catering_manager'));

-- ---------------- package_items ----------------
alter table public.package_items enable row level security;
create policy "package_items_select_all" on public.package_items for select using (true);
create policy "package_items_write_admin_cm" on public.package_items for insert
  with check (public.my_role() in ('administrator','catering_manager'));
create policy "package_items_update_admin_cm" on public.package_items for update
  using (public.my_role() in ('administrator','catering_manager')) with check (public.my_role() in ('administrator','catering_manager'));
create policy "package_items_delete_admin_cm" on public.package_items for delete
  using (public.my_role() in ('administrator','catering_manager'));

-- ---------------- carts / cart_items ----------------
alter table public.carts enable row level security;
create policy "carts_all_own" on public.carts for all
  using (customer_id = auth.uid()) with check (customer_id = auth.uid());

alter table public.cart_items enable row level security;
create policy "cart_items_all_own" on public.cart_items for all
  using (exists (select 1 from public.carts c where c.id = cart_id and c.customer_id = auth.uid()))
  with check (exists (select 1 from public.carts c where c.id = cart_id and c.customer_id = auth.uid()));

-- ---------------- catering_reservations ----------------
alter table public.catering_reservations enable row level security;
create policy "reservations_select_own" on public.catering_reservations for select
  using (customer_id = auth.uid());
create policy "reservations_select_staff" on public.catering_reservations for select
  using (public.my_role() in ('administrator','catering_manager','staff'));
create policy "reservations_insert_own" on public.catering_reservations for insert
  with check (customer_id = auth.uid() and status = 'pending');
create policy "reservations_update_own" on public.catering_reservations for update
  using (customer_id = auth.uid()) with check (customer_id = auth.uid());
create policy "reservations_update_admin_cm" on public.catering_reservations for update
  using (public.my_role() in ('administrator','catering_manager')) with check (public.my_role() in ('administrator','catering_manager'));
create policy "reservations_delete_admin" on public.catering_reservations for delete
  using (public.my_role() = 'administrator');

-- ---------------- event_bookings ----------------
alter table public.event_bookings enable row level security;
create policy "event_bookings_select_own" on public.event_bookings for select
  using (exists (select 1 from public.catering_reservations r where r.id = reservation_id and r.customer_id = auth.uid()));
create policy "event_bookings_select_staff" on public.event_bookings for select
  using (public.my_role() in ('administrator','catering_manager','staff'));
create policy "event_bookings_insert_own" on public.event_bookings for insert
  with check (exists (select 1 from public.catering_reservations r where r.id = reservation_id and r.customer_id = auth.uid()));
create policy "event_bookings_update_admin_cm" on public.event_bookings for update
  using (public.my_role() in ('administrator','catering_manager')) with check (public.my_role() in ('administrator','catering_manager'));
create policy "event_bookings_delete_admin_cm" on public.event_bookings for delete
  using (public.my_role() in ('administrator','catering_manager'));

-- ---------------- product_orders / product_order_items ----------------
alter table public.product_orders enable row level security;
create policy "orders_select_own" on public.product_orders for select using (customer_id = auth.uid());
create policy "orders_select_admin" on public.product_orders for select using (public.my_role() = 'administrator');
create policy "orders_update_admin" on public.product_orders for update
  using (public.my_role() = 'administrator') with check (public.my_role() = 'administrator');

alter table public.product_order_items enable row level security;
create policy "order_items_select_own" on public.product_order_items for select
  using (exists (select 1 from public.product_orders o where o.id = order_id and o.customer_id = auth.uid()));
create policy "order_items_select_admin" on public.product_order_items for select
  using (public.my_role() = 'administrator');

-- ---------------- inventory_transactions ----------------
alter table public.inventory_transactions enable row level security;
create policy "inventory_select_admin" on public.inventory_transactions for select using (public.my_role() = 'administrator');
create policy "inventory_insert_admin" on public.inventory_transactions for insert with check (public.my_role() = 'administrator');

-- ---------------- staff_tasks ----------------
alter table public.staff_tasks enable row level security;
create policy "tasks_select_own" on public.staff_tasks for select using (staff_id = auth.uid());
create policy "tasks_select_admin_cm" on public.staff_tasks for select
  using (public.my_role() in ('administrator','catering_manager'));
create policy "tasks_insert_admin_cm" on public.staff_tasks for insert
  with check (public.my_role() in ('administrator','catering_manager'));
create policy "tasks_update_own" on public.staff_tasks for update
  using (staff_id = auth.uid()) with check (staff_id = auth.uid());
create policy "tasks_update_admin_cm" on public.staff_tasks for update
  using (public.my_role() in ('administrator','catering_manager')) with check (public.my_role() in ('administrator','catering_manager'));
create policy "tasks_delete_admin_cm" on public.staff_tasks for delete
  using (public.my_role() in ('administrator','catering_manager'));

-- ---------------- payments ----------------
alter table public.payments enable row level security;
create policy "payments_select_own" on public.payments for select using (customer_id = auth.uid());
create policy "payments_select_admin" on public.payments for select using (public.my_role() = 'administrator');
create policy "payments_update_admin" on public.payments for update
  using (public.my_role() = 'administrator') with check (public.my_role() = 'administrator');

-- ---------------- reports ----------------
alter table public.reports enable row level security;
create policy "reports_all_admin" on public.reports for all
  using (public.my_role() = 'administrator') with check (public.my_role() = 'administrator');