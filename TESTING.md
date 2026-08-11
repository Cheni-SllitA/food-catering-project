# Test Plan — Sahan Catering Services

**Document owner:** QA
**System under test:** Sahan Catering Services web app (React + Supabase)
**Version:** 1.0
**Related documents:** [README.md](README.md) (setup), [rls_policies.sql](rls_policies.sql) / [rls_repair.sql](rls_repair.sql) (security model)

## 1. Testing strategy

Four levels are used, narrow-and-fast at the bottom, broad-and-slow at the top:

| Level | What it checks | Who runs it | How |
|---|---|---|---|
| Unit | A single function or component in isolation | Developers, on every commit | `npm test` (Vitest) |
| Integration | Several units wired together (a context + the components that consume it), with the network layer mocked | Developers, on every commit | `npm test` (Vitest + React Testing Library) |
| System | The whole app against a real (staging) Supabase project, exercised through the browser | QA | Manual, using the test cases in §4 |
| UAT | The business accepts that the system does what was asked, using realistic scenarios | Product owner / client + real end-user representatives per role | Manual, using the scenarios in §5 |

Unit and integration tests are automated and live in the repo next to the code they cover (`*.test.js` / `*.test.jsx`). System testing and UAT are **not** automated in this iteration — the app's core value is the interaction between four roles and Postgres Row Level Security, which is best verified by a human driving the real app against a real database. §6 notes how this could be extended with Playwright if/when it's worth the investment.

## 2. Environment & prerequisites for testing

Before any level beyond unit tests can run, the environment needs:

1. A Supabase project with the schema already created (see README "Schema notes").
2. All SQL files applied, in order: `rls_repair.sql` → `place_order_rpc.sql` → `fix_signup_and_cart.sql` → `schedule_and_staff_inventory.sql` → `cm_orders_access.sql` → `reports_storage_policy.sql`.
3. `images` and `reports` Storage buckets created (public).
4. `seed_data.sql` run, so the catalog/packages aren't empty.
5. One real (or emailed-confirmation-disabled) test account per role, created by signing up and then promoting via SQL — see README §7:
   - `customer.test@example.com`
   - `staff.test@example.com` → role `staff`
   - `manager.test@example.com` → role `catering_manager`
   - `admin.test@example.com` → role `administrator`
6. `npm install` run locally, `.env` pointed at the test/staging Supabase project — **never run system testing against production data.**

## 3. Automated tests (unit + integration)

### Running them

```bash
npm test              # run once (CI mode)
npm run test:watch    # re-run on file change, for local development
```

### 3.1 Unit tests

Pure logic and single components, with no network and no other component involved.

| File | Covers |
|---|---|
| `src/lib/format.test.js` | `formatLKR` — currency formatting (grouping, decimals, null/undefined handling, numeric-string coercion from Postgres `numeric` columns) |
| `src/lib/constants.test.js` | Every app-side enum constant (`ROLES`, `ORDER_STATUS`, `PAYMENT_STATUS`, `RESERVATION_STATUS`, `TASK_STATUS`, `TRANSACTION_TYPE`) matches the **exact** Postgres enum labels. This is the #1 recurring bug class in this project (see the `inventory_txn_type: "out"` incident) — a typo here fails silently at runtime with a Postgres error, not a build error, so it's pinned down in a test. |
| `src/components/common/StatusBadge.test.jsx` | Renders the right label/color per status, and falls back gracefully for an unknown/missing status |

### 3.2 Integration tests

Multiple units together, network mocked via `src/test/supabaseMock.js` (a lightweight stand-in for the Supabase query builder).

| File | Covers |
|---|---|
| `src/components/common/ProtectedRoute.test.jsx` | The role gate used on every dashboard route: loading state, redirect-to-login when signed out, redirect-to-own-home when the role isn't allowed, and rendering the protected content when it is. This is the automated proxy for the manual role-boundary checks in ST-08–ST-11. |
| `src/contexts/CartContext.test.jsx` | Cart loading (existing cart vs. lazily creating one), subtotal/item-count computed correctly from `unit_price × quantity`, add/remove item round-trips through a reload, and that non-customer roles never touch the `carts` table at all |

