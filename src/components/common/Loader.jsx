export default function Loader({ full = false, label = 'Loading...' }) {
  return (
    <div className={full ? 'flex min-h-[60vh] items-center justify-center' : 'flex items-center justify-center py-10'}>
      <div className="flex items-center gap-3 text-stone-500">
        <span className="h-5 w-5 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
        <span>{label}</span>
      </div>
    </div>
  )
}
