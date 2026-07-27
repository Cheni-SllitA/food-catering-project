import { useEffect, useState } from 'react'
import { formatLKR } from '../../lib/format'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../contexts/AuthContext'
import { useCart } from '../../contexts/CartContext'
import Loader from '../../components/common/Loader'
import EmptyState from '../../components/common/EmptyState'
import { Button } from '../../components/common/FormControls'

export default function ProductDetail() {
  const { id } = useParams()
  const { user, role } = useAuth()
  const { addItem } = useCart()
  const navigate = useNavigate()
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [quantity, setQuantity] = useState(1)
  const [buying, setBuying] = useState(false)

  useEffect(() => {
    let mounted = true
    async function load() {
      setLoading(true)
      const { data, error } = await supabase
        .from('products')
        .select('*, category:food_categories(category_name)')
        .eq('id', id)
        .single()
      if (!mounted) return
      if (error) console.error('Failed to load product', error)
      setProduct(data ?? null)
      setLoading(false)
    }
    load()
    return () => {
      mounted = false
    }
  }, [id])

  if (loading) return <Loader />
  if (!product) return <EmptyState title="Product not found" action={<Link to="/" className="text-primary-600 underline">Back to catalog</Link>} />

  const outOfStock = Number(product.stock_quantity ?? 0) <= 0
  const maxQty = Number(product.stock_quantity ?? 1)
  const canShop = !role || role === 'customer'

  const step = (delta) => setQuantity((q) => Math.min(Math.max(1, q + delta), maxQty || 1))

  const handleBuyNow = async () => {
    if (!user) {
      navigate('/login', { state: { from: { pathname: `/products/${id}` } } })
      return
    }
    setBuying(true)
    await addItem(product, quantity)
    setBuying(false)
    navigate('/checkout')
  }

  return (
    <div>
      {/* Breadcrumb */}
      <nav className="mb-6 text-sm text-stone-500">
        <Link to="/" className="text-primary-600 hover:underline">Home</Link>
        {product.category?.category_name && (
          <>
            <span className="mx-2">/</span>
            <span>{product.category.category_name}</span>
          </>
        )}
        <span className="mx-2">/</span>
        <span className="text-stone-900">{product.product_name}</span>
      </nav>

      <div className="grid grid-cols-1 gap-10 md:grid-cols-2">
        <div className="aspect-square overflow-hidden rounded-xl border border-stone-300 bg-stone-100">
          {product.image_url ? (
            <img src={product.image_url} alt={product.product_name} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-stone-400">product image</div>
          )}
        </div>

        <div className="flex flex-col">
          <h1 className="text-3xl font-bold text-stone-900">{product.product_name}</h1>
          {product.description && <p className="mt-3 text-stone-600">{product.description}</p>}
          <p className="mt-3 text-sm text-stone-500">
            {outOfStock ? (
              <span className="text-red-600">Out of stock</span>
            ) : (
              <>{product.stock_quantity} {product.unit} in stock</>
            )}
          </p>

          {canShop && (
            <>
              <div className="mt-6">
                <p className="mb-1.5 text-sm font-medium text-stone-700">Quantity</p>
                <div className="inline-flex items-center rounded-lg border border-stone-300 bg-white">
                  <button
                    type="button"
                    onClick={() => step(-1)}
                    disabled={quantity <= 1}
                    className="px-4 py-2 text-lg text-stone-700 hover:bg-stone-100 disabled:text-stone-300"
                    aria-label="Decrease quantity"
                  >
                    &minus;
                  </button>
                  <span className="w-12 border-x border-stone-300 py-2 text-center text-sm font-medium">{quantity}</span>
                  <button
                    type="button"
                    onClick={() => step(1)}
                    disabled={quantity >= maxQty}
                    className="px-4 py-2 text-lg text-stone-700 hover:bg-stone-100 disabled:text-stone-300"
                    aria-label="Increase quantity"
                  >
                    +
                  </button>
                </div>
              </div>

              <p className="mt-5 text-2xl font-bold text-stone-900">
                {formatLKR(Number(product.price ?? 0) * quantity)}
                {product.unit && <span className="text-sm font-normal text-stone-500"> ({formatLKR(product.price)} / {product.unit})</span>}
              </p>

              <div className="mt-6 flex max-w-sm flex-col gap-3">
                <Button disabled={outOfStock} onClick={() => addItem(product, quantity)} className="w-full">
                  Add to Cart
                </Button>
                <Button variant="secondary" disabled={outOfStock || buying} onClick={handleBuyNow} className="w-full">
                  {buying ? 'Adding...' : 'Buy Now'}
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
