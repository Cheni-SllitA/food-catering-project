import { useEffect, useState } from 'react'
import { formatLKR } from '../../lib/format'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../contexts/AuthContext'
import DataTable from '../../components/common/DataTable'
import StatusBadge from '../../components/common/StatusBadge'
import { PageHeader } from '../../components/common/FormControls'

export default function MyOrders() {
  const { user } = useAuth()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    async function load() {
      setLoading(true)
      const { data, error } = await supabase
        .from('product_orders')
        .select('*')
        .eq('customer_id', user.id)
        .order('created_at', { ascending: false })
      if (!mounted) return
      if (error) console.error('Failed to load orders', error)
      setOrders(data ?? [])
      setLoading(false)
    }
    load()
    return () => {
      mounted = false
    }
  }, [user.id])

  return (
    <div>
      <PageHeader title="My Orders" />
      <DataTable
        loading={loading}
        data={orders}
        emptyMessage="You haven't placed any orders yet"
        columns={[
          { key: 'id', header: 'Order', render: (row) => <Link to={`/my-orders/${row.id}`} className="font-medium text-primary-600 hover:underline">#{row.id.slice(0, 8)}</Link> },
          { key: 'created_at', header: 'Date', render: (row) => new Date(row.created_at).toLocaleDateString() },
          { key: 'total_amount', header: 'Total', render: (row) => formatLKR(row.total_amount) },
          { key: 'status', header: 'Status', render: (row) => <StatusBadge status={row.status} /> },
          { key: 'payment_status', header: 'Payment', render: (row) => <StatusBadge status={row.payment_status} /> },
        ]}
      />
    </div>
  )
}
