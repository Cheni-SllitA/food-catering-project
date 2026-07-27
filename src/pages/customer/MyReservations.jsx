import { useEffect, useState } from 'react'
import { formatLKR } from '../../lib/format'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../contexts/AuthContext'
import DataTable from '../../components/common/DataTable'
import StatusBadge from '../../components/common/StatusBadge'
import { PageHeader } from '../../components/common/FormControls'

export default function MyReservations() {
  const { user } = useAuth()
  const [reservations, setReservations] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    async function load() {
      setLoading(true)
      const { data, error } = await supabase
        .from('catering_reservations')
        .select('*, package:catering_packages(package_name)')
        .eq('customer_id', user.id)
        .order('created_at', { ascending: false })
      if (!mounted) return
      if (error) console.error('Failed to load reservations', error)
      setReservations(data ?? [])
      setLoading(false)
    }
    load()
    return () => {
      mounted = false
    }
  }, [user.id])

  return (
    <div>
      <PageHeader title="My Reservations" />
      <DataTable
        loading={loading}
        data={reservations}
        emptyMessage="You haven't made any reservations yet"
        columns={[
          { key: 'package', header: 'Package', render: (row) => <Link to={`/my-reservations/${row.id}`} className="font-medium text-primary-600 hover:underline">{row.package?.package_name || 'Package'}</Link> },
          { key: 'event_date', header: 'Event date', render: (row) => row.event_date ? new Date(row.event_date).toLocaleDateString() : '-' },
          { key: 'number_of_guests', header: 'Guests' },
          { key: 'total_amount', header: 'Total', render: (row) => formatLKR(row.total_amount) },
          { key: 'status', header: 'Status', render: (row) => <StatusBadge status={row.status} /> },
        ]}
      />
    </div>
  )
}
