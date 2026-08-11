import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, LabelList,
} from 'recharts'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../contexts/AuthContext'
import { uploadReportFile } from '../../lib/storage'
import { formatLKR } from '../../lib/format'
import DataTable from '../../components/common/DataTable'
import Loader from '../../components/common/Loader'
import { Button, Card, PageHeader } from '../../components/common/FormControls'

// Validated categorical palette (dataviz skill, light-mode, fixed order — never cycled)
const CATEGORICAL = ['#2a78d6', '#eb6834', '#1baf7a', '#eda100', '#e87ba4']
const INK_SECONDARY = '#52514e'
const GRIDLINE = '#e1e0d9'

const ORDER_STATUS_ORDER = ['pending', 'processing', 'shipped', 'delivered', 'cancelled']
const TXN_TYPE_ORDER = ['purchase', 'sale', 'adjustment', 'return']

function dayKey(iso) {
  return new Date(iso).toISOString().slice(0, 10)
}

export default function ReportsAdmin() {
  const { user } = useAuth()
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [bucketMissing, setBucketMissing] = useState(false)

  const [chartsLoading, setChartsLoading] = useState(true)
  const [orders, setOrders] = useState([])
  const [inventoryTxns, setInventoryTxns] = useState([])

  const load = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('reports')
      .select('*, generated_by_profile:profiles(full_name)')
      .order('generated_at', { ascending: false })
    if (error) console.error('Failed to load reports', error)
    setReports(data ?? [])
    setLoading(false)
  }

  const loadChartData = async () => {
    setChartsLoading(true)
    const [{ data: orderData, error: orderError }, { data: txnData, error: txnError }] = await Promise.all([
      supabase.from('product_orders').select('created_at, total_amount, status'),
      supabase.from('inventory_transactions').select('transaction_type, quantity, product_id, product:products(product_name)'),
    ])
    if (orderError) console.error('Failed to load orders for analytics', orderError)
    if (txnError) console.error('Failed to load inventory transactions for analytics', txnError)
    setOrders(orderData ?? [])
    setInventoryTxns(txnData ?? [])
    setChartsLoading(false)
  }

  useEffect(() => {
    load()
    loadChartData()
  }, [])

  const handleGenerate = async () => {
    setGenerating(true)
    setBucketMissing(false)
    try {
      const { data: ordersForCsv, error: ordersError } = await supabase
        .from('product_orders')
        .select('id, created_at, total_amount, status, payment_status')
      if (ordersError) throw ordersError

      const rows = [
        ['Order ID', 'Date', 'Total', 'Status', 'Payment Status'],
        ...ordersForCsv.map((o) => [o.id, o.created_at, o.total_amount, o.status, o.payment_status]),
      ]
      const csv = rows.map((r) => r.join(',')).join('\n')
      const filename = `sales-summary-${new Date().toISOString().slice(0, 10)}.csv`
      const fileUrl = await uploadReportFile(csv, filename)

      const { error: insertError } = await supabase.from('reports').insert({
        report_name: filename,
        generated_by: user.id,
        file_url: fileUrl,
      })
      if (insertError) throw insertError

      toast.success('Report generated')
      load()
    } catch (err) {
      console.error(err)
      const isBucketMissing = err?.message?.toLowerCase().includes('bucket not found') || err?.statusCode === '404'
      if (isBucketMissing) {
        setBucketMissing(true)
        toast.error("Storage bucket 'reports' not found — see the notice below")
      } else {
        toast.error(err.message || 'Could not generate report')
      }
    } finally {
      setGenerating(false)
    }
  }

  // ---- chart data ----------------------------------------------------
  const salesTrend = useMemo(() => {
    const since = new Date()
    since.setDate(since.getDate() - 13)
    const byDay = new Map()
    for (let i = 0; i < 14; i++) {
      const d = new Date(since)
      d.setDate(since.getDate() + i)
      byDay.set(d.toISOString().slice(0, 10), 0)
    }
    for (const o of orders) {
      if (o.status === 'cancelled') continue
      const key = dayKey(o.created_at)
      if (byDay.has(key)) byDay.set(key, byDay.get(key) + Number(o.total_amount ?? 0))
    }
    return [...byDay.entries()].map(([date, total]) => ({
      date: new Date(date).toLocaleDateString('en', { month: 'short', day: 'numeric' }),
      total,
    }))
  }, [orders])

  const ordersByStatus = useMemo(() => {
    const counts = Object.fromEntries(ORDER_STATUS_ORDER.map((s) => [s, 0]))
    for (const o of orders) {
      if (counts[o.status] != null) counts[o.status] += 1
    }
    return ORDER_STATUS_ORDER.map((status, i) => ({
      status: status.replace(/_/g, ' '),
      count: counts[status],
      fill: CATEGORICAL[i % CATEGORICAL.length],
    }))
  }, [orders])

  const stockMovement = useMemo(() => {
    const totals = Object.fromEntries(TXN_TYPE_ORDER.map((t) => [t, 0]))
    for (const t of inventoryTxns) {
      if (totals[t.transaction_type] != null) totals[t.transaction_type] += Number(t.quantity ?? 0)
    }
    return TXN_TYPE_ORDER.map((type, i) => ({
      type,
      quantity: totals[type],
      fill: CATEGORICAL[i % CATEGORICAL.length],
    }))
  }, [inventoryTxns])

  const totalRevenue = useMemo(() => salesTrend.reduce((sum, d) => sum + d.total, 0), [salesTrend])

  return (
    <div>
      <PageHeader
        title="Reports & Analytics"
        description="Generate sales reports and review business performance"
        actions={<Button onClick={handleGenerate} disabled={generating}>{generating ? 'Generating...' : 'Generate sales report'}</Button>}
      />

      {bucketMissing && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <p className="font-semibold">Storage bucket "reports" not found (404)</p>
          <p className="mt-1">
            Report generation uploads a CSV to a Supabase Storage bucket named exactly <code className="rounded bg-red-100 px-1">reports</code>,
            which doesn't exist yet in this project. To fix it:
          </p>
          <ol className="mt-2 list-decimal space-y-1 pl-5">
            <li>Open your Supabase dashboard → <strong>Storage</strong> → <strong>New bucket</strong></li>
            <li>Name it exactly <code className="rounded bg-red-100 px-1">reports</code> and mark it Public</li>
            <li>Run <code className="rounded bg-red-100 px-1">reports_storage_policy.sql</code> in the SQL editor (grants upload/read permission)</li>
          </ol>
        </div>
      )}

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-sky-200 bg-sky-50 p-5">
          <p className="text-sm text-sky-700 opacity-80">Revenue (last 14 days)</p>
          <p className="mt-1 text-2xl font-bold text-sky-700">{formatLKR(totalRevenue)}</p>
        </div>
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5">
          <p className="text-sm text-emerald-700 opacity-80">Total orders</p>
          <p className="mt-1 text-2xl font-bold text-emerald-700">{orders.length}</p>
        </div>
        <div className="rounded-xl border border-violet-200 bg-violet-50 p-5">
          <p className="text-sm text-violet-700 opacity-80">Stock transactions logged</p>
          <p className="mt-1 text-2xl font-bold text-violet-700">{inventoryTxns.length}</p>
        </div>
      </div>

      {chartsLoading ? (
        <Loader />
      ) : (
        <div className="mb-10 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card className="lg:col-span-2">
            <h2 className="mb-1 font-semibold text-stone-900">Sales Progress — Last 14 Days</h2>
            <p className="mb-4 text-xs text-stone-500">Daily revenue from non-cancelled orders</p>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={salesTrend} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid stroke={GRIDLINE} vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 12, fill: INK_SECONDARY }} axisLine={{ stroke: GRIDLINE }} tickLine={false} />
                <YAxis
                  tick={{ fontSize: 12, fill: INK_SECONDARY }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `Rs ${(v / 1000).toFixed(0)}k`}
                  width={56}
                />
                <Tooltip formatter={(v) => formatLKR(v)} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Line type="monotone" dataKey="total" name="Revenue" stroke={CATEGORICAL[0]} strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </Card>

          <Card>
            <h2 className="mb-1 font-semibold text-stone-900">Orders Analysis</h2>
            <p className="mb-4 text-xs text-stone-500">Order count by status</p>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={ordersByStatus} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid stroke={GRIDLINE} vertical={false} />
                <XAxis dataKey="status" tick={{ fontSize: 11, fill: INK_SECONDARY }} axisLine={{ stroke: GRIDLINE }} tickLine={false} interval={0} angle={-15} textAnchor="end" height={50} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: INK_SECONDARY }} axisLine={false} tickLine={false} width={32} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Bar dataKey="count" name="Orders" radius={[4, 4, 0, 0]}>
                  {ordersByStatus.map((entry) => (
                    <Cell key={entry.status} fill={entry.fill} />
                  ))}
                  <LabelList dataKey="count" position="top" style={{ fontSize: 11, fill: '#0b0b0b' }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>

          <Card>
            <h2 className="mb-1 font-semibold text-stone-900">Stock Usage</h2>
            <p className="mb-4 text-xs text-stone-500">Total quantity moved by transaction type</p>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={stockMovement} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid stroke={GRIDLINE} vertical={false} />
                <XAxis dataKey="type" tick={{ fontSize: 12, fill: INK_SECONDARY }} axisLine={{ stroke: GRIDLINE }} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: INK_SECONDARY }} axisLine={false} tickLine={false} width={32} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="quantity" name="Quantity" radius={[4, 4, 0, 0]}>
                  {stockMovement.map((entry) => (
                    <Cell key={entry.type} fill={entry.fill} />
                  ))}
                  <LabelList dataKey="quantity" position="top" style={{ fontSize: 11, fill: '#0b0b0b' }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>
      )}

      <h2 className="mb-2 text-lg font-semibold text-stone-900">Generated Reports</h2>
      <DataTable
        loading={loading}
        data={reports}
        emptyMessage="No reports generated yet"
        columns={[
          { key: 'report_name', header: 'Report' },
          { key: 'generated_by_profile', header: 'Generated by', render: (row) => row.generated_by_profile?.full_name || '-' },
          { key: 'generated_at', header: 'Date', render: (row) => new Date(row.generated_at).toLocaleString() },
          {
            key: 'file_url',
            header: '',
            render: (row) => row.file_url ? <a href={row.file_url} target="_blank" rel="noreferrer" className="text-primary-600 hover:underline">Download</a> : '-',
          },
        ]}
      />
    </div>
  )
}
