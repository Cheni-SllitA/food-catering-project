import { useMemo, useState } from 'react'
import './App.css'

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

const buildInitialReservations = () => {
  const today = new Date()
  return [
    {
      id: 1,
      date: formatDateKey(new Date(today.getFullYear(), today.getMonth(), 6)),
      eventName: 'Garden Brunch',
      style: 'Garden Party',
      guestCount: 48,
      notes: 'Fresh florals and pastel accents.',
    },
    {
      id: 2,
      date: formatDateKey(new Date(today.getFullYear(), today.getMonth(), 14)),
      eventName: 'Corporate Dinner',
      style: 'Elegant Dinner',
      guestCount: 80,
      notes: 'Black and gold table styling.',
    },
    {
      id: 3,
      date: formatDateKey(new Date(today.getFullYear(), today.getMonth(), 24)),
      eventName: 'Birthday Celebration',
      style: 'Modern Party',
      guestCount: 30,
      notes: 'Sweet table and signature mocktails.',
    },
  ]
}

function App() {
  const today = new Date()
  const [reservations, setReservations] = useState(buildInitialReservations)
  const [selectedDate, setSelectedDate] = useState('')
  const [feedback, setFeedback] = useState('')
  const [form, setForm] = useState({
    eventName: '',
    style: 'Elegant Dinner',
    guestCount: '',
    notes: '',
  })

  const monthDate = new Date(today.getFullYear(), today.getMonth(), 1)
  const monthLabel = monthDate.toLocaleDateString('en', {
    month: 'long',
    year: 'numeric',
  })
  const todayKey = formatDateKey(today)

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
  }, [monthDate])

  const bookedSet = new Set(reservations.map((item) => item.date))
  const sortedReservations = [...reservations].sort((a, b) => a.date.localeCompare(b.date))

  const handleSelectDay = (dateKey) => {
    const [year, month, day] = dateKey.split('-').map(Number)
    const selected = new Date(year, month - 1, day)
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate())

    if (selected < startOfToday) {
      return
    }

    if (bookedSet.has(dateKey)) {
      setFeedback('That day is already booked. Please choose another date.')
      return
    }

    setSelectedDate(dateKey)
    setFeedback('')
  }

  const handleSubmit = (event) => {
    event.preventDefault()

    if (!selectedDate) {
      setFeedback('Choose a date first to place a reservation.')
      return
    }

    if (!form.eventName.trim() || !form.guestCount) {
      setFeedback('Please add an event name and guest count.')
      return
    }

    const newReservation = {
      id: Date.now(),
      date: selectedDate,
      eventName: form.eventName.trim(),
      style: form.style,
      guestCount: Number(form.guestCount),
      notes: form.notes.trim(),
    }

    setReservations((current) => [...current, newReservation].sort((a, b) => a.date.localeCompare(b.date)))
    setFeedback(`Reservation confirmed for ${formatDateLabel(selectedDate)}.`)
    setForm({ eventName: '', style: 'Elegant Dinner', guestCount: '', notes: '' })
    setSelectedDate('')
  }

  return (
    <div className="app-shell">
      <header className="hero-card">
        <div className="hero-copy">
          <p className="eyebrow">Catering reservation system</p>
          <h1>Book a stunning event day in minutes.</h1>
          <p className="hero-text">
            Guests can view busy dates, choose an open day, and secure a catering reservation with a simple form.
          </p>
          <div className="hero-badges">
            <span>Live calendar</span>
            <span>Instant confirmation</span>
            <span>Elegant styling</span>
          </div>
        </div>

        <div className="hero-panel">
          <h3>What this feature offers</h3>
          <ul>
            <li>See every booked date at a glance</li>
            <li>Pick a future day from the monthly calendar</li>
            <li>Submit event details for a quick booking</li>
          </ul>
        </div>
      </header>

      <main className="content-grid">
        <section className="calendar-card">
          <div className="calendar-header">
            <div>
              <p className="section-label">Reserve your date</p>
              <h2>{monthLabel}</h2>
            </div>
            <div className="legend">
              <span><i className="dot booked-dot"></i>Booked</span>
              <span><i className="dot open-dot"></i>Open</span>
            </div>
          </div>

          <div className="weekday-row">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((label) => (
              <span key={label}>{label}</span>
            ))}
          </div>

          <div className="calendar-grid">
            {calendarDays.map((day) => {
              const isBooked = bookedSet.has(day.key)
              const isPast = day.date < new Date(today.getFullYear(), today.getMonth(), today.getDate())
              const isSelected = selectedDate === day.key

              return (
                <button
                  key={day.key}
                  type="button"
                  className={`day-cell ${day.inMonth ? 'in-month' : 'out-month'} ${isBooked ? 'booked' : ''} ${isPast ? 'past' : ''} ${isSelected ? 'selected' : ''}`}
                  onClick={() => handleSelectDay(day.key)}
                  disabled={!day.inMonth || isBooked || isPast}
                >
                  <span>{day.date.getDate()}</span>
                </button>
              )
            })}
          </div>
        </section>

        <aside className="sidebar">
          <section className="booking-card">
            <p className="section-label">Booking form</p>
            <h3>{selectedDate ? `Reserve ${formatDateLabel(selectedDate)}` : 'Choose an open day'}</h3>
            {feedback ? <p className="feedback">{feedback}</p> : null}

            <form onSubmit={handleSubmit}>
              <label>
                Event name
                <input
                  value={form.eventName}
                  onChange={(event) => setForm({ ...form, eventName: event.target.value })}
                  placeholder="Birthday brunch"
                />
              </label>

              <label>
                Style
                <select
                  value={form.style}
                  onChange={(event) => setForm({ ...form, style: event.target.value })}
                >
                  <option>Elegant Dinner</option>
                  <option>Garden Party</option>
                  <option>Modern Party</option>
                  <option>Luxury Buffet</option>
                </select>
              </label>

              <label>
                Guest count
                <input
                  type="number"
                  min="1"
                  value={form.guestCount}
                  onChange={(event) => setForm({ ...form, guestCount: event.target.value })}
                  placeholder="40"
                />
              </label>

              <label>
                Notes
                <textarea
                  rows="3"
                  value={form.notes}
                  onChange={(event) => setForm({ ...form, notes: event.target.value })}
                  placeholder="Tell us about your event"
                />
              </label>

              <button type="submit">Place reservation</button>
            </form>
          </section>

          <section className="upcoming-card">
            <p className="section-label">Booked dates</p>
            <ul>
              {sortedReservations.map((item) => (
                <li key={item.id}>
                  <strong>{formatDateLabel(item.date)}</strong>
                  <span>{item.eventName}</span>
                </li>
              ))}
            </ul>
          </section>
        </aside>
      </main>
    </div>
  )
}

export default App
