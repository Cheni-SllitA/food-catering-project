import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { supabase } from '../../lib/supabaseClient'
import DataTable from '../../components/common/DataTable'
import Modal from '../../components/common/Modal'
import { Button, Input, TextArea, PageHeader } from '../../components/common/FormControls'

const EMPTY_FORM = { id: null, category_name: '', description: '' }

export default function CategoriesAdmin() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  const load = async () => {
    setLoading(true)
    const { data, error } = await supabase.from('food_categories').select('*').order('category_name')
    if (error) console.error('Failed to load categories', error)
    setCategories(data ?? [])
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  const openCreate = () => {
    setForm(EMPTY_FORM)
    setModalOpen(true)
  }

  const openEdit = (category) => {
    setForm({ id: category.id, category_name: category.category_name ?? '', description: category.description ?? '' })
    setModalOpen(true)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    const payload = { category_name: form.category_name, description: form.description || null }
    try {
      if (form.id) {
        const { error } = await supabase.from('food_categories').update(payload).eq('id', form.id)
        if (error) throw error
        toast.success('Category updated')
      } else {
        const { error } = await supabase.from('food_categories').insert(payload)
        if (error) throw error
        toast.success('Category created')
      }
      setModalOpen(false)
      await load()
    } catch (err) {
      console.error(err)
      toast.error(err.message || 'Could not save category')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (category) => {
    if (!confirm(`Delete "${category.category_name}"?`)) return
    const { error } = await supabase.from('food_categories').delete().eq('id', category.id)
    if (error) {
      toast.error('Could not delete category (products may still reference it)')
      return
    }
    toast.success('Category deleted')
    load()
  }

  return (
    <div>
      <PageHeader title="Categories" actions={<Button onClick={openCreate}>+ Add category</Button>} />
      <DataTable
        loading={loading}
        data={categories}
        emptyMessage="No categories yet"
        columns={[
          { key: 'category_name', header: 'Name' },
          { key: 'description', header: 'Description' },
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

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={form.id ? 'Edit category' : 'New category'}>
        <form onSubmit={handleSave} className="flex flex-col gap-4">
          <Input label="Name" required value={form.category_name} onChange={(e) => setForm((f) => ({ ...f, category_name: e.target.value }))} />
          <TextArea label="Description" rows={3} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
