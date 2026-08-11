import { vi } from 'vitest'

/**
 * Minimal chainable stand-in for the supabase-js query builder, used by
 * integration tests. Any `.from(table)` call pops the next queued
 * response for that table (FIFO) and returns a proxy where every chain
 * method (select/eq/insert/update/delete/order/single/maybeSingle/...)
 * returns itself, and awaiting the proxy resolves to that response.
 *
 * This intentionally does not validate which filters were applied — it
 * verifies outcomes (what the component does with a given response),
 * not the exact query shape, which keeps these tests resilient to
 * refactors of the query chain.
 */
export function createSupabaseMock() {
  const queues = new Map()

  function queueResponse(table, response) {
    if (!queues.has(table)) queues.set(table, [])
    queues.get(table).push(response)
  }

  function nextResponse(table) {
    const queue = queues.get(table)
    if (!queue || queue.length === 0) {
      return { data: null, error: null }
    }
    return queue.length > 1 ? queue.shift() : queue[0]
  }

  function makeBuilder(table) {
    const builder = {}
    const chainMethods = [
      'select', 'insert', 'update', 'delete', 'upsert',
      'eq', 'neq', 'in', 'order', 'limit', 'single', 'maybeSingle',
    ]
    for (const method of chainMethods) {
      builder[method] = vi.fn(() => builder)
    }
    builder.then = (resolve) => Promise.resolve(nextResponse(table)).then(resolve)
    builder.catch = (reject) => Promise.resolve(nextResponse(table)).catch(reject)
    return builder
  }

  const from = vi.fn((table) => makeBuilder(table))

  const auth = {
    getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
    onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
    signInWithPassword: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn().mockResolvedValue({ error: null }),
    resetPasswordForEmail: vi.fn(),
  }

  const rpc = vi.fn()

  function reset() {
    queues.clear()
    from.mockClear()
    rpc.mockClear()
    for (const fn of Object.values(auth)) {
      if (typeof fn?.mockClear === 'function') fn.mockClear()
    }
  }

  return { supabase: { from, auth, rpc }, queueResponse, reset }
}
