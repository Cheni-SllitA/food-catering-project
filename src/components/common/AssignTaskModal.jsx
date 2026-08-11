import { useState } from 'react'
import toast from 'react-hot-toast'
import { supabase } from '../../lib/supabaseClient'
import Modal from './Modal'
import { Input, Select, TextArea, Button } from './FormControls'
import { TASK_STATUS } from '../../lib/constants'

// datetime-local expects "YYYY-MM-DDTHH:mm" in local time, Postgres gives back
// an ISO string in UTC — convert for the input, and back again on submit.
function toLocalInputValue(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export default function AssignTaskModal({ staffList, reservations, task, onClose, onAssigned }) {
  const isEdit = !!task
  const [form, setForm] = useState({
    staffId: task?.staff_id ?? '',
    reservationId: task?.reservation_id ?? '',
    title: task?.title ?? '',
    description: task?.description ?? '',
    date: toLocalInputValue(task?.assigned_date) || toLocalInputValue(new Date().toISOString()),
    status: task?.status ?? 'assigned',
  })
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.staffId || !form.title.trim()) {
      toast.error('Select a staff member and enter a title')
      return
    }
    setSaving(true)

    const payload = {
      staff_id: form.staffId,
      reservation_id: form.reservationId || null,
      title: form.title,
      description: form.description || null,
      status: form.status,
      assigned_date: form.date ? new Date(form.date).toISOString() : new Date().toISOString(),
    }
    // Only stamp completed_date the moment a task newly becomes completed —
    // don't overwrite it on every unrelated edit, and clear it if reopened.
    if (form.status === 'completed' && task?.status !== 'completed') {
      payload.completed_date = new Date().toISOString()
    } else if (form.status !== 'completed') {
      payload.completed_date = null
    }

    const { error } = isEdit
      ? await supabase.from('staff_tasks').update(payload).eq('id', task.id)
      : await supabase.from('staff_tasks').insert(payload)

    setSaving(false)
    if (error) {
      console.error(error)
      toast.error(isEdit ? 'Could not update task' : 'Could not assign task')
      return
    }
    toast.success(isEdit ? 'Task updated' : 'Task assigned')
    onAssigned?.()
    onClose()
  }

  return (
    <Modal open onClose={onClose} title={isEdit ? 'Edit task' : 'Assign task'}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Select label="Assign to" required value={form.staffId} onChange={(e) => setForm((f) => ({ ...f, staffId: e.target.value }))}>
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
        <Input
          label="Date"
          type="datetime-local"
          value={form.date}
          onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
        />
        {isEdit && (
          <Select label="Status" value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}>
            {Object.values(TASK_STATUS).map((s) => (
              <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
            ))}
          </Select>
        )}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={saving}>
            {saving ? (isEdit ? 'Saving...' : 'Assigning...') : (isEdit ? 'Save changes' : 'Assign')}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
