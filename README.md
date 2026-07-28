# Savory Catering — Online Catering & Dried Food Product Management

A React (Vite) + Supabase web app for a catering business: a customer storefront
(products, catering packages, cart, checkout, reservations) plus role-specific
dashboards for Admin, Catering Manager, and Staff.

## Tech stack

- React 19 + Vite, React Router v6
- Supabase (`@supabase/supabase-js`) for auth, Postgres, and Storage
- Tailwind CSS v4
- React Context for auth/cart state
- `react-hot-toast` for notifications

## Getting started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure Supabase

Copy `.env.example` to `.env` and fill in your project's values (Project
Settings → API in the Supabase dashboard):

```bash
cp .env.example .env
```

```
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Apply Row Level Security policies

This project assumes the database schema already exists (see "Schema
assumptions" below) — it does **not** create tables. Run [`rls_policies.sql`](rls_policies.sql)
in the Supabase SQL editor to:

- Enable RLS and add role-appropriate policies on every table

Then run [`place_order_rpc.sql`](place_order_rpc.sql) to create the
`place_product_order(...)` RPC function that the checkout flow calls to
atomically validate stock, compute totals from server-side prices, decrement
stock, log an inventory transaction, and create the order/payment — all in
one transaction, so the client never has to be trusted with pricing or
stock math.

Finally run [`fix_signup_and_cart.sql`](fix_signup_and_cart.sql). This adds
a trigger that auto-creates each user's `profiles` row server-side on
signup (so the browser never has to, which avoids an RLS race), backfills
profiles for any existing users, and re-asserts the `carts` / `cart_items`
policies. **Skipping this causes "row-level security policy" errors on
signup and "cart couldn't be loaded" on login.**

Then run [`schedule_and_staff_inventory.sql`](schedule_and_staff_inventory.sql).
This backs two customer/staff pages:

- `get_booked_event_dates()` RPC — powers the calendar on `/schedule`
  (customer event booking) by exposing just the date + event type of
  non-cancelled reservations, without leaking other customers' details.
- Staff RLS policies on `products` and `inventory_transactions` — the
  original policies only let `administrator` touch stock; this adds
  `staff` as well (staff can only log transactions as themselves).

### 4. Create a Storage bucket for images

In Supabase Storage, create two **public** buckets:

- `images` — used for product and catering package photos (`images/products/...`, `images/packages/...`)
- `reports` — used for generated sales report CSVs

If you'd rather keep buckets private, add Storage policies granting
`admin`/`catering_manager` write access and public (or authenticated) read
access, and adjust `src/lib/storage.js` accordingly.

### 5. (Optional) Load sample data

[`seed_data.sql`](seed_data.sql) inserts sample `food_categories`,
`products`, `catering_packages`, and `package_items` so the storefront
isn't empty on first run. It's safe to re-run (each insert is guarded by a
`where not exists` check). It does **not** seed `profiles`, orders, or
reservations — those need a real `auth.users` row, which only exists once
someone signs up through the app (see step 7 below for creating an admin).

### 6. Run the dev server

```bash
npm run dev
```

### 7. Create your first admin user

Sign up normally through the app (this creates a `profiles` row with
`role = 'customer'`), then in the Supabase SQL editor promote yourself
(profiles has no email column, so join through `auth.users`):

```sql
update public.profiles set role = 'administrator'
where id = (select id from auth.users where email = 'you@example.com');
```

From the Admin dashboard you can then promote other signed-up users to
`staff`, or run the same `update` statement with `'catering_manager'`.

## Project structure

```
src/
  components/
    common/     # ProtectedRoute, ProductCard, DataTable, Modal, StatusBadge, form controls...
    layout/     # Navbar, Sidebar, StorefrontLayout, DashboardLayout
  contexts/     # AuthContext, CartContext
  hooks/        # useCategories, ...
  lib/          # supabaseClient, constants, orders (checkout RPC), storage (image upload)
  pages/
    auth/       # Login, Signup
    customer/   # Catalog, product/package detail, cart, checkout, reservations, order history
    admin/      # Dashboard, products/categories/packages/inventory/orders/reservations/staff/reports
    staff/      # Assigned tasks
    catering-manager/  # Dashboard, event bookings, staff task assignment (reuses admin packages/reservations pages)
  App.jsx       # Route tree, role-based access via ProtectedRoute
```

## Roles

`profiles.role` is one of `customer`, `staff`, `admin`, `catering_manager`.
Routes are gated client-side via `ProtectedRoute` (`allowedRoles`) and
server-side via the RLS policies in `rls_policies.sql` — both need to agree
with your actual schema's role names.

## Schema notes

The code matches the existing Supabase schema, including:

- Name columns are `product_name`, `category_name`, `package_name`
  (not `name`)
- `catering_packages` uses `minimum_people` / `maximum_people`
- `catering_reservations` uses `event_location` / `number_of_guests`
- `profiles` has **no email column** (email lives in `auth.users`); it has
  `full_name, phone, address, role`
- `package_items` are free-text (`item_name`, `quantity`, `notes`) — they
  don't reference `products`
- `product_order_items` uses `price` (not `unit_price`); `product_orders`
  has `total_amount` but no `subtotal`
- `event_bookings` has `event_type`, `event_start`, `event_end`, `notes`
- `products` has no `low_stock_threshold` column — the app uses a single
  app-wide threshold (`LOW_STOCK_THRESHOLD` in `src/lib/constants.js`)

Enum values (`src/lib/constants.js` mirrors these):

- `user_role`: customer, administrator, catering_manager, staff
- `order_status`: pending, processing, shipped, delivered, cancelled
- `payment_status`: pending, paid, failed, refunded
- `reservation_status`: pending, approved, rejected, completed, cancelled
- `task_status`: assigned, in_progress, completed
- `inventory_txn_type`: purchase, sale, adjustment, return

## Notes on the checkout flow

`src/lib/orders.js` calls the `place_product_order` RPC (defined in
`rls_policies.sql`) rather than doing sequential client-side inserts. This
avoids overselling under concurrent checkouts (`SELECT ... FOR UPDATE` locks
the product rows) and stops a malicious client from submitting a forged
price — the function always reads the authoritative price from `products`.
