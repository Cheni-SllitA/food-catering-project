import { useEffect, useState } from 'react'
import { formatLKR } from '../../lib/format'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'
import Loader from '../../components/common/Loader'
import EmptyState from '../../components/common/EmptyState'
import StatusBadge from '../../components/common/StatusBadge'

export default function ReservationDetail() {
  const { id } = useParams()
  const [reservation, setReservation] = useState(null)
  const [booking, setBooking] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    async function load() {
      setLoading(true)
      const { data: reservationData, error: reservationError } = await supabase
        .from('catering_reservations')
        .select('*, package:catering_packages(package_name, price)')
        .eq('id', id)
        .single()
      if (!mounted) return
      if (reservationError) console.error('Failed to load reservation', reservationError)
      setReservation(reservationData ?? null)

      const { data: bookingData } = await supabase
        .from('event_bookings')
        .select('*')
        .eq('reservation_id', id)
        .maybeSingle()
      if (mounted) setBooking(bookingData ?? null)
      setLoading(false)
    }
    load()
    return () => {
      mounted = false
    }
  }, [id])

  if (loading) return <Loader />
  if (!reservation) return <EmptyState title="Reservation not found" action={<Link to="/my-reservations" className="text-primary-600">Back to my reservations</Link>} />

  return (
    <div className="mx-auto max-w-2xl">
      <Link to="/my-reservations" className="text-sm text-primary-600 hover:underline">&larr; Back to my reservations</Link>
      <div className="mt-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-stone-900">{reservation.package?.package_name}</h1>
        <StatusBadge status={reservation.status} />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 rounded-lg border border-stone-200 bg-white p-6 shadow-sm sm:grid-cols-2">
        <Field label="Event date" value={reservation.event_date ? new Date(reservation.event_date).toLocaleDateString() : '-'} />
        <Field label="Event time" value={reservation.event_time || '-'} />
        <Field label="Location" value={reservation.event_location || '-'} />
        <Field label="Guests" value={reservation.number_of_guests} />
        <Field label="Total" value={formatLKR(reservation.total_amount)} />
        {booking?.event_type && <Field label="Event type" value={booking.event_type} />}
        {reservation.special_requests && (
          <div className="sm:col-span-2">
            <Field label="Special requests" value={reservation.special_requests} />
          </div>
        )}
      </div>
    </div>
  )
}

function Field({ label, value }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-stone-400">{label}</p>
      <p className="mt-1 text-sm text-stone-800">{value}</p>
    </div>
  )
}
