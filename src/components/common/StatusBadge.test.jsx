import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import StatusBadge from './StatusBadge'

describe('StatusBadge', () => {
  it('renders the status text with underscores converted to spaces', () => {
    render(<StatusBadge status="out_for_delivery" />)
    expect(screen.getByText('out for delivery')).toBeInTheDocument()
  })

  it('applies a green-toned class for a positive terminal status', () => {
    render(<StatusBadge status="completed" />)
    expect(screen.getByText('completed')).toHaveClass('bg-green-100', 'text-green-800')
  })

  it('applies a red-toned class for a negative terminal status', () => {
    render(<StatusBadge status="cancelled" />)
    expect(screen.getByText('cancelled')).toHaveClass('bg-red-100', 'text-red-800')
  })

  it('falls back to a neutral style and "unknown" label for missing status', () => {
    render(<StatusBadge status={null} />)
    expect(screen.getByText('unknown')).toBeInTheDocument()
  })
})
