const COLOR_MAP = {
  pending: 'bg-yellow-100 text-yellow-800',
  processing: 'bg-blue-100 text-blue-800',
  in_progress: 'bg-blue-100 text-blue-800',
  approved: 'bg-blue-100 text-blue-800',
  shipped: 'bg-indigo-100 text-indigo-800',
  assigned: 'bg-stone-100 text-stone-800',
  delivered: 'bg-green-100 text-green-800',
  completed: 'bg-green-100 text-green-800',
  paid: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
  rejected: 'bg-red-100 text-red-800',
  failed: 'bg-red-100 text-red-800',
  refunded: 'bg-purple-100 text-purple-800',
}

export default function StatusBadge({ status }) {
  const label = String(status ?? 'unknown').replace(/_/g, ' ')
  const classes = COLOR_MAP[status] ?? 'bg-stone-100 text-stone-800'
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${classes}`}>
      {label}
    </span>
  )
}
