export function Input({ label, error, className = '', ...props }) {
  return (
    <label className="flex flex-col gap-1.5 text-sm">
      {label && <span className="font-medium text-stone-700">{label}</span>}
      <input
        className={`rounded-lg border border-stone-300 bg-white px-3.5 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200 ${className}`}
        {...props}
      />
      {error && <span className="text-xs text-red-600">{error}</span>}
    </label>
  )
}

export function Select({ label, error, className = '', children, ...props }) {
  return (
    <label className="flex flex-col gap-1.5 text-sm">
      {label && <span className="font-medium text-stone-700">{label}</span>}
      <select
        className={`rounded-lg border border-stone-300 bg-white px-3.5 py-2.5 text-sm text-stone-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200 ${className}`}
        {...props}
      >
        {children}
      </select>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </label>
  )
}

export function TextArea({ label, error, className = '', ...props }) {
  return (
    <label className="flex flex-col gap-1.5 text-sm">
      {label && <span className="font-medium text-stone-700">{label}</span>}
      <textarea
        className={`rounded-lg border border-stone-300 bg-white px-3.5 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200 ${className}`}
        {...props}
      />
      {error && <span className="text-xs text-red-600">{error}</span>}
    </label>
  )
}

const VARIANT_CLASSES = {
  primary: 'bg-primary-600 text-white hover:bg-primary-700 disabled:bg-stone-300',
  secondary: 'border border-primary-600 bg-white text-primary-700 hover:bg-primary-50',
  danger: 'bg-red-600 text-white hover:bg-red-700 disabled:bg-stone-300',
  ghost: 'text-stone-600 hover:bg-stone-100',
}

export function Button({ variant = 'primary', className = '', children, ...props }) {
  return (
    <button
      type="button"
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition disabled:cursor-not-allowed ${VARIANT_CLASSES[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}

export function PageHeader({ title, description, actions }) {
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold text-stone-900">{title}</h1>
        {description && <p className="mt-1 text-sm text-stone-500">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  )
}

export function Card({ className = '', children }) {
  return <div className={`rounded-xl border border-stone-200 bg-white p-5 shadow-sm ${className}`}>{children}</div>
}

/** Pill-shaped toggle group, e.g. event types or login/register tabs */
export function PillToggle({ options, value, onChange, className = '' }) {
  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {options.map((opt) => {
        const active = opt.value === value
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`rounded-full border px-5 py-2 text-sm font-medium transition ${
              active
                ? 'border-primary-600 bg-primary-600 text-white'
                : 'border-stone-300 bg-white text-stone-700 hover:border-primary-400 hover:text-primary-700'
            }`}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}