### 3.3 What's deliberately *not* unit/integration tested

Anything that is mostly "call Supabase and render the result" (the admin CRUD pages, `place_product_order` RPC, RLS policies themselves) is covered at the **system** level instead — mocking Postgres RLS behavior in a unit test would test the mock, not the actual security boundary. The RLS policies are Postgres code, not JS, and are exercised for real in §4.

## 4. System Test Plan

Executed manually against a real Supabase test project, through the deployed (or `npm run dev`) app, logged in as the specific role each case calls for. Priority: **H**igh / **M**edium / **L**ow. Status is left blank for the QA execution pass — see §7 for the log template.

### 4.1 Authentication & access control

| ID | Test case | Pre-conditions | Steps | Expected result | Priority | Status |
|---|---|---|---|---|---|---|
| ST-01 | Sign up as a new customer | Email confirmation disabled in Supabase | Go to `/signup`, fill in name/email/password, submit | Account created, `profiles` row auto-created with `role = customer` via the `on_auth_user_created` trigger, redirected to `/login` | H | |
| ST-02 | Log in with valid credentials | ST-01 done | Go to `/login`, enter credentials, submit | Redirected to the role's home (`/` for customer) | H | |
| ST-03 | Log in with wrong password | Account exists | Enter valid email, wrong password | Error toast shown, stays on `/login` | M | |
| ST-04 | Forgot password | Account exists | Enter email, click "Forgot password?" | Toast confirms email sent; reset email arrives | M | |
| ST-05 | Cart RLS after a fresh signup | New customer account, `fix_signup_and_cart.sql` applied | Log in, visit `/cart` | Cart loads with 0 items, no RLS error in console | H | |
| ST-06 | Unauthenticated user hits a protected page | Logged out | Navigate directly to `/checkout` | Redirected to `/login`; after logging in, redirected back to `/checkout` (`state.from`) | H | |
| ST-07 | Role self-escalation attempt | Logged in as customer | Attempt to `update` own `profiles.role` via the client (e.g. browser devtools calling supabase) | Blocked — `prevent_role_self_escalation` trigger resets it server-side | H | |
| ST-08 | Customer tries to open `/admin` | Logged in as customer | Navigate to `/admin` | Redirected to `/` (own role home), no data leak | H | |
| ST-09 | Staff tries to open `/admin/products` | Logged in as staff | Navigate to `/admin/products` | Redirected to `/staff` | H | |
| ST-10 | Catering manager tries to edit an order | Logged in as catering_manager, ST orders visible | Go to `/catering-manager/orders` | Status/payment shown as read-only badges, not editable dropdowns | H | |
| ST-11 | Direct API call bypassing the UI | Logged in as catering_manager (any non-admin) | Using devtools, call `supabase.from('product_orders').update(...)` directly | Rejected by RLS (`orders_update_admin` requires administrator) — proves the UI-level read-only rendering isn't the only protection | H | |

### 4.2 Customer storefront

