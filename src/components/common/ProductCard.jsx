import { Link } from 'react-router-dom'
import { formatLKR } from '../../lib/format'
import { useAuth } from '../../contexts/AuthContext'
import { useCart } from '../../contexts/CartContext'

export default function ProductCard({ product }) {
  const { role } = useAuth()
  const { addItem } = useCart()
  const outOfStock = Number(product.stock_quantity ?? 0) <= 0

  return (
    <div className="flex flex-col overflow-hidden rounded-lg border border-stone-200 bg-white shadow-sm transition hover:shadow-md">
      <Link to={`/products/${product.id}`} className="block aspect-square overflow-hidden bg-stone-100">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.product_name}
            className="h-full w-full object-cover transition hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-stone-400">No image</div>
        )}
      </Link>
      <div className="flex flex-1 flex-col gap-1 p-4">
        <Link to={`/products/${product.id}`} className="font-medium text-stone-900 hover:text-primary-600">
          {product.product_name}
        </Link>
        <p className="text-sm text-stone-500">
          {outOfStock ? (
            <span className="text-red-600">Out of stock</span>
          ) : (
            <>
              {product.stock_quantity} {product.unit} available
            </>
          )}
        </p>
        <div className="mt-auto flex items-center justify-between pt-2">
          <span className="text-lg font-semibold text-stone-900">
            {formatLKR(product.price)}
            {product.unit && <span className="text-xs font-normal text-stone-500"> / {product.unit}</span>}
          </span>
          {(!role || role === 'customer') && (
            <button
              type="button"
              disabled={outOfStock}
              onClick={() => addItem(product, 1)}
              className="rounded-md bg-primary-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-700 disabled:cursor-not-allowed disabled:bg-stone-300"
            >
              Add
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
