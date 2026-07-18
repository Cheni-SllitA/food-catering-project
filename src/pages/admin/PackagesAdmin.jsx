import { useEffect, useState } from 'react'
import { formatLKR } from '../../lib/format'
import toast from 'react-hot-toast'
import { supabase } from '../../lib/supabaseClient'
import DataTable from '../../components/common/DataTable'
import Modal from '../../components/common/Modal'
import ImageUploadField from '../../components/common/ImageUploadField'
import { Button, Input, TextArea, PageHeader } from '../../components/common/FormControls'

const EMPTY_FORM = {
  id: null,
  package_name: '',
  description: '',
  price: '',
  minimum_people: '',
  maximum_people: '',
  image_url: '',
  is_active: true,
}

export default function PackagesAdmin() {
  const [packages, setPackages] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [itemsPackage, setItemsPackage] = useState(null)

  const load = async () => {
    setLoading(true)
    const { data, error } = await supabase.from('catering_packages').select('*').order('package_name')
    if (error) console.error('Failed to load packages', error)
    setPackages(data ?? [])
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  const openCreate = () => {
    setForm(EMPTY_FORM)
    setModalOpen(true)
  }

  const openEdit = (pkg) => {
    setForm({
      id: pkg.id,
      package_name: pkg.package_name ?? '',
      description: pkg.description ?? '',
      price: pkg.price ?? '',
      minimum_people: pkg.minimum_people ?? '',
      maximum_people: pkg.maximum_people ?? '',
      image_url: pkg.image_url ?? '',
      is_active: pkg.is_active ?? true,
    })
    setModalOpen(true)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    const payload = {
      package_name: form.package_name,
      description: form.description || null,
      price: Number(form.price),
      minimum_people: Number(form.minimum_people),
      maximum_people: Number(form.maximum_people),
      image_url: form.image_url || null,
      is_active: form.is_active,
    }
    try {
      if (form.id) {
        const { error } = await supabase.from('catering_packages').update(payload).eq('id', form.id)
        if (error) throw error
        toast.success('Package updated')
      } else {
        const { error } = await supabase.from('catering_packages').insert(payload)
        if (error) throw error
        toast.success('Package created')
      }
      setModalOpen(false)
      await load()
    } catch (err) {
      console.error(err)
      toast.error(err.message || 'Could not save package')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (pkg) => {
    if (!confirm(`Delete "${pkg.package_name}"?`)) return
    const { error } = await supabase.from('catering_packages').delete().eq('id', pkg.id)
    if (error) {
      toast.error('Could not delete package (it may have reservations)')
      return
    }
    toast.success('Package deleted')
    load()
  }

  return (
    <div>
      <PageHeader title="Catering Packages" actions={<Button onClick={openCreate}>+ Add package</Button>} />

      <DataTable
        loading={loading}
        data={packages}
        emptyMessage="No packages yet"
        columns={[
          { key: 'package_name', header: 'Name' },
          { key: 'price', header: 'Price', render: (row) => formatLKR(row.price) },
          { key: 'guests', header: 'Guests', render: (row) => `${row.minimum_people}-${row.maximum_people}` },
          {
            key: 'is_active',
            header: 'Status',
            render: (row) => (
              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${row.is_active ? 'bg-green-100 text-green-800' : 'bg-stone-100 text-stone-600'}`}>
                {row.is_active ? 'Active' : 'Hidden'}
              </span>
            ),
          },
          {
            key: 'actions',
            header: '',
            render: (row) => (
              <div className="flex gap-3">
                <button className="text-primary-600 hover:underline" onClick={() => setItemsPackage(row)}>Items</button>
                <button className="text-primary-600 hover:underline" onClick={() => openEdit(row)}>Edit</button>
                <button className="text-red-600 hover:underline" onClick={() => handleDelete(row)}>Delete</button>
              </div>
            ),
          },
        ]}
      />

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={form.id ? 'Edit package' : 'New package'} size="lg">
        <form onSubmit={handleSave} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Input label="Name" required value={form.package_name} onChange={(e) => setForm((f) => ({ ...f, package_name: e.target.value }))} />
          </div>
          <Input label="Price" type="number" step="0.01" min="0" required value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))} />
          <div />
          <Input label="Min guests" type="number" min="1" required value={form.minimum_people} onChange={(e) => setForm((f) => ({ ...f, minimum_people: e.target.value }))} />
          <Input label="Max guests" type="number" min="1" required value={form.maximum_people} onChange={(e) => setForm((f) => ({ ...f, maximum_people: e.target.value }))} />
          <div className="sm:col-span-2">
            <TextArea label="Description" rows={3} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
          </div>
          <div className="sm:col-span-2">
            <ImageUploadField label="Package image" value={form.image_url} onChange={(url) => setForm((f) => ({ ...f, image_url: url }))} folder="packages" />
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

      {itemsPackage && (
        <PackageItemsModal pkg={itemsPackage} onClose={() => setItemsPackage(null)} />
      )}
    </div>
  )
}

function PackageItemsModal({ pkg, onClose }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [itemName, setItemName] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [notes, setNotes] = useState('')
  const [adding, setAdding] = useState(false)

  const load = async () => {
    setLoading(true)
    const { data, error } = await supabase.from('package_items').select('*').eq('package_id', pkg.id)
    if (error) console.error('Failed to load package items', error)
    setItems(data ?? [])
    setLoading(false)
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pkg.id])

  const handleAdd = async (e) => {
    e.preventDefault()
    if (!itemName.trim()) return
    setAdding(true)
    const { error } = await supabase.from('package_items').insert({
      package_id: pkg.id,
      item_name: itemName,
      quantity: Number(quantity) || null,
      notes: notes || null,
    })
    if (error) {
      toast.error('Could not add item')
    } else {
      setItemName('')
      setQuantity(1)
      setNotes('')
      await load()
    }
    setAdding(false)
  }

  const handleRemove = async (itemId) => {
    const { error } = await supabase.from('package_items').delete().eq('id', itemId)
    if (error) {
      toast.error('Could not remove item')
      return
    }
    load()
  }

  return (
    <Modal open onClose={onClose} title={`Items in ${pkg.package_name}`}>
      {loading ? (
        <p className="text-sm text-stone-500">Loading...</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-stone-500">No items added yet</p>
      ) : (
        <ul className="divide-y divide-stone-100">
          {items.map((item) => (
            <li key={item.id} className="flex items-center justify-between py-2 text-sm">
              <span>
                {item.item_name}
                {item.quantity != null && <> &times; {item.quantity}</>}
                {item.notes && <span className="text-stone-400"> — {item.notes}</span>}
              </span>
              <button className="text-red-600 hover:underline" onClick={() => handleRemove(item.id)}>Remove</button>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={handleAdd} className="mt-4 flex flex-col gap-3 border-t border-stone-100 pt-4">
        <div className="flex items-end gap-2">
          <Input label="Item name" value={itemName} onChange={(e) => setItemName(e.target.value)} className="flex-1" />
          <Input label="Qty" type="number" min="1" value={quantity} onChange={(e) => setQuantity(e.target.value)} className="w-20" />
        </div>
        <div className="flex items-end gap-2">
          <Input label="Notes (optional)" value={notes} onChange={(e) => setNotes(e.target.value)} className="flex-1" />
          <Button type="submit" disabled={adding || !itemName.trim()}>Add</Button>
        </div>
      </form>
    </Modal>
  )
}
