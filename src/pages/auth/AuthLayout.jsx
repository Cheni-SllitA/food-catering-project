import { Link, Outlet } from 'react-router-dom'

export default function AuthLayout() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-stone-300 bg-white p-8">
          <div className="mb-6 flex flex-col items-center gap-3">
            <Link
              to="/"
              className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-rose-500 text-2xl font-bold text-white"
              aria-label="Home"
            >
              S
            </Link>
            <h1 className="text-xl font-bold text-stone-900">Sahan <span className="text-primary-600">Catering</span> Services</h1>
          </div>
          <Outlet />
        </div>
      </div>
    </div>
  )
}
