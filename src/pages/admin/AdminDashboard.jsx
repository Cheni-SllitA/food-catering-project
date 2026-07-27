import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { supabase } from '../../lib/supabaseClient'
import Loader from '../../components/common/Loader'
import EmptyState from '../../components/common/EmptyState'
import { Button } from '../../components/common/FormControls'
import { LOW_STOCK_THRESHOLD } from '../../lib/constants'

export default function AdminDashboard() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [products, setProducts] = useState([])
  const [pendingOrders, setPendingOrders] = useState(0)

  const load = async () => {
    setLoading(true)
    const [productsRes, ordersRes] = await Promise.all([
      supabase.from('products').select('*, category:food_categories(category_name)').order('product_name'),
      supabase.from('product_orders').select('id, status'),
    ])
    setProducts(productsRes.data ?? [])
    setPendingOrders((ordersRes.data ?? []).filter((o) => o.status === 'pending').length)
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  const handleDelete = async (product) => {
    if (!confirm(`Delete "${product.product_name}"? This cannot be undone.`)) return
    const { error } = await supabase.from('products').delete().eq('id', product.id)
    if (error) {
      toast.error('Could not delete product (it may be referenced by existing orders)')
      return
    }
    toast.success('Product deleted')
    load()
  }

  if (loading) return <Loader />

  const lowStockCount = products.filter((p) => Number(p.stock_quantity ?? 0) <= LOW_STOCK_THRESHOLD).length

  return (
    <div>
      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Total Items" value={products.length} tone="sky" />
        <StatCard label="Low Stock Alerts" value={lowStockCount} tone={lowStockCount > 0 ? 'red' : 'emerald'} />
        <StatCard label="Pending Orders" value={pendingOrders} tone="violet" />
      </div>

      {/* Add item */}
      <div className="mt-6 flex justify-end">
        <Button onClick={() => navigate('/admin/products')}>+ Add Item</Button>
      </div>

      {/* Items table */}
      <div className="mt-4 overflow-x-auto rounded-xl border border-stone-300 bg-white">
        {products.length === 0 ? (
          <EmptyState title="No items yet" message="Add your first product to get started." />
        ) : (
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-primary-200 bg-primary-50 text-left text-stone-700">
                <th className="px-5 py-3 font-semibold">Item Name</th>
                <th className="px-5 py-3 font-semibold">Category</th>
                <th className="px-5 py-3 font-semibold">Qty</th>
                <th className="px-5 py-3 font-semibold">Status</th>
                <th className="px-5 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200">
              {products.map((p) => {
                const low = Number(p.stock_quantity ?? 0) <= LOW_STOCK_THRESHOLD
                return (
                  <tr key={p.id} className="hover:bg-stone-50">
                    <td className="px-5 py-3 font-medium text-stone-900">{p.product_name}</td>
                    <td className="px-5 py-3 text-stone-600">{p.category?.category_name || '-'}</td>
                    <td className="px-5 py-3 text-stone-600">{p.stock_quantity}</td>
                    <td className="px-5 py-3">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          low ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'
                        }`}
                      >
                        {low ? 'Low Stock' : 'In Stock'}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex gap-3 text-stone-600">
                        <button
                          type="button"
                          onClick={() => navigate('/admin/products')}
                          className="hover:text-stone-900"
                          title="Edit"
                          aria-label={`Edit ${p.product_name}`}
                        >
                          &#9998;
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(p)}
                          className="hover:text-red-600"
                          title="Delete"
                          aria-label={`Delete ${p.product_name}`}
                        >
                          &#128465;
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

const STAT_TONES = {
  sky: 'border-sky-200 bg-sky-50 text-sky-700',
  red: 'border-red-200 bg-red-50 text-red-700',
  emerald: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  violet: 'border-violet-200 bg-violet-50 text-violet-700',
}

function StatCard({ label, value, tone = 'sky' }) {
  return (
    <div className={`rounded-xl border p-5 py-6 ${STAT_TONES[tone]}`}>
      <p className="text-sm opacity-80">{label}</p>
      <p className="mt-2 text-3xl font-bold">{value}</p>
    </div>
  )
}
