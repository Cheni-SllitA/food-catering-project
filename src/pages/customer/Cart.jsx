import { Link, useNavigate } from 'react-router-dom'
import { formatLKR } from '../../lib/format'
import { useCart } from '../../contexts/CartContext'
import Loader from '../../components/common/Loader'
import EmptyState from '../../components/common/EmptyState'
import { Button } from '../../components/common/FormControls'

export default function Cart() {
  const { items, loading, subtotal, updateQuantity, removeItem } = useCart()
  const navigate = useNavigate()

  if (loading) return <Loader />

  if (items.length === 0) {
    return (
      <EmptyState
        title="Your cart is empty"
        message="Browse our products and add something delicious."
        action={
          <Link to="/" className="mt-2 inline-block rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700">
            Browse products
          </Link>
        }
      />
    )
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-stone-900">Your Cart</h1>
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ul className="divide-y divide-stone-100 rounded-lg border border-stone-200 bg-white">
            {items.map((item) => {
              const stock = item.product?.stock_quantity ?? Infinity
              return (
                <li key={item.id} className="flex items-center gap-4 p-4">
                  <div className="h-16 w-16 shrink-0 overflow-hidden rounded-md bg-stone-100">
                    {item.product?.image_url && (
                      <img src={item.product.image_url} alt={item.product?.product_name} className="h-full w-full object-cover" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-stone-900">{item.product?.product_name}</p>
                    <p className="text-sm text-stone-500">{formatLKR(item.unit_price)} / {item.product?.unit}</p>
                    {item.quantity > stock && (
                      <p className="text-xs text-red-600">Only {stock} left in stock</p>
                    )}
                  </div>
                  <input
                    type="number"
                    min={1}
                    max={stock === Infinity ? undefined : stock}
                    value={item.quantity}
                    onChange={(e) => updateQuantity(item.id, Number(e.target.value))}
                    className="w-16 rounded-md border border-stone-300 px-2 py-1 text-sm"
                  />
                  <p className="w-20 text-right font-medium text-stone-900">
                    {formatLKR(Number(item.unit_price ?? 0) * item.quantity)}
                  </p>
                  <button
                    type="button"
                    onClick={() => removeItem(item.id)}
                    className="text-sm text-red-600 hover:underline"
                  >
                    Remove
                  </button>
                </li>
              )
            })}
          </ul>
        </div>

        <div className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-stone-900">Order Summary</h2>
          <div className="flex justify-between text-sm text-stone-600">
            <span>Subtotal</span>
            <span>{formatLKR(subtotal)}</span>
          </div>
          <div className="mt-2 flex justify-between border-t border-stone-100 pt-2 text-base font-semibold text-stone-900">
            <span>Total</span>
            <span>{formatLKR(subtotal)}</span>
          </div>
          <Button
            className="mt-4 w-full"
            disabled={items.some((i) => i.quantity > (i.product?.stock_quantity ?? Infinity))}
            onClick={() => navigate('/checkout')}
          >
            Proceed to checkout
          </Button>
        </div>
      </div>
    </div>
  )
}
