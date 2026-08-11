import { describe, it, expect } from 'vitest'
import { ROLES, ROLE_HOME, ORDER_STATUS, PAYMENT_STATUS, RESERVATION_STATUS, TASK_STATUS, TRANSACTION_TYPE } from './constants'

// These constants must mirror the live Postgres enum labels exactly —
// a typo here causes a silent runtime rejection from Supabase
// ("invalid input value for enum ..."), not a build-time error. See
// README.md "Schema notes" for the source of truth.
describe('role/enum constants match the live Postgres enums', () => {
  it('ROLES uses the exact user_role enum labels', () => {
    expect(Object.values(ROLES).sort()).toEqual(
      ['administrator', 'catering_manager', 'customer', 'staff'].sort()
    )
  })

  it('every role has a configured home route', () => {
    for (const role of Object.values(ROLES)) {
      expect(ROLE_HOME[role]).toBeTruthy()
    }
  })

  it('ORDER_STATUS uses the exact order_status enum labels', () => {
    expect(Object.values(ORDER_STATUS).sort()).toEqual(
      ['cancelled', 'delivered', 'pending', 'processing', 'shipped'].sort()
    )
  })

  it('PAYMENT_STATUS uses the exact payment_status enum labels', () => {
    expect(Object.values(PAYMENT_STATUS).sort()).toEqual(
      ['failed', 'paid', 'pending', 'refunded'].sort()
    )
  })

  it('RESERVATION_STATUS uses the exact reservation_status enum labels', () => {
    expect(Object.values(RESERVATION_STATUS).sort()).toEqual(
      ['approved', 'cancelled', 'completed', 'pending', 'rejected'].sort()
    )
  })

  it('TASK_STATUS uses the exact task_status enum labels', () => {
    expect(Object.values(TASK_STATUS).sort()).toEqual(
      ['assigned', 'completed', 'in_progress'].sort()
    )
  })

  it('TRANSACTION_TYPE uses the exact inventory_txn_type enum labels', () => {
    expect(Object.values(TRANSACTION_TYPE).sort()).toEqual(
      ['adjustment', 'purchase', 'return', 'sale'].sort()
    )
  })
})
