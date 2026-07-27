import { useEffect, useState } from 'react'
import { formatLKR } from '../../lib/format'
import toast from 'react-hot-toast'
import { supabase } from '../../lib/supabaseClient'
import DataTable from '../../components/common/DataTable'
import { Select, PageHeader } from '../../components/common/FormControls'
import { RESERVATION_STATUS } from '../../lib/constants'

export default function ReservationsAdmin() {
  const [reservations, setReservations] = useState([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('catering_reservations')
      .select('*, customer:profiles(full_name, phone), package:catering_packages(package_name)')
      .order('created_at', { ascending: false })
    if (error) console.error('Failed to load reservations', error)
    setReservations(data ?? [])
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  const updateStatus = async (reservation, status) => {
    const { error } = await supabase.from('catering_reservations').update({ status }).eq('id', reservation.id)
    if (error) {
      toast.error('Could not update reservation')
      return
    }
    toast.success('Reservation updated')
    load()
  }

  return (
    <div>
      <PageHeader title="Reservations" description="Review and approve catering reservations" />
      <DataTable
        loading={loading}
        data={reservations}
        emptyMessage="No reservations yet"
        columns={[
          { key: 'customer', header: 'Customer', render: (row) => row.customer?.full_name || row.customer?.phone || '-' },
          { key: 'package', header: 'Package', render: (row) => row.package?.package_name || '-' },
          { key: 'event_date', header: 'Event date', render: (row) => row.event_date ? new Date(row.event_date).toLocaleDateString() : '-' },
          { key: 'number_of_guests', header: 'Guests' },
          { key: 'total_amount', header: 'Total', render: (row) => formatLKR(row.total_amount) },
          {
            key: 'status',
            header: 'Status',
            render: (row) => (
              <Select value={row.status} onChange={(e) => updateStatus(row, e.target.value)} className="py-1">
                {Object.values(RESERVATION_STATUS).map((s) => (
                  <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
                ))}
              </Select>
            ),
          },
        ]}
      />
    </div>
  )
}
