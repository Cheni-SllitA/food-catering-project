import { useState } from 'react'
import { Outlet, Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import Sidebar from './Sidebar'

export default function DashboardLayout({ role }) {
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between border-b border-stone-300 bg-white px-3 py-3 sm:px-6">
        <div className="flex min-w-0 items-center gap-1 sm:gap-2">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="shrink-0 rounded-md p-2 text-xl text-stone-600 hover:bg-stone-100 md:hidden"
            aria-label="Open menu"
          >
            ☰
          </button>
          <Link to="/" className="flex min-w-0 items-center gap-2 text-lg font-bold text-stone-900">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-rose-500 text-sm font-bold text-white">
              S
            </span>
            <span className="truncate">Sahan Catering</span>
          </Link>
        </div>
        <div className="flex shrink-0 items-center gap-2 sm:gap-4">
          <span className="hidden max-w-[10rem] truncate text-sm text-stone-600 sm:inline">{profile?.full_name}</span>
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
        <Sidebar role={role} open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        {/* min-w-0 lets the existing overflow-x-auto tables actually scroll
            inside this column instead of stretching the whole page wider */}
        <main className="min-w-0 flex-1 p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
