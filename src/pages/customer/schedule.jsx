import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../contexts/AuthContext'
import Loader from '../../components/common/Loader'
import { Input, TextArea, Select, Button } from '../../components/common/FormControls'

const STYLE_OPTIONS = ['Elegant Dinner', 'Garden Party', 'Modern Party', 'Luxury Buffet']

const formatDateKey = (date) => {
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  return `${year}-${month}-${day}`
}

const formatDateLabel = (dateKey) => {
  const [year, month, day] = dateKey.split('-').map(Number)
  return new Date(year, month - 1, day).toLocaleDateString('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function Schedule() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const today = new Date()

  const [bookedDates, setBookedDates] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState('')
  const [feedback, setFeedback] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({
    eventName: '',
    style: STYLE_OPTIONS[0],
    guestCount: '',
    notes: '',
  })

  const load = async () => {
    setLoading(true)
    const { data, error } = await supabase.rpc('get_booked_event_dates')
    if (error) {
      console.error('Failed to load booked dates', error)
      toast.error('Could not load the calendar')
    }
    setBookedDates(data ?? [])
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  const monthDate = new Date(today.getFullYear(), today.getMonth(), 1)
  const monthLabel = monthDate.toLocaleDateString('en', { month: 'long', year: 'numeric' })

  const calendarDays = useMemo(() => {
    const year = monthDate.getFullYear()
    const month = monthDate.getMonth()
    const firstDay = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const prevMonthDays = new Date(year, month, 0).getDate()

    const cells = []
    for (let i = firstDay - 1; i >= 0; i -= 1) {
      const date = new Date(year, month - 1, prevMonthDays - i)
      cells.push({ date, key: formatDateKey(date), inMonth: false })
    }
    for (let day = 1; day <= daysInMonth; day += 1) {
      const date = new Date(year, month, day)
      cells.push({ date, key: formatDateKey(date), inMonth: true })
    }
    while (cells.length % 7 !== 0) {
      const lastDate = cells[cells.length - 1].date
      const nextDate = new Date(lastDate.getFullYear(), lastDate.getMonth(), lastDate.getDate() + 1)
      cells.push({ date: nextDate, key: formatDateKey(nextDate), inMonth: false })
    }
    return cells
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const bookedSet = useMemo(
    () => new Set(bookedDates.map((d) => d.event_date)),
    [bookedDates]
  )
  const sortedBookings = useMemo(
    () => [...bookedDates].sort((a, b) => a.event_date.localeCompare(b.event_date)),
    [bookedDates]
  )

  const handleSelectDay = (dateKey) => {
    const [year, month, day] = dateKey.split('-').map(Number)
    const selected = new Date(year, month - 1, day)
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate())

    if (selected < startOfToday) return
    if (bookedSet.has(dateKey)) {
      setFeedback('That day is already booked. Please choose another date.')
      return
    }
    setSelectedDate(dateKey)
    setFeedback('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!user) {
      navigate('/login', { state: { from: { pathname: '/schedule' } } })
      return
    }
    if (!selectedDate) {
      setFeedback('Choose a date first to place a reservation.')
      return
    }
    if (!form.eventName.trim() || !form.guestCount) {
      setFeedback('Please add an event name and guest count.')
      return
    }

    setSubmitting(true)
    try {
      const { data: reservation, error: reservationError } = await supabase
        .from('catering_reservations')
        .insert({
          customer_id: user.id,
          event_date: selectedDate,
          number_of_guests: Number(form.guestCount),
          special_requests: [form.eventName.trim(), form.notes.trim()].filter(Boolean).join(' — '),
          status: 'pending',
        })
        .select()
        .single()
      if (reservationError) throw reservationError

      const { error: bookingError } = await supabase.from('event_bookings').insert({
        reservation_id: reservation.id,
        event_type: form.style,
        event_start: `${selectedDate}T00:00:00`,
      })
      if (bookingError) throw bookingError

      const message = `Reservation confirmed for ${formatDateLabel(selectedDate)}.`
      toast.success(message)
      setFeedback(message)
      setForm({ eventName: '', style: STYLE_OPTIONS[0], guestCount: '', notes: '' })
      setSelectedDate('')
      await load()
    } catch (err) {
      console.error(err)
      const message = err.message || 'Could not submit reservation'
      toast.error(message)
      setFeedback(message)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <Loader />

  return (
    <div>
      {/* Hero */}
      <div className="mb-8 grid grid-cols-1 gap-6 rounded-2xl border border-primary-200 bg-gradient-to-r from-primary-50 via-amber-50 to-rose-50 p-8 lg:grid-cols-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-primary-700">Catering reservation system</p>
          <h1 className="mt-2 text-3xl font-bold text-stone-900">Book a stunning event day in minutes.</h1>
          <p className="mt-3 text-stone-600">
            View busy dates, choose an open day, and secure a catering reservation with a simple form.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {['Live calendar', 'Instant confirmation', 'Elegant styling'].map((badge) => (
              <span key={badge} className="rounded-full border border-primary-300 bg-white px-3 py-1 text-xs font-medium text-primary-700">
                {badge}
              </span>
            ))}
          </div>
        </div>
        <div className="rounded-xl border border-stone-200 bg-white p-5">
          <h3 className="font-semibold text-stone-900">What this feature offers</h3>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-stone-600">
            <li>See every booked date at a glance</li>
            <li>Pick a future day from the monthly calendar</li>
            <li>Submit event details for a quick booking</li>
          </ul>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Calendar */}
        <div className="rounded-xl border border-stone-200 bg-white p-6 lg:col-span-2">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">Reserve your date</p>
              <h2 className="text-xl font-bold text-stone-900">{monthLabel}</h2>
            </div>
            <div className="flex gap-4 text-sm text-stone-600">
              <span className="flex items-center gap-1.5">
                <i className="h-2.5 w-2.5 rounded-full bg-red-400" /> Booked
              </span>
              <span className="flex items-center gap-1.5">
                <i className="h-2.5 w-2.5 rounded-full bg-emerald-400" /> Open
              </span>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-stone-500">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((label) => (
              <span key={label} className="py-1">{label}</span>
            ))}
          </div>

          <div className="mt-1 grid grid-cols-7 gap-1">
            {calendarDays.map((day) => {
              const isBooked = bookedSet.has(day.key)
              const isPast = day.date < new Date(today.getFullYear(), today.getMonth(), today.getDate())
              const isSelected = selectedDate === day.key
              const disabled = !day.inMonth || isBooked || isPast

              return (
                <button
                  key={day.key}
                  type="button"
                  onClick={() => handleSelectDay(day.key)}
                  disabled={disabled}
                  className={[
                    'aspect-square rounded-lg text-sm font-medium transition',
                    !day.inMonth && 'text-stone-300',
                    day.inMonth && !isBooked && !isPast && !isSelected && 'text-stone-700 hover:bg-primary-50 hover:text-primary-700',
                    isPast && day.inMonth && 'text-stone-300 line-through',
                    isBooked && day.inMonth && 'bg-red-50 text-red-400',
                    isSelected && 'bg-primary-600 text-white',
                  ].filter(Boolean).join(' ')}
                >
                  {day.date.getDate()}
                </button>
              )
            })}
          </div>
        </div>

        {/* Sidebar */}
        <div className="flex flex-col gap-6">
          <div className="rounded-xl border border-stone-200 bg-white p-6">
            <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">Booking form</p>
            <h3 className="mt-1 text-lg font-bold text-stone-900">
              {selectedDate ? `Reserve ${formatDateLabel(selectedDate)}` : 'Choose an open day'}
            </h3>
            {feedback && <p className="mt-2 text-sm text-primary-700">{feedback}</p>}

            <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3">
              <Input
                label="Event name"
                placeholder="Birthday brunch"
                value={form.eventName}
                onChange={(e) => setForm({ ...form, eventName: e.target.value })}
              />
              <Select
                label="Style"
                value={form.style}
                onChange={(e) => setForm({ ...form, style: e.target.value })}
              >
                {STYLE_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </Select>
              <Input
                label="Guest count"
                type="number"
                min="1"
                placeholder="40"
                value={form.guestCount}
                onChange={(e) => setForm({ ...form, guestCount: e.target.value })}
              />
              <TextArea
                label="Notes"
                rows={3}
                placeholder="Tell us about your event"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
              <Button type="submit" disabled={submitting} className="w-full">
                {submitting ? 'Placing reservation...' : 'Place reservation'}
              </Button>
            </form>
          </div>

          <div className="rounded-xl border border-stone-200 bg-white p-6">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-stone-500">Booked dates</p>
            {sortedBookings.length === 0 ? (
              <p className="text-sm text-stone-500">No dates booked yet — every day is open.</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {sortedBookings.map((item) => (
                  <li key={`${item.event_date}-${item.event_type}`} className="flex items-baseline justify-between text-sm">
                    <strong className="text-stone-800">{formatDateLabel(item.event_date)}</strong>
                    <span className="text-stone-500">{item.event_type || 'Reserved'}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Schedule
