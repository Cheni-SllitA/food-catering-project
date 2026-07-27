-- =====================================================================
-- RPC: place_product_order — run this in the Supabase SQL editor after
-- rls_policies.sql. The checkout flow (src/lib/orders.js) calls this.
--
-- Atomically validates stock, computes prices/totals from the current
-- products table (never trusting client-supplied prices), creates the
-- order + order items, decrements stock, logs an inventory_transactions
-- row per item ('sale'), creates a pending payments row, and clears the
-- caller's cart. SECURITY DEFINER so it can write through RLS while
-- still only ever acting as auth.uid().
-- =====================================================================
create or replace function public.place_product_order(
  p_delivery_address text,
  p_payment_method text,
  p_items jsonb -- [{ "product_id": "...", "quantity": 2 }, ...]
)
returns public.product_orders
language plpgsql
security definer
set search_path = public
as $$
declare
  v_customer_id uuid := auth.uid();
  v_order public.product_orders;
  v_item jsonb;
  v_product public.products%rowtype;
  v_quantity integer;
  v_total numeric := 0;
begin
  if v_customer_id is null then
    raise exception 'Not authenticated';
  end if;

  if p_items is null or jsonb_array_length(p_items) = 0 then
    raise exception 'No items provided';
  end if;

  -- Lock the involved product rows and validate stock before writing anything.
  for v_item in select * from jsonb_array_elements(p_items) loop
    v_quantity := (v_item->>'quantity')::integer;
    if v_quantity is null or v_quantity <= 0 then
      raise exception 'Invalid quantity';
    end if;

    select * into v_product
    from public.products
    where id = (v_item->>'product_id')::uuid
    for update;

    if not found then
      raise exception 'Product % not found', v_item->>'product_id';
    end if;
    if not v_product.is_active then
      raise exception '% is not available', v_product.product_name;
    end if;
    if v_product.stock_quantity < v_quantity then
      raise exception 'Only % of "%" left in stock', v_product.stock_quantity, v_product.product_name;
    end if;

    v_total := v_total + (v_product.price * v_quantity);
  end loop;

  insert into public.product_orders (customer_id, delivery_address, total_amount, status, payment_status)
  values (v_customer_id, p_delivery_address, v_total, 'pending', 'pending')
  returning * into v_order;

  for v_item in select * from jsonb_array_elements(p_items) loop
    v_quantity := (v_item->>'quantity')::integer;

    select * into v_product from public.products where id = (v_item->>'product_id')::uuid;

    insert into public.product_order_items (order_id, product_id, quantity, price, subtotal)
    values (v_order.id, v_product.id, v_quantity, v_product.price, v_product.price * v_quantity);

    update public.products
    set stock_quantity = stock_quantity - v_quantity
    where id = v_product.id;

    insert into public.inventory_transactions (product_id, transaction_type, quantity, reference, created_by)
    values (v_product.id, 'sale', v_quantity, 'Order ' || v_order.id, v_customer_id);
  end loop;

  insert into public.payments (customer_id, order_id, amount, payment_method, payment_status)
  values (v_customer_id, v_order.id, v_total, p_payment_method, 'pending');

  delete from public.cart_items
  where cart_id in (select id from public.carts where customer_id = v_customer_id);

  return v_order;
end;
$$;

grant execute on function public.place_product_order(text, text, jsonb) to authenticated;
