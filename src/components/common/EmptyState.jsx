export default function EmptyState({ title = 'Nothing here yet', message, action }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-stone-300 py-16 text-center">
      <p className="text-lg font-medium text-stone-700">{title}</p>
      {message && <p className="max-w-sm text-sm text-stone-500">{message}</p>}
      {action}
    </div>
  )
}