| ID | Test case | Pre-conditions | Steps | Expected result | Priority | Status |
|---|---|---|---|---|---|---|
| ST-12 | Browse product catalog | Seed data loaded | Go to `/` | Products listed with LKR prices, images, stock | H | |
| ST-13 | Filter by category | ST-12 | Select a category from the dropdown | Only matching products shown | M | |
| ST-14 | Search products | ST-12 | Type a product name fragment | Matching products shown, others hidden | M | |
| ST-15 | Inactive products hidden | Admin marks a product inactive | Reload `/` | That product does not appear (blocked by `products_select_active` RLS as well as the query) | M | |
| ST-16 | View product detail | ST-12 | Click a product | Detail page loads with breadcrumb, description, stock, quantity stepper | M | |
| ST-17 | Quantity stepper respects stock | Product with low stock (e.g. 3) | Increase quantity past stock | "+" button disables at stock limit | M | |
| ST-18 | Add to cart | Logged in as customer | Product detail → Add to Cart | Toast confirms, cart icon count increments | H | |
| ST-19 | Buy Now | Logged in as customer | Product detail → Buy Now | Item added to cart, redirected straight to `/checkout` | M | |
| ST-20 | Update quantity in cart | Item in cart | Change quantity field | Line total and cart subtotal recalculate | H | |
| ST-21 | Remove item from cart | Item in cart | Click Remove | Item disappears, subtotal updates | M | |
| ST-22 | Checkout with sufficient stock | Cart has valid items | Fill delivery address, choose payment method, Place Order | Order created, stock decremented, `inventory_transactions` logged (`sale`), payment row created, cart cleared, redirected to order detail | H | |
| ST-23 | Checkout blocked by insufficient stock | Cart quantity exceeds current stock (another customer bought the rest first) | Attempt checkout | `place_product_order` RPC rejects with a clear "Only N left in stock" error; no partial order created | H | |
| ST-24 | Checkout price integrity | — | Compare order total against `products.price × quantity` at time of order | Matches — price is read server-side inside the RPC, never trusts client input | H | |
| ST-25 | Browse catering packages | Seed data loaded | Go to `/packages` | Packages listed with price (LKR) and guest range | M | |
| ST-26 | Package detail shows items | ST-25 | Click a package | Package items list shown | L | |
| ST-27 | Reserve a package | Logged in as customer | Package detail → Reserve → fill event form → submit | `catering_reservations` row created (`status = pending`), `event_bookings` row created, appears in "My Reservations" | H | |
| ST-28 | Reservation guest-count validation | ST-27 | Enter guest count outside package's min/max | Inline validation error, submit blocked | M | |
| ST-29 | Schedule page — booked dates blocked | Another customer's reservation exists for a date | Go to `/schedule`, try to select that date | Date shown as booked/red, not selectable | H | |
| ST-30 | Schedule page — book an open date | `get_booked_event_dates` RPC in place | Select an open date, fill event form, submit | Reservation created, date now shows as booked for the next visitor, without exposing the other customer's details | H | |
| ST-31 | Schedule page visible to anonymous visitor | Logged out | Go to `/schedule` | Calendar and booked dates load (read-only); submitting prompts login | M | |
| ST-32 | My Orders history | Customer with past orders | Go to `/my-orders` | List shows correct status/payment badges, LKR totals | M | |
| ST-33 | My Reservations history | Customer with past reservations | Go to `/my-reservations` | List shows correct status, event date, guest count | M | |

### 4.3 Admin dashboard

| ID | Test case | Pre-conditions | Steps | Expected result | Priority | Status |
|---|---|---|---|---|---|---|
| ST-34 | Dashboard stat cards | Some orders/products exist | Log in as admin | Total Items, Low Stock Alerts, Pending Orders counts match the DB | M | |
| ST-35 | Create product | — | Products → + Add product → fill form → Save | New row appears in `products`, visible on storefront if active | H | |
| ST-36 | Edit product | Product exists | Products → Edit → change price → Save | Price updates everywhere it's displayed | H | |
| ST-37 | Delete product referenced by an order | Product has order history | Products → Delete | Blocked with a clear error (FK constraint), not a silent failure | M | |
| ST-38 | Toggle product active/hidden | Product exists | Click the Active/Hidden pill | Storefront visibility updates immediately | M | |
| ST-39 | Image upload | Storage bucket `images` + policies in place | Product form → upload an image | Image appears, URL saved to `image_url` | M | |
| ST-40 | Create/edit category | — | Categories → Add/Edit | Reflected in product category dropdowns | L | |
| ST-41 | Create catering package + items | — | Packages → + Add package, then → Items → add item | Package and its free-text items appear on the storefront package detail page | M | |
| ST-42 | Adjust inventory (admin) | Product exists | Inventory → Adjust stock → purchase, qty 10 | Stock increases by 10, `inventory_transactions` row logged with `transaction_type = purchase` | H | |
| ST-43 | Low stock indicator | Stock at/under threshold (10) | Inventory list | Row highlighted, "(low)" shown | M | |
| ST-44 | Update order status | Order exists | Orders → change status dropdown | Status updates, reflected in customer's My Orders | H | |
| ST-45 | Update payment status | Order exists | Orders → change payment dropdown | Payment status updates | H | |
| ST-46 | Approve/reject reservation | Reservation pending | Reservations → change status | Status updates, reflected in customer's My Reservations | H | |
| ST-47 | Promote customer to staff | Customer account exists | Staff → select customer → Promote | Role changes to `staff`; that user's next login lands on `/staff` | H | |
| ST-48 | Assign task to staff | Staff account exists | Staff → + Assign task → fill form | Task appears in that staff member's `/staff` task list | H | |
| ST-49 | Generate sales report | `reports` bucket + storage policy in place | Reports → Generate sales report | CSV uploaded, row added to Reports table, Download link works | H | |
| ST-50 | Report generation without storage policy | Storage policy removed (negative test) | Attempt generation | Fails with a clear "Bucket not found" / permission error, not a silent hang | L | |

