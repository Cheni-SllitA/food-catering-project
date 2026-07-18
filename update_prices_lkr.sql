-- =====================================================================
-- Convert existing prices to LKR.
--
-- Run this ONCE in the Supabase SQL editor if you already loaded data
-- with the old USD-style prices. The seed file only inserts new rows, so
-- it won't update prices that are already in the table — this does.
--
-- Option A (recommended): set curated LKR prices by name, for the known
--   sample products/packages. Rows you added yourself aren't touched.
-- Option B (fallback, at the bottom): blanket-multiply every price by an
--   approximate USD->LKR rate, for products this script doesn't name.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Option A: curated LKR prices (matches seed_data.sql)
-- ---------------------------------------------------------------------
update public.products p set price = v.price
from (values
  ('Roasted Almonds', 3500.00),
  ('Raw Cashews', 5500.00),
  ('Pumpkin Seeds', 2800.00),
  ('Mixed Nuts', 4800.00),
  ('Dried Mango Slices', 3200.00),
  ('Raisins', 1900.00),
  ('Dried Apricots', 3600.00),
  ('Banana Chips', 1400.00),
  ('Beef Jerky', 7500.00),
  ('Spicy Chicken Jerky', 6800.00),
  ('Dried Fish Flakes', 4200.00),
  ('Jasmine Rice', 420.00),
  ('Red Lentils', 650.00),
  ('Rolled Oats', 900.00),
  ('Dried Basil', 480.00),
  ('Chili Flakes', 350.00),
  ('Bay Leaves', 300.00),
  ('Tropical Trail Mix', 3200.00),
  ('Protein Power Mix', 4200.00),
  ('Classic Trail Mix', 2400.00)
) as v(product_name, price)
where p.product_name = v.product_name;

update public.catering_packages cp set price = v.price
from (values
  ('Basic Gathering', 75000.00),
  ('Standard Celebration', 165000.00),
  ('Premium Event', 360000.00),
  ('Corporate Package', 240000.00),
  ('Wedding Package', 750000.00)
) as v(package_name, price)
where cp.package_name = v.package_name;

-- ---------------------------------------------------------------------
-- Option B (OPTIONAL): for any products/packages NOT named above (e.g.
-- ones you created yourself) that still hold old USD values, approximate
-- the conversion by multiplying by ~320 and rounding to whole rupees.
-- Uncomment to use. Do NOT run this together with Option A on the same
-- rows, or they'll be converted twice.
-- ---------------------------------------------------------------------
-- update public.products
--   set price = round(price * 320)
--   where product_name not in (
--     'Roasted Almonds','Raw Cashews','Pumpkin Seeds','Mixed Nuts',
--     'Dried Mango Slices','Raisins','Dried Apricots','Banana Chips',
--     'Beef Jerky','Spicy Chicken Jerky','Dried Fish Flakes',
--     'Jasmine Rice','Red Lentils','Rolled Oats','Dried Basil',
--     'Chili Flakes','Bay Leaves','Tropical Trail Mix',
--     'Protein Power Mix','Classic Trail Mix'
--   );
