import { Link, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useCart } from '../../contexts/CartContext'
import { ROLE_HOME } from '../../lib/constants'

const NAV_LINKS = [
  { to: '/', label: 'Products' },
  { to: '/packages', label: 'Catering Packages' },
]

export default function Navbar() {
  const { user, profile, role, signOut } = useAuth()
  const { itemCount } = useCart()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  return (
    <header className="sticky top-0 z-40 border-b border-stone-300 bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <Link to="/" className="flex items-center gap-2 text-lg font-bold text-stone-900">
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

        <div className="flex items-center gap-3">
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

          {user ? (
            <div className="relative">
              <button
                type="button"
                onClick={() => setMenuOpen((o) => !o)}
                className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium text-stone-700 hover:bg-stone-100"
              >
                {profile?.full_name || user.email}
              </button>
              {menuOpen && (
                <div className="absolute right-0 mt-2 w-48 rounded-md border border-stone-200 bg-white py-1 shadow-lg">
                  {role && role !== 'customer' && (
                    <Link
                      to={ROLE_HOME[role]}
                      className="block px-4 py-2 text-sm text-stone-700 hover:bg-stone-50"
                      onClick={() => setMenuOpen(false)}
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
            <div className="flex items-center gap-2">
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
        </div>
      </div>
    </header>
  )
}
