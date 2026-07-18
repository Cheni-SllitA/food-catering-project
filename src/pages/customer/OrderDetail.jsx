import { useEffect, useState } from 'react'
import { formatLKR } from '../../lib/format'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'
import Loader from '../../components/common/Loader'
import EmptyState from '../../components/common/EmptyState'
import StatusBadge from '../../components/common/StatusBadge'

export default function OrderDetail() {
  const { id } = useParams()
  const [order, setOrder] = useState(null)
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    async function load() {
      setLoading(true)
      const [{ data: orderData, error: orderError }, { data: itemsData, error: itemsError }] = await Promise.all([
        supabase.from('product_orders').select('*').eq('id', id).single(),
        supabase.from('product_order_items').select('*, product:products(product_name, unit, image_url)').eq('order_id', id),
      ])
      if (!mounted) return
      if (orderError) console.error('Failed to load order', orderError)
      if (itemsError) console.error('Failed to load order items', itemsError)
      setOrder(orderData ?? null)
      setItems(itemsData ?? [])
      setLoading(false)
    }
    load()
    return () => {
      mounted = false
    }
  }, [id])

  if (loading) return <Loader />
  if (!order) return <EmptyState title="Order not found" action={<Link to="/my-orders" className="text-primary-600">Back to my orders</Link>} />

  return (
    <div className="mx-auto max-w-2xl">
      <Link to="/my-orders" className="text-sm text-primary-600 hover:underline">&larr; Back to my orders</Link>
      <div className="mt-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-stone-900">Order #{order.id.slice(0, 8)}</h1>
        <div className="flex gap-2">
          <StatusBadge status={order.status} />
          <StatusBadge status={order.payment_status} />
        </div>
      </div>
      <p className="mt-1 text-sm text-stone-500">Placed on {new Date(order.created_at).toLocaleString()}</p>
      <p className="mt-1 text-sm text-stone-500">Delivery address: {order.delivery_address}</p>

      <ul className="mt-6 divide-y divide-stone-100 rounded-lg border border-stone-200 bg-white">
        {items.map((item) => (
          <li key={item.id} className="flex items-center justify-between px-4 py-3 text-sm">
            <span className="text-stone-700">
              {item.product?.product_name} &times; {item.quantity}
            </span>
            <span className="font-medium text-stone-900">{formatLKR(item.subtotal)}</span>
          </li>
        ))}
      </ul>

      <div className="mt-4 flex justify-end text-lg font-semibold text-stone-900">
        Total: {formatLKR(order.total_amount)}
      </div>
    </div>
  )
}
