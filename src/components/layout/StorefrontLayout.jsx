import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'

export default function StorefrontLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6">
        <Outlet />
      </main>
      <footer className="border-t border-stone-300 bg-white py-6 text-center text-sm text-stone-500">
        © {new Date().getFullYear()} Sahan Catering Services. All rights reserved.
      </footer>
    </div>
  )
}
