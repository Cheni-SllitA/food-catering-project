import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { supabase } from '../../lib/supabaseClient'
import DataTable from '../../components/common/DataTable'
import StatusBadge from '../../components/common/StatusBadge'
import Modal from '../../components/common/Modal'
import { Input, Button, PageHeader } from '../../components/common/FormControls'

// Converts a timestamptz to the value format datetime-local inputs expect
function toLocalInputValue(ts) {
  if (!ts) return ''
  const d = new Date(ts)
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export default function EventBookingsManager() {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [editBooking, setEditBooking] = useState(null)
  const [form, setForm] = useState({ event_type: '', event_start: '', event_end: '', notes: '' })
  const [saving, setSaving] = useState(false)

  const load = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('event_bookings')
      .select('*, reservation:catering_reservations(event_date, event_location, number_of_guests, status, customer:profiles(full_name))')
      .order('id', { ascending: false })
    if (error) console.error('Failed to load event bookings', error)
    setBookings(data ?? [])
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  const openEdit = (booking) => {
    setEditBooking(booking)
    setForm({
      event_type: booking.event_type ?? '',
      event_start: toLocalInputValue(booking.event_start),
      event_end: toLocalInputValue(booking.event_end),
      notes: booking.notes ?? '',
    })
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    const { error } = await supabase
      .from('event_bookings')
      .update({
        event_type: form.event_type || null,
        event_start: form.event_start ? new Date(form.event_start).toISOString() : null,
        event_end: form.event_end ? new Date(form.event_end).toISOString() : null,
        notes: form.notes || null,
      })
      .eq('id', editBooking.id)
    setSaving(false)
    if (error) {
      toast.error('Could not save booking')
      return
    }
    toast.success('Booking updated')
    setEditBooking(null)
    load()
  }

  return (
    <div>
      <PageHeader title="Event Bookings" description="Event details and logistics for reservations" />
      <DataTable
        loading={loading}
        data={bookings}
        emptyMessage="No event bookings yet"
        columns={[
          { key: 'customer', header: 'Customer', render: (row) => row.reservation?.customer?.full_name || '-' },
          { key: 'event_date', header: 'Event date', render: (row) => row.reservation?.event_date ? new Date(row.reservation.event_date).toLocaleDateString() : '-' },
          { key: 'event_type', header: 'Type', render: (row) => row.event_type || '-' },
          { key: 'event_location', header: 'Location', render: (row) => row.reservation?.event_location || '-' },
          { key: 'status', header: 'Status', render: (row) => <StatusBadge status={row.reservation?.status} /> },
          {
            key: 'actions',
            header: '',
            render: (row) => <button className="text-primary-600 hover:underline" onClick={() => openEdit(row)}>Edit</button>,
          },
        ]}
      />

      {editBooking && (
        <Modal open onClose={() => setEditBooking(null)} title="Edit event booking">
          <form onSubmit={handleSave} className="flex flex-col gap-4">
            <Input label="Event type" value={form.event_type} onChange={(e) => setForm((f) => ({ ...f, event_type: e.target.value }))} />
            <Input label="Event start" type="datetime-local" value={form.event_start} onChange={(e) => setForm((f) => ({ ...f, event_start: e.target.value }))} />
            <Input label="Event end" type="datetime-local" value={form.event_end} onChange={(e) => setForm((f) => ({ ...f, event_end: e.target.value }))} />
            <Input label="Notes" value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
            <div className="flex justify-end gap-2">
              <Button type="button" variant="secondary" onClick={() => setEditBooking(null)}>Cancel</Button>
              <Button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save'}</Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
