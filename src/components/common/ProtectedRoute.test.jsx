import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import ProtectedRoute from './ProtectedRoute'

// ProtectedRoute is the single gate that keeps a customer out of
// /admin, a staff member out of the catering manager's reservation
// controls, etc. These tests stand in for the manual "try logging in
// as each role and hit every other role's URL" pass in the System Test
// Plan (see TESTING.md, ST-08..ST-11) — cheap to run on every commit.
const mockUseAuth = vi.fn()
vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}))

function renderProtected({ allowedRoles, initialPath = '/protected' } = {}) {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/login" element={<div>Login page</div>} />
        <Route path="/" element={<div>Customer home</div>} />
        <Route path="/admin" element={<div>Admin home</div>} />
        <Route
          path="/protected"
          element={
            <ProtectedRoute allowedRoles={allowedRoles}>
              <div>Protected content</div>
            </ProtectedRoute>
          }
        />
      </Routes>
    </MemoryRouter>
  )
}

describe('ProtectedRoute', () => {
  beforeEach(() => {
    mockUseAuth.mockReset()
  })

  it('shows a loader while the auth session is still resolving', () => {
    mockUseAuth.mockReturnValue({ user: null, role: null, loading: true })
    renderProtected({ allowedRoles: ['administrator'] })
    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  it('redirects an unauthenticated visitor to /login', () => {
    mockUseAuth.mockReturnValue({ user: null, role: null, loading: false })
    renderProtected({ allowedRoles: ['administrator'] })
    expect(screen.getByText('Login page')).toBeInTheDocument()
  })

  it('redirects a logged-in user whose role is not allowed to their own home', () => {
    mockUseAuth.mockReturnValue({ user: { id: 'u1' }, role: 'customer', loading: false })
    renderProtected({ allowedRoles: ['administrator'] })
    expect(screen.getByText('Customer home')).toBeInTheDocument()
  })

  it('renders the protected content for an allowed role', () => {
    mockUseAuth.mockReturnValue({ user: { id: 'u2' }, role: 'administrator', loading: false })
    renderProtected({ allowedRoles: ['administrator'] })
    expect(screen.getByText('Protected content')).toBeInTheDocument()
  })

  it('renders the protected content when no role restriction is specified', () => {
    mockUseAuth.mockReturnValue({ user: { id: 'u3' }, role: 'customer', loading: false })
    renderProtected({ allowedRoles: undefined })
    expect(screen.getByText('Protected content')).toBeInTheDocument()
  })
})
