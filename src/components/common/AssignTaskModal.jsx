import { useState } from 'react'
import toast from 'react-hot-toast'
import { supabase } from '../../lib/supabaseClient'
import Modal from './Modal'
import { Input, Select, TextArea, Button } from './FormControls'

export default function AssignTaskModal({ staffList, reservations, onClose, onAssigned }) {
  const [form, setForm] = useState({ staffId: '', reservationId: '', title: '', description: '' })
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.staffId || !form.title.trim()) {
      toast.error('Select a staff member and enter a title')
      return
    }
    setSaving(true)
    const { error } = await supabase.from('staff_tasks').insert({
      staff_id: form.staffId,
      reservation_id: form.reservationId || null,
      title: form.title,
      description: form.description || null,
      status: 'assigned',
    })
    setSaving(false)
    if (error) {
      console.error(error)
      toast.error('Could not assign task')
      return
    }
    toast.success('Task assigned')
    onAssigned?.()
    onClose()
  }

  return (
    <Modal open onClose={onClose} title="Assign task">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Select label="Staff member" required value={form.staffId} onChange={(e) => setForm((f) => ({ ...f, staffId: e.target.value }))}>
          <option value="">Select staff</option>
          {staffList.map((s) => (
            <option key={s.id} value={s.id}>{s.full_name || s.id.slice(0, 8)}</option>
          ))}
        </Select>
        {reservations && (
          <Select label="Related reservation (optional)" value={form.reservationId} onChange={(e) => setForm((f) => ({ ...f, reservationId: e.target.value }))}>
            <option value="">None</option>
            {reservations.map((r) => (
              <option key={r.id} value={r.id}>{r.package?.package_name || 'Reservation'} — {r.event_date ? new Date(r.event_date).toLocaleDateString() : ''}</option>
            ))}
          </Select>
        )}
        <Input label="Title" required value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
        <TextArea label="Description" rows={3} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={saving}>{saving ? 'Assigning...' : 'Assign'}</Button>
        </div>
      </form>
    </Modal>
  )
}
