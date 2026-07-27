import { useEffect, useState } from 'react'
import { formatLKR } from '../../lib/format'
import { useNavigate, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../contexts/AuthContext'
import { Input, TextArea, Button, PillToggle } from '../../components/common/FormControls'
import Loader from '../../components/common/Loader'
import EmptyState from '../../components/common/EmptyState'

const EVENT_TYPES = [
  { value: 'Wedding', label: 'Wedding' },
  { value: 'Corporate', label: 'Corporate' },
  { value: 'Birthday', label: 'Birthday' },
  { value: 'Other', label: 'Other' },
]

export default function ReservationForm() {
  const { packageId } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [pkg, setPkg] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({
    eventType: 'Wedding',
    eventDate: '',
    eventTime: '',
    location: '',
    guestCount: '',
    specialRequests: '',
  })

  useEffect(() => {
    let mounted = true
    async function load() {
      setLoading(true)
      const { data, error } = await supabase.from('catering_packages').select('*').eq('id', packageId).single()
      if (!mounted) return
      if (error) console.error('Failed to load package', error)
      setPkg(data ?? null)
      setLoading(false)
    }
    load()
    return () => {
      mounted = false
    }
  }, [packageId])

  if (loading) return <Loader />
  if (!pkg) return <EmptyState title="Package not found" />

  const guestCountNum = Number(form.guestCount)
  const guestOutOfRange =
    form.guestCount !== '' && (guestCountNum < pkg.minimum_people || guestCountNum > pkg.maximum_people)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (guestOutOfRange) {
      toast.error(`Guest count must be between ${pkg.minimum_people} and ${pkg.maximum_people}`)
      return
    }
    setSubmitting(true)
    try {
      const { data: reservation, error: reservationError } = await supabase
        .from('catering_reservations')
        .insert({
          customer_id: user.id,
          package_id: pkg.id,
          event_date: form.eventDate,
          event_time: form.eventTime,
          event_location: form.location,
          number_of_guests: guestCountNum,
          special_requests: form.specialRequests || null,
          status: 'pending',
          total_amount: pkg.price,
        })
        .select()
        .single()
      if (reservationError) throw reservationError

      const { error: bookingError } = await supabase.from('event_bookings').insert({
        reservation_id: reservation.id,
        event_type: form.eventType,
        event_start: form.eventDate && form.eventTime ? `${form.eventDate}T${form.eventTime}` : null,
      })
      if (bookingError) throw bookingError

      toast.success('Reservation submitted!')
      navigate(`/my-reservations/${reservation.id}`)
    } catch (err) {
      console.error(err)
      toast.error(err.message || 'Could not submit reservation')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-xl">
      <div className="overflow-hidden rounded-2xl border border-stone-300 bg-white">
        {/* Header band */}
        <div className="border-b border-primary-200 bg-gradient-to-r from-primary-50 via-amber-50 to-rose-50 px-8 py-8 text-center">
          <h1 className="text-2xl font-bold text-stone-900">Book an Event</h1>
          <p className="mt-1 text-sm text-stone-500">Tell us the details and we'll bring the feast to you.</p>
          <p className="mt-3 inline-block rounded-full border border-primary-300 bg-white px-4 py-1 text-xs font-medium text-primary-700">
            {pkg.package_name} · {formatLKR(pkg.price)} · {pkg.minimum_people}-{pkg.maximum_people} guests
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5 px-8 py-7">
          <div>
            <p className="mb-2 text-sm font-medium text-stone-700">Event Type</p>
            <PillToggle
              options={EVENT_TYPES}
              value={form.eventType}
              onChange={(v) => setForm((f) => ({ ...f, eventType: v }))}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Date"
              type="date"
              required
              value={form.eventDate}
              onChange={(e) => setForm((f) => ({ ...f, eventDate: e.target.value }))}
            />
            <Input
              label="Time"
              type="time"
              required
              value={form.eventTime}
              onChange={(e) => setForm((f) => ({ ...f, eventTime: e.target.value }))}
            />
          </div>

          <Input
            label={`Guest Count (${pkg.minimum_people}-${pkg.maximum_people})`}
            type="number"
            required
            min={pkg.minimum_people}
            max={pkg.maximum_people}
            value={form.guestCount}
            error={guestOutOfRange ? `Must be between ${pkg.minimum_people} and ${pkg.maximum_people}` : undefined}
            onChange={(e) => setForm((f) => ({ ...f, guestCount: e.target.value }))}
          />

          <Input
            label="Event Location"
            required
            value={form.location}
            onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
          />

          <TextArea
            label="Special requests (optional)"
            rows={3}
            value={form.specialRequests}
            onChange={(e) => setForm((f) => ({ ...f, specialRequests: e.target.value }))}
          />

          <Button type="submit" disabled={submitting} className="w-full">
            {submitting ? 'Submitting...' : 'Request Quote'}
          </Button>
        </form>
      </div>
    </div>
  )
}
