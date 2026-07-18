import { useEffect, useState } from 'react'
import { formatLKR } from '../../lib/format'
import toast from 'react-hot-toast'
import { supabase } from '../../lib/supabaseClient'
import { useCategories } from '../../hooks/useCategories'
import DataTable from '../../components/common/DataTable'
import Modal from '../../components/common/Modal'
import ImageUploadField from '../../components/common/ImageUploadField'
import { Button, Input, Select, TextArea, PageHeader } from '../../components/common/FormControls'

const EMPTY_FORM = {
  id: null,
  product_name: '',
  description: '',
  category_id: '',
  price: '',
  unit: '',
  stock_quantity: '',
  image_url: '',
  is_active: true,
}

export default function ProductsAdmin() {
  const { categories } = useCategories()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  const load = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('products')
      .select('*, category:food_categories(category_name)')
      .order('product_name')
    if (error) console.error('Failed to load products', error)
    setProducts(data ?? [])
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  const openCreate = () => {
    setForm(EMPTY_FORM)
    setModalOpen(true)
  }

  const openEdit = (product) => {
    setForm({
      id: product.id,
      product_name: product.product_name ?? '',
      description: product.description ?? '',
      category_id: product.category_id ?? '',
      price: product.price ?? '',
      unit: product.unit ?? '',
      stock_quantity: product.stock_quantity ?? '',
      image_url: product.image_url ?? '',
      is_active: product.is_active ?? true,
    })
    setModalOpen(true)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    const payload = {
      product_name: form.product_name,
      description: form.description || null,
      category_id: form.category_id || null,
      price: Number(form.price),
      unit: form.unit,
      stock_quantity: Number(form.stock_quantity),
      image_url: form.image_url || null,
      is_active: form.is_active,
    }
    try {
      if (form.id) {
        const { error } = await supabase.from('products').update(payload).eq('id', form.id)
        if (error) throw error
        toast.success('Product updated')
      } else {
        const { error } = await supabase.from('products').insert(payload)
        if (error) throw error
        toast.success('Product created')
      }
      setModalOpen(false)
      await load()
    } catch (err) {
      console.error(err)
      toast.error(err.message || 'Could not save product')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (product) => {
    if (!confirm(`Delete "${product.product_name}"? This cannot be undone.`)) return
    const { error } = await supabase.from('products').delete().eq('id', product.id)
    if (error) {
      console.error(error)
      toast.error('Could not delete product (it may be referenced by existing orders)')
      return
    }
    toast.success('Product deleted')
    load()
  }

  const toggleActive = async (product) => {
    const { error } = await supabase.from('products').update({ is_active: !product.is_active }).eq('id', product.id)
    if (error) {
      toast.error('Could not update product')
      return
    }
    load()
  }

  return (
    <div>
      <PageHeader
        title="Products"
        actions={<Button onClick={openCreate}>+ Add product</Button>}
      />

      <DataTable
        loading={loading}
        data={products}
        emptyMessage="No products yet"
        columns={[
          { key: 'product_name', header: 'Name' },
          { key: 'category', header: 'Category', render: (row) => row.category?.category_name || '-' },
          { key: 'price', header: 'Price', render: (row) => formatLKR(row.price) },
          { key: 'stock_quantity', header: 'Stock', render: (row) => `${row.stock_quantity} ${row.unit ?? ''}` },
          {
            key: 'is_active',
            header: 'Status',
            render: (row) => (
              <button
                type="button"
                onClick={() => toggleActive(row)}
                className={`rounded-full px-2 py-0.5 text-xs font-medium ${row.is_active ? 'bg-green-100 text-green-800' : 'bg-stone-100 text-stone-600'}`}
              >
                {row.is_active ? 'Active' : 'Hidden'}
              </button>
            ),
          },
          {
            key: 'actions',
            header: '',
            render: (row) => (
              <div className="flex gap-3">
                <button className="text-primary-600 hover:underline" onClick={() => openEdit(row)}>Edit</button>
                <button className="text-red-600 hover:underline" onClick={() => handleDelete(row)}>Delete</button>
              </div>
            ),
          },
        ]}
      />

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={form.id ? 'Edit product' : 'New product'} size="lg">
        <form onSubmit={handleSave} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input label="Name" required value={form.product_name} onChange={(e) => setForm((f) => ({ ...f, product_name: e.target.value }))} />
          <Select label="Category" value={form.category_id} onChange={(e) => setForm((f) => ({ ...f, category_id: e.target.value }))}>
            <option value="">Uncategorized</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.category_name}</option>
            ))}
          </Select>
          <Input label="Price" type="number" step="0.01" min="0" required value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))} />
          <Input label="Unit (e.g. kg, pack)" required value={form.unit} onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))} />
          <Input label="Stock quantity" type="number" min="0" required value={form.stock_quantity} onChange={(e) => setForm((f) => ({ ...f, stock_quantity: e.target.value }))} />
          <div />
          <div className="sm:col-span-2">
            <TextArea label="Description" rows={3} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
          </div>
          <div className="sm:col-span-2">
            <ImageUploadField label="Product image" value={form.image_url} onChange={(url) => setForm((f) => ({ ...f, image_url: url }))} folder="products" />
          </div>
          <label className="flex items-center gap-2 text-sm sm:col-span-2">
            <input type="checkbox" checked={form.is_active} onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))} />
            Active (visible in storefront)
          </label>
          <div className="flex justify-end gap-2 sm:col-span-2">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
