import { NavLink } from 'react-router-dom'

const NAV_BY_ROLE = {
  administrator: [
    { to: '/admin', label: 'Dashboard', end: true },
    { to: '/admin/products', label: 'Products' },
    { to: '/admin/categories', label: 'Categories' },
    { to: '/admin/packages', label: 'Packages' },
    { to: '/admin/inventory', label: 'Stock' },
    { to: '/admin/orders', label: 'Orders' },
    { to: '/admin/reservations', label: 'Reservations' },
    { to: '/admin/staff', label: 'Staff' },
    { to: '/admin/reports', label: 'Reports' },
  ],
  staff: [
    { to: '/staff', label: 'My Tasks', end: true },
    { to: '/staff/inventory', label: 'Update Inventory' },
  ],
  catering_manager: [
    { to: '/catering-manager', label: 'Dashboard', end: true },
    { to: '/catering-manager/orders', label: 'Orders' },
    { to: '/catering-manager/packages', label: 'Packages' },
    { to: '/catering-manager/reservations', label: 'Reservations' },
    { to: '/catering-manager/event-bookings', label: 'Event Bookings' },
    { to: '/catering-manager/tasks', label: 'Staff & Tasks' },
  ],
}

const ROLE_LABEL = {
  administrator: 'Sahan Admin',
  staff: 'Sahan Staff',
  catering_manager: 'Sahan Manager',
}

export default function Sidebar({ role }) {
  const links = NAV_BY_ROLE[role] ?? []

  return (
    <aside className="m-4 flex w-56 shrink-0 flex-col self-start rounded-xl border border-stone-300 bg-white">
      <div className="border-b border-stone-200 px-5 py-4">
        <p className="font-bold text-primary-700">{ROLE_LABEL[role]}</p>
      </div>
      <nav className="flex flex-col gap-1 p-3">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.end}
            className={({ isActive }) =>
              `rounded-lg px-4 py-2.5 text-sm font-medium transition ${
                isActive ? 'bg-primary-600 text-white' : 'text-stone-600 hover:bg-primary-50 hover:text-primary-700'
              }`
            }
          >
            {link.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
