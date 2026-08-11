import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CartProvider, useCart } from './CartContext'
import { createSupabaseMock } from '../test/supabaseMock'

// CartContext owns the business logic behind "does the total on screen
// match what's in the cart" (IT-01 in TESTING.md) and "one cart per
// customer, created lazily" (IT-02). Both are easy to silently break
// while refactoring, and both would otherwise only be caught by a human
// clicking through the storefront.

const { supabase: mockSupabase, queueResponse, reset: resetSupabaseMock } = createSupabaseMock()

vi.mock('../lib/supabaseClient', () => ({
  get supabase() {
    return mockSupabase
  },
}))

const mockUseAuth = vi.fn()
vi.mock('./AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}))

function Harness() {
  const cart = useCart()
  return (
    <div>
      <div data-testid="loading">{String(cart.loading)}</div>
      <div data-testid="cartId">{cart.cartId ?? ''}</div>
      <div data-testid="subtotal">{cart.subtotal}</div>
      <div data-testid="itemCount">{cart.itemCount}</div>
      <ul>
        {cart.items.map((i) => (
          <li key={i.id}>{i.product?.product_name} x{i.quantity}</li>
        ))}
      </ul>
      <button onClick={() => cart.addItem({ id: 'p1', product_name: 'Roasted Almonds', price: 3500 }, 2)}>
        Add
      </button>
      <button onClick={() => cart.removeItem('ci1')}>Remove</button>
    </div>
  )
}

function renderCart() {
  return render(
    <CartProvider>
      <Harness />
    </CartProvider>
  )
}

beforeEach(() => {
  resetSupabaseMock()
  mockUseAuth.mockReset()
})

describe('CartContext (integration)', () => {
  it('loads the customer\'s existing cart and computes subtotal from unit_price × quantity', async () => {
    mockUseAuth.mockReturnValue({ user: { id: 'user-1' }, role: 'customer' })
    queueResponse('carts', { data: { id: 'cart-1' }, error: null })
    queueResponse('cart_items', {
      data: [
        { id: 'ci1', product_id: 'p1', quantity: 2, unit_price: 3500, product: { product_name: 'Roasted Almonds' } },
      ],
      error: null,
    })

    renderCart()

    await waitFor(() => expect(screen.getByTestId('cartId')).toHaveTextContent('cart-1'))
    expect(screen.getByTestId('subtotal')).toHaveTextContent('7000')
    expect(screen.getByTestId('itemCount')).toHaveTextContent('2')
  })

  it('creates a new cart for a customer who does not have one yet', async () => {
    mockUseAuth.mockReturnValue({ user: { id: 'user-2' }, role: 'customer' })
    queueResponse('carts', { data: null, error: null }) // maybeSingle finds nothing
    queueResponse('carts', { data: { id: 'brand-new-cart' }, error: null }) // insert().select().single()
    queueResponse('cart_items', { data: [], error: null })

    renderCart()

    await waitFor(() => expect(screen.getByTestId('cartId')).toHaveTextContent('brand-new-cart'))
    expect(screen.getByTestId('subtotal')).toHaveTextContent('0')
    expect(screen.getByTestId('itemCount')).toHaveTextContent('0')
  })

  it('increases quantity when adding a product already in the cart, then reloads totals', async () => {
    mockUseAuth.mockReturnValue({ user: { id: 'user-1' }, role: 'customer' })
    queueResponse('carts', { data: { id: 'cart-1' }, error: null })
    queueResponse('cart_items', {
      data: [{ id: 'ci1', product_id: 'p1', quantity: 2, unit_price: 3500, product: { product_name: 'Roasted Almonds' } }],
      error: null,
    }) // consumed by mount's select
    queueResponse('cart_items', { error: null }) // consumed by the update() call inside addItem
    queueResponse('cart_items', {
      data: [{ id: 'ci1', product_id: 'p1', quantity: 4, unit_price: 3500, product: { product_name: 'Roasted Almonds' } }],
      error: null,
    }) // consumed by the reload's select

    renderCart()
    await waitFor(() => expect(screen.getByTestId('itemCount')).toHaveTextContent('2'))

    await userEvent.click(screen.getByText('Add'))

    await waitFor(() => expect(screen.getByTestId('itemCount')).toHaveTextContent('4'))
    expect(screen.getByTestId('subtotal')).toHaveTextContent('14000')
  })

  it('removes an item and reloads to reflect an empty cart', async () => {
    mockUseAuth.mockReturnValue({ user: { id: 'user-1' }, role: 'customer' })
    queueResponse('carts', { data: { id: 'cart-1' }, error: null })
    queueResponse('cart_items', {
      data: [{ id: 'ci1', product_id: 'p1', quantity: 2, unit_price: 3500, product: { product_name: 'Roasted Almonds' } }],
      error: null,
    }) // mount select
    queueResponse('cart_items', { error: null }) // delete() call
    queueResponse('cart_items', { data: [], error: null }) // reload select

    renderCart()
    await waitFor(() => expect(screen.getByTestId('itemCount')).toHaveTextContent('2'))

    await userEvent.click(screen.getByText('Remove'))

    await waitFor(() => expect(screen.getByTestId('itemCount')).toHaveTextContent('0'))
    expect(screen.getByTestId('subtotal')).toHaveTextContent('0')
  })

  it('never fetches a cart for a non-customer role (staff/admin/catering_manager have no cart)', async () => {
    mockUseAuth.mockReturnValue({ user: { id: 'staff-1' }, role: 'staff' })

    renderCart()

    expect(screen.getByTestId('cartId')).toHaveTextContent('')
    expect(mockSupabase.from).not.toHaveBeenCalledWith('carts')
  })
})
