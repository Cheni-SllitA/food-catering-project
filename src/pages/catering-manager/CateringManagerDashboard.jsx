import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'
import Loader from '../../components/common/Loader'
import { PageHeader } from '../../components/common/FormControls'

export default function CateringManagerDashboard() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ pendingReservations: 0, upcomingEvents: 0, activePackages: 0 })

  useEffect(() => {
    let mounted = true
    async function load() {
      setLoading(true)
      const [reservationsRes, packagesRes] = await Promise.all([
        supabase.from('catering_reservations').select('id, status, event_date'),
        supabase.from('catering_packages').select('id').eq('is_active', true),
      ])
      if (!mounted) return
      const reservations = reservationsRes.data ?? []
      setStats({
        pendingReservations: reservations.filter((r) => r.status === 'pending').length,
        upcomingEvents: reservations.filter((r) => r.event_date && new Date(r.event_date) >= new Date()).length,
        activePackages: (packagesRes.data ?? []).length,
      })
      setLoading(false)
    }
    load()
    return () => {
      mounted = false
    }
  }, [])

  if (loading) return <Loader />

  return (
    <div>
      <PageHeader title="Catering Manager Dashboard" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
          <p className="text-sm text-amber-700 opacity-80">Pending reservations</p>
          <p className="mt-1 text-2xl font-bold text-amber-700">{stats.pendingReservations}</p>
          <Link to="/catering-manager/reservations" className="mt-2 inline-block text-sm text-amber-800 underline">Review</Link>
        </div>
        <div className="rounded-xl border border-sky-200 bg-sky-50 p-5">
          <p className="text-sm text-sky-700 opacity-80">Upcoming events</p>
          <p className="mt-1 text-2xl font-bold text-sky-700">{stats.upcomingEvents}</p>
          <Link to="/catering-manager/event-bookings" className="mt-2 inline-block text-sm text-sky-800 underline">View bookings</Link>
        </div>
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5">
          <p className="text-sm text-emerald-700 opacity-80">Active packages</p>
          <p className="mt-1 text-2xl font-bold text-emerald-700">{stats.activePackages}</p>
          <Link to="/catering-manager/packages" className="mt-2 inline-block text-sm text-emerald-800 underline">Manage packages</Link>
        </div>
      </div>
    </div>
  )
}
