import { Outlet, Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import Sidebar from './Sidebar'

export default function DashboardLayout({ role }) {
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between border-b border-stone-300 bg-white px-6 py-3">
        <Link to="/" className="flex items-center gap-2 text-lg font-bold text-stone-900">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-rose-500 text-sm font-bold text-white">
            S
          </span>
          Sahan Catering
        </Link>
        <div className="flex items-center gap-4">
          <span className="text-sm text-stone-600">{profile?.full_name}</span>
          <button
            type="button"
            onClick={handleSignOut}
            className="rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-sm font-medium text-stone-700 hover:bg-stone-50"
          >
            Sign out
          </button>
        </div>
      </header>
      <div className="flex flex-1">
        <Sidebar role={role} />
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
