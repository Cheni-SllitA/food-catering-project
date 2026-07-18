import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { useCategories } from '../../hooks/useCategories'
import ProductCard from '../../components/common/ProductCard'
import Loader from '../../components/common/Loader'
import EmptyState from '../../components/common/EmptyState'
import { Input, Select } from '../../components/common/FormControls'

export default function ProductCatalog() {
  const { categories } = useCategories()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [categoryId, setCategoryId] = useState('all')

  useEffect(() => {
    let mounted = true
    async function load() {
      setLoading(true)
      let query = supabase.from('products').select('*').eq('is_active', true).order('product_name')
      if (categoryId !== 'all') query = query.eq('category_id', categoryId)
      const { data, error } = await query
      if (!mounted) return
      if (error) console.error('Failed to load products', error)
      setProducts(data ?? [])
      setLoading(false)
    }
    load()
    return () => {
      mounted = false
    }
  }, [categoryId])

  const filtered = useMemo(() => {
    if (!search.trim()) return products
    const q = search.toLowerCase()
    return products.filter((p) => p.product_name?.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q))
  }, [products, search])

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Dried Food Products</h1>
          <p className="text-sm text-stone-500">Browse our catalog of quality dried food products</p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Input placeholder="Search products..." value={search} onChange={(e) => setSearch(e.target.value)} />
          <Select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
            <option value="all">All categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.category_name}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {loading ? (
        <Loader />
      ) : filtered.length === 0 ? (
        <EmptyState title="No products found" message="Try a different search or category." />
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {filtered.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  )
}