### 4.4 Staff dashboard

| ID | Test case | Pre-conditions | Steps | Expected result | Priority | Status |
|---|---|---|---|---|---|---|
| ST-51 | View assigned tasks | Task assigned (ST-48) | Log in as staff, go to `/staff` | Task listed with correct event/date | H | |
| ST-52 | Update task status | ST-51 | Change status to In Progress, then Completed | Status persists; `completed_date` set on completion | H | |
| ST-53 | Update inventory as staff | `schedule_and_staff_inventory.sql` applied | `/staff/inventory` → Update stock on a product | Stock updates, transaction logged under this staff member's `created_by` | H | |
| ST-54 | Staff sees only their own transaction history | Multiple staff have logged transactions | `/staff/inventory` | "Your recent stock updates" shows only this user's entries | M | |
| ST-55 | Staff cannot access admin-only pages | — | Navigate to `/admin/staff` directly | Redirected to `/staff` | H | |

### 4.5 Catering Manager dashboard

| ID | Test case | Pre-conditions | Steps | Expected result | Priority | Status |
|---|---|---|---|---|---|---|
| ST-56 | Dashboard stat cards | Reservations/packages exist | Log in as catering_manager | Pending reservations / upcoming events / active packages counts correct | M | |
| ST-57 | View orders (read-only) | `cm_orders_access.sql` applied | `/catering-manager/orders` | All orders visible, no edit controls | H | |
| ST-58 | Manage packages | — | `/catering-manager/packages` → create/edit | Same CRUD as admin's package page | M | |
| ST-59 | Approve/reject reservation | — | `/catering-manager/reservations` | Same as ST-46 | H | |
| ST-60 | Edit event booking details | Reservation with event_bookings row | `/catering-manager/event-bookings` → Edit | Event type/start/end/notes update | M | |
| ST-61 | Assign staff task tied to a reservation | Staff exists, reservation exists | `/catering-manager/tasks` → + Assign task → pick reservation | Task appears for that staff member, linked to the reservation | M | |

### 4.6 Non-functional

| ID | Test case | Expected result | Priority | Status |
|---|---|---|---|---|
| ST-62 | Responsive layout — mobile width (375px) | Navbar, catalog grid, cart, and all dashboards remain usable, no horizontal scroll | M | |
| ST-63 | Responsive layout — tablet width (768px) | Same as above | L | |
| ST-64 | No secrets in the repository | `.env.example` contains only placeholders; `.env` is gitignored | H | |
| ST-65 | Build succeeds cleanly | `npm run build` — no errors, no ESLint errors on `npm run lint` | H | |
| ST-66 | RLS enabled on every table | `select tablename from pg_tables where schemaname='public' and rowsecurity=false;` returns no rows | H | |
| ST-67 | Anon key alone cannot bypass RLS | Using only the anon key (no auth), attempt to read `product_orders` | Returns empty/denied, not other customers' orders | H | |

## 5. User Acceptance Testing (UAT) Plan

UAT is run by real stakeholders (or people standing in for them) acting out their actual job, not QA testers reading a script. Each scenario has a plain-English acceptance criterion — "yes, this is what I needed" — rather than a technical expected-result.

**Sign-off convention:** Pass / Fail / Pass with comments. A scenario cannot be marked Pass if the user needed workaround help to complete it — that's Pass with comments at best, and the comment should say what was confusing.

