import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../contexts/AuthContext'
import DataTable from '../../components/common/DataTable'
import Modal from '../../components/common/Modal'
import { Button, Input, Select, PageHeader, Card } from '../../components/common/FormControls'
import { LOW_STOCK_THRESHOLD } from '../../lib/constants'

// inventory_txn_type enum values and whether they add or remove stock
const TXN_TYPES = [
  { value: 'purchase', label: 'Purchase (stock in)', direction: 1 },
  { value: 'return', label: 'Customer return (stock in)', direction: 1 },
  { value: 'sale', label: 'Manual sale (stock out)', direction: -1 },
  { value: 'adjustment', label: 'Adjustment / loss (stock out)', direction: -1 },
]

export default function StaffInventory() {
  const { user } = useAuth()
  const [products, setProducts] = useState([])
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [adjustProduct, setAdjustProduct] = useState(null)
  const [form, setForm] = useState({ type: 'purchase', quantity: '', reference: '' })
  const [saving, setSaving] = useState(false)

  const load = async () => {
    setLoading(true)
    const [{ data: productData, error: productError }, { data: historyData, error: historyError }] = await Promise.all([
      supabase.from('products').select('*').order('product_name'),
      supabase
        .from('inventory_transactions')
        .select('*, product:products(product_name, unit)')
        .eq('created_by', user.id)
        .order('created_at', { ascending: false })
        .limit(20),
    ])
    if (productError) console.error('Failed to load products', productError)
    if (historyError) console.error('Failed to load inventory history', historyError)
    setProducts(productData ?? [])
    setHistory(historyData ?? [])
    setLoading(false)
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.id])

  const openAdjust = (product) => {
    setAdjustProduct(product)
    setForm({ type: 'purchase', quantity: '', reference: '' })
  }

  const handleAdjust = async (e) => {
    e.preventDefault()
    const qty = Number(form.quantity)
    if (!qty || qty <= 0) {
      toast.error('Enter a valid quantity')
      return
    }

    const txn = TXN_TYPES.find((t) => t.value === form.type)
    const nextStock = adjustProduct.stock_quantity + txn.direction * qty
    if (nextStock < 0) {
      toast.error('Stock cannot go below zero')
      return
    }

    setSaving(true)
    try {
      const { error: stockError } = await supabase
        .from('products')
        .update({ stock_quantity: nextStock })
        .eq('id', adjustProduct.id)
      if (stockError) throw stockError

      const { error: txError } = await supabase.from('inventory_transactions').insert({
        product_id: adjustProduct.id,
        transaction_type: form.type,
        quantity: qty,
        reference: form.reference || null,
        created_by: user.id,
      })
      if (txError) throw txError

      toast.success('Stock updated')
      setAdjustProduct(null)
      await load()
    } catch (err) {
      console.error(err)
      toast.error(err.message || 'Could not update stock')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <PageHeader
        title="Update Inventory"
        description="Adjust product stock levels — logged to inventory_transactions"
      />

      <DataTable
        loading={loading}
        data={products}
        emptyMessage="No products yet"
        columns={[
          { key: 'product_name', header: 'Product' },
          {
            key: 'stock_quantity',
            header: 'Stock',
            render: (row) => {
              const low = Number(row.stock_quantity ?? 0) <= LOW_STOCK_THRESHOLD
              return (
                <span className={low ? 'font-semibold text-red-600' : ''}>
                  {row.stock_quantity} {row.unit}
                  {low && ' (low)'}
                </span>
              )
            },
          },
          {
            key: 'actions',
            header: '',
            render: (row) => (
              <button className="text-primary-600 hover:underline" onClick={() => openAdjust(row)}>
                Update stock
              </button>
            ),
          },
        ]}
      />

      {history.length > 0 && (
        <Card className="mt-6">
          <h2 className="mb-3 font-semibold text-stone-900">Your recent stock updates</h2>
          <ul className="flex flex-col gap-2 text-sm text-stone-600">
            {history.map((entry) => (
              <li key={entry.id} className="flex flex-wrap items-baseline gap-x-2 border-b border-stone-100 pb-2 last:border-b-0 last:pb-0">
                <span className="font-medium text-stone-800">{entry.product?.product_name}</span>
                <span>
                  {entry.transaction_type}, qty {entry.quantity} {entry.product?.unit}
                </span>
                {entry.reference && <span className="text-stone-400">ref: {entry.reference}</span>}
                <span className="ml-auto text-xs text-stone-400">{new Date(entry.created_at).toLocaleString()}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {adjustProduct && (
        <Modal open onClose={() => setAdjustProduct(null)} title={`Update stock: ${adjustProduct.product_name}`}>
          <form onSubmit={handleAdjust} className="flex flex-col gap-4">
            <p className="text-sm text-stone-500">
              Current stock: {adjustProduct.stock_quantity} {adjustProduct.unit}
            </p>
            <Select label="Transaction type" value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}>
              {TXN_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </Select>
            <Input
              label="Quantity"
              type="number"
              min="1"
              required
              value={form.quantity}
              onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))}
            />
            <Input
              label="Reference (optional)"
              placeholder="e.g. supplier delivery, damaged pack"
              value={form.reference}
              onChange={(e) => setForm((f) => ({ ...f, reference: e.target.value }))}
            />
            <div className="flex justify-end gap-2">
              <Button type="button" variant="secondary" onClick={() => setAdjustProduct(null)}>Cancel</Button>
              <Button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save'}</Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
