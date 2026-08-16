import { Link, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useCart } from '../../contexts/CartContext'
import { ROLE_HOME } from '../../lib/constants'

const NAV_LINKS = [
  { to: '/', label: 'Products' },
  { to: '/packages', label: 'Catering Packages' },
  { to: '/schedule', label: 'Schedule Event' },
]

export default function Navbar() {
  const { user, profile, role, signOut } = useAuth()
  const { itemCount } = useCart()
  const navigate = useNavigate()
  const [accountOpen, setAccountOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  const closeMobile = () => setMobileOpen(false)

  const handleSignOut = async () => {
    closeMobile()
    setAccountOpen(false)
    await signOut()
    navigate('/login')
  }

  return (
    <header className="sticky top-0 z-40 border-b border-stone-300 bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <Link to="/" className="flex items-center gap-2 text-lg font-bold text-stone-900" onClick={closeMobile}>
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-rose-500 text-sm font-bold text-white">
            S
          </span>
          Sahan Catering
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          {NAV_LINKS.map((link) => (
            <Link key={link.to} to={link.to} className="text-sm font-medium text-stone-600 hover:text-primary-600">
              {link.label}
            </Link>
          ))}
          {user && (
            <>
              <Link to="/my-orders" className="text-sm font-medium text-stone-600 hover:text-primary-600">
                My Orders
              </Link>
              <Link to="/my-reservations" className="text-sm font-medium text-stone-600 hover:text-primary-600">
                My Reservations
              </Link>
            </>
          )}
        </nav>

        <div className="flex items-center gap-1 sm:gap-3">
          {user && role === 'customer' && (
            <Link to="/cart" className="relative rounded-md p-2 text-stone-600 hover:bg-stone-100" aria-label="Cart">
              🛒
              {itemCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary-600 text-xs text-white">
                  {itemCount}
                </span>
              )}
            </Link>
          )}

          {/* Account menu — desktop only, mobile equivalent lives in the slide-down panel */}
          {user ? (
            <div className="relative hidden md:block">
              <button
                type="button"
                onClick={() => setAccountOpen((o) => !o)}
                className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium text-stone-700 hover:bg-stone-100"
              >
                {profile?.full_name || user.email}
              </button>
              {accountOpen && (
                <div className="absolute right-0 mt-2 w-48 rounded-md border border-stone-200 bg-white py-1 shadow-lg">
                  {role && role !== 'customer' && (
                    <Link
                      to={ROLE_HOME[role]}
                      className="block px-4 py-2 text-sm text-stone-700 hover:bg-stone-50"
                      onClick={() => setAccountOpen(false)}
                    >
                      Dashboard
                    </Link>
                  )}
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="block w-full px-4 py-2 text-left text-sm text-stone-700 hover:bg-stone-50"
                  >
                    Sign out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="hidden items-center gap-2 md:flex">
              <Link to="/login" className="text-sm font-medium text-stone-600 hover:text-primary-600">
                Log in
              </Link>
              <Link
                to="/signup"
                className="rounded-md bg-primary-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-700"
              >
                Sign up
              </Link>
            </div>
          )}

          <button
            type="button"
            onClick={() => setMobileOpen((o) => !o)}
            className="rounded-md p-2 text-xl text-stone-600 hover:bg-stone-100 md:hidden"
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? '✕' : '☰'}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <nav className="border-t border-stone-200 bg-white px-4 py-3 md:hidden">
          <div className="flex flex-col gap-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={closeMobile}
                className="rounded-md px-3 py-2.5 text-sm font-medium text-stone-700 hover:bg-stone-50"
              >
                {link.label}
              </Link>
            ))}
            {user && (
              <>
                <Link to="/my-orders" onClick={closeMobile} className="rounded-md px-3 py-2.5 text-sm font-medium text-stone-700 hover:bg-stone-50">
                  My Orders
                </Link>
                <Link to="/my-reservations" onClick={closeMobile} className="rounded-md px-3 py-2.5 text-sm font-medium text-stone-700 hover:bg-stone-50">
                  My Reservations
                </Link>
                {role && role !== 'customer' && (
                  <Link to={ROLE_HOME[role]} onClick={closeMobile} className="rounded-md px-3 py-2.5 text-sm font-medium text-stone-700 hover:bg-stone-50">
                    Dashboard
                  </Link>
                )}
              </>
            )}
          </div>

          <div className="mt-3 border-t border-stone-100 pt-3">
            {user ? (
              <>
                <p className="truncate px-3 pb-2 text-sm text-stone-500">{profile?.full_name || user.email}</p>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="w-full rounded-md px-3 py-2.5 text-left text-sm font-medium text-stone-700 hover:bg-stone-50"
                >
                  Sign out
                </button>
              </>
            ) : (
              <div className="flex flex-col gap-2 px-3">
                <Link to="/login" onClick={closeMobile} className="py-1 text-sm font-medium text-stone-600 hover:text-primary-600">
                  Log in
                </Link>
                <Link
                  to="/signup"
                  onClick={closeMobile}
                  className="rounded-md bg-primary-600 px-3 py-2 text-center text-sm font-medium text-white hover:bg-primary-700"
                >
                  Sign up
                </Link>
              </div>
            )}
          </div>
        </nav>
      )}
    </header>
  )
}
