import { supabase } from './supabaseClient'

/**
 * Places a product order via the `place_product_order` Postgres RPC
 * (see rls_policies.sql). Running this server-side keeps stock checks and
 * pricing atomic and authoritative — the client only sends product ids and
 * quantities, never prices or totals.
 */
export async function placeOrder({ items, deliveryAddress, paymentMethod }) {
  if (!items.length) throw new Error('Cart is empty')

  const { data, error } = await supabase.rpc('place_product_order', {
    p_delivery_address: deliveryAddress,
    p_payment_method: paymentMethod,
    p_items: items.map((item) => ({ product_id: item.product_id, quantity: item.quantity })),
  })
  if (error) throw error
  return data
}
