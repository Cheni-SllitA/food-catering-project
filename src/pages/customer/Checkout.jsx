import { useState } from 'react'
import { formatLKR } from '../../lib/format'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuth } from '../../contexts/AuthContext'
import { useCart } from '../../contexts/CartContext'
import { placeOrder } from '../../lib/orders'
import { Input, TextArea, Button, Card } from '../../components/common/FormControls'
import EmptyState from '../../components/common/EmptyState'

const PAYMENT_METHODS = [
  { value: 'card', label: 'Card' },
  { value: 'cash_on_delivery', label: 'Cash on Delivery' },
]

export default function Checkout() {
  const { profile } = useAuth()
  const { items, subtotal, reload } = useCart()
  const navigate = useNavigate()
  const [form, setForm] = useState({
    name: profile?.full_name ?? '',
    address: profile?.address ?? '',
    phone: profile?.phone ?? '',
  })
  const [paymentMethod, setPaymentMethod] = useState('cash_on_delivery')
  const [submitting, setSubmitting] = useState(false)

  if (items.length === 0) {
    return <EmptyState title="Your cart is empty" message="Add products before checking out." />
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name.trim() || !form.address.trim()) {
      toast.error('Please fill in your name and delivery address')
      return
    }
    setSubmitting(true)
    try {
      const deliveryAddress = [form.name, form.address, form.phone && `Phone: ${form.phone}`]
        .filter(Boolean)
        .join('\n')
      const order = await placeOrder({ items, deliveryAddress, paymentMethod })
      await reload()
      toast.success('Order placed successfully!')
      navigate(`/my-orders/${order.id}`)
    } catch (err) {
      console.error(err)
      toast.error(err.message || 'Could not place order')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Left: delivery + payment */}
        <Card className="p-6">
          <h2 className="mb-5 text-xl font-bold text-stone-900">Delivery Address</h2>
          <div className="flex flex-col gap-4">
            <Input label="Name" required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            <TextArea label="Address" required rows={3} value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} />
            <Input label="Phone" type="tel" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
          </div>

          <h2 className="mb-4 mt-8 text-xl font-bold text-stone-900">Payment Method</h2>
          <div className="flex flex-wrap gap-6">
            {PAYMENT_METHODS.map((m) => (
              <label key={m.value} className="flex cursor-pointer items-center gap-2.5 text-sm text-stone-800">
                <input
                  type="radio"
                  name="payment_method"
                  value={m.value}
                  checked={paymentMethod === m.value}
                  onChange={() => setPaymentMethod(m.value)}
                  className="h-4 w-4 accent-primary-600"
                />
                {m.label}
              </label>
            ))}
          </div>
        </Card>

        {/* Right: order summary */}
        <Card className="flex flex-col p-6">
          <h2 className="mb-5 text-xl font-bold text-stone-900">Order Summary</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-stone-200 text-left text-stone-500">
                <th className="pb-2 font-medium">Item</th>
                <th className="pb-2 text-center font-medium">Qty</th>
                <th className="pb-2 text-right font-medium">Price</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-b border-dotted border-stone-200">
                  <td className="py-2.5 text-stone-800">{item.product?.product_name}</td>
                  <td className="py-2.5 text-center text-stone-600">{item.quantity}</td>
                  <td className="py-2.5 text-right font-medium text-stone-900">
                    {formatLKR(Number(item.unit_price ?? 0) * item.quantity)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mt-4 flex justify-between text-base font-bold text-stone-900">
            <span>Total</span>
            <span>{formatLKR(subtotal)}</span>
          </div>

          <Button type="submit" disabled={submitting} className="mt-6 w-full">
            {submitting ? 'Placing order...' : 'Place Order'}
          </Button>
        </Card>
      </div>
    </form>
  )
}
