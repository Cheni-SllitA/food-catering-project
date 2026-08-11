import { describe, it, expect } from 'vitest'
import { formatLKR } from './format'

describe('formatLKR', () => {
  it('formats a whole number with two decimal places and thousands separators', () => {
    expect(formatLKR(3500)).toBe('Rs 3,500.00')
  })

  it('formats a decimal value, rounding to two places for display', () => {
    expect(formatLKR(1999.5)).toBe('Rs 1,999.50')
  })

  it('treats null as zero', () => {
    expect(formatLKR(null)).toBe('Rs 0.00')
  })

  it('treats undefined as zero', () => {
    expect(formatLKR(undefined)).toBe('Rs 0.00')
  })

  it('formats zero explicitly', () => {
    expect(formatLKR(0)).toBe('Rs 0.00')
  })

  it('formats large totals with correct grouping', () => {
    expect(formatLKR(750000)).toBe('Rs 750,000.00')
  })

  it('coerces numeric strings (as returned by Postgres numeric columns)', () => {
    expect(formatLKR('420.00')).toBe('Rs 420.00')
  })
})