### 5.1 Persona: Customer ("I want to order snacks and book catering for an event")

| ID | Scenario | Acceptance criteria | Tested by | Date | Result | Comments |
|---|---|---|---|---|---|---|
| UAT-C1 | Create an account and log in | I can sign up and log in without confusion, in under a minute | | | | |
| UAT-C2 | Find and buy a specific product | I can search/filter to find what I want, see a clear price in Rupees, and add it to my cart | | | | |
| UAT-C3 | Complete a purchase | I can check out, see my order confirmed, and later find it under My Orders with the right status | | | | |
| UAT-C4 | Book a catering package for an event | I can pick a package that fits my guest count, submit event details, and get confirmation | | | | |
| UAT-C5 | Use the event calendar | I can see which dates are already booked before choosing my own date | | | | |
| UAT-C6 | Track an order/reservation | I can tell at a glance whether my order/reservation is pending, confirmed, or delivered | | | | |

### 5.2 Persona: Staff ("I need to know what to do today and keep stock accurate")

| ID | Scenario | Acceptance criteria | Tested by | Date | Result | Comments |
|---|---|---|---|---|---|---|
| UAT-S1 | Check my assigned tasks | I can see what I've been asked to do, with enough detail to act on it | | | | |
| UAT-S2 | Mark a task done | I can update status as I progress without asking anyone how | | | | |
| UAT-S3 | Record a stock delivery | When new stock arrives, I can log it in under a minute and the count is right afterward | | | | |

### 5.3 Persona: Administrator ("I run the catalog, orders, staff, and reporting")

| ID | Scenario | Acceptance criteria | Tested by | Date | Result | Comments |
|---|---|---|---|---|---|---|
| UAT-A1 | Add a new product to sell | I can add a product with a photo and see it live on the storefront right away | | | | |
| UAT-A2 | Handle an incoming order | I can find a new order, see what's in it, and move it through statuses as it's fulfilled | | | | |
| UAT-A3 | Spot low stock before it runs out | The dashboard tells me what's running low without me having to check every product | | | | |
| UAT-A4 | Promote an employee to staff | I can turn an existing customer account into a staff account without needing database access | | | | |
| UAT-A5 | Pull a sales report | I can generate and download a report of orders for my own records | | | | |

### 5.4 Persona: Catering Manager ("I run events and coordinate staff")

| ID | Scenario | Acceptance criteria | Tested by | Date | Result | Comments |
|---|---|---|---|---|---|---|
| UAT-M1 | Review incoming event reservations | I can see every pending request and approve or reject it | | | | |
| UAT-M2 | See product orders for context | I can see what customers are ordering, even though I don't need to edit it | | | | |
| UAT-M3 | Assign a staff member to an event | I can pick a staff member and hand them a task tied to a specific reservation | | | | |
| UAT-M4 | Update event logistics | I can record venue/timing details against a confirmed reservation | | | | |

### 5.5 UAT sign-off

| Role | Name | Signature | Date | Overall verdict |
|---|---|---|---|---|
| Product owner | | | | Accept / Accept with conditions / Reject |
| Customer representative | | | | |
| Staff representative | | | | |
| Admin representative | | | | |
| Catering manager representative | | | | |

## 6. Out of scope / future work

- **Automated end-to-end tests** (e.g. Playwright) covering §4's flows through a real browser against a disposable Supabase branch — would let ST-01 through ST-67 run in CI instead of manually. Not set up yet; the app doesn't have a staging/CI Supabase project to run against safely.
- **Load/performance testing** — not attempted; current scale doesn't warrant it.
- **Accessibility audit (WCAG)** — not formally tested; worth a pass before a public launch.
- **Penetration testing** of the RLS policies beyond ST-07/ST-11's manual spot checks.

## 7. Defect log template

Use this for any failure found while executing §4 or §5 (copy the row per defect):

| Defect ID | Test ID | Severity (Critical/High/Med/Low) | Description | Steps to reproduce | Found by | Date | Status (Open/Fixed/Verified/Won't fix) |
|---|---|---|---|---|---|---|---|
| | | | | | | | |
