import { useEffect, useState } from 'react'
import { formatLKR } from '../../lib/format'
import toast from 'react-hot-toast'
import { supabase } from '../../lib/supabaseClient'
import DataTable from '../../components/common/DataTable'
import { Select, PageHeader } from '../../components/common/FormControls'
import { ORDER_STATUS, PAYMENT_STATUS } from '../../lib/constants'

export default function OrdersAdmin() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('product_orders')
      .select('*, customer:profiles(full_name, phone)')
      .order('created_at', { ascending: false })
    if (error) console.error('Failed to load orders', error)
    setOrders(data ?? [])
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  const updateStatus = async (order, field, value) => {
    const { error } = await supabase.from('product_orders').update({ [field]: value }).eq('id', order.id)
    if (error) {
      toast.error('Could not update order')
      return
    }
    toast.success('Order updated')
    load()
  }

  return (
    <div>
      <PageHeader title="Orders" description="View and manage all customer orders" />
      <DataTable
        loading={loading}
        data={orders}
        emptyMessage="No orders yet"
        columns={[
          { key: 'id', header: 'Order', render: (row) => `#${row.id.slice(0, 8)}` },
          { key: 'customer', header: 'Customer', render: (row) => row.customer?.full_name || row.customer?.phone || '-' },
          { key: 'created_at', header: 'Date', render: (row) => new Date(row.created_at).toLocaleDateString() },
          { key: 'total_amount', header: 'Total', render: (row) => formatLKR(row.total_amount) },
          {
            key: 'status',
            header: 'Status',
            render: (row) => (
              <Select value={row.status} onChange={(e) => updateStatus(row, 'status', e.target.value)} className="py-1">
                {Object.values(ORDER_STATUS).map((s) => (
                  <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
                ))}
              </Select>
            ),
          },
          {
            key: 'payment_status',
            header: 'Payment',
            render: (row) => (
              <Select value={row.payment_status} onChange={(e) => updateStatus(row, 'payment_status', e.target.value)} className="py-1">
                {Object.values(PAYMENT_STATUS).map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </Select>
            ),
          },
        ]}
      />
    </div>
  )
}
