import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from './AuthContext'
import toast from 'react-hot-toast'

const CartContext = createContext(undefined)

export function CartProvider({ children }) {
  const { user, role } = useAuth()
  const [cartId, setCartId] = useState(null)
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)

  const loadCart = useCallback(async () => {
    if (!user) {
      setCartId(null)
      setItems([])
      return
    }
    setLoading(true)
    try {
      let { data: cart, error: cartError } = await supabase
        .from('carts')
        .select('id')
        .eq('customer_id', user.id)
        .maybeSingle()

      if (cartError) throw cartError

      if (!cart) {
        const { data: newCart, error: createError } = await supabase
          .from('carts')
          .insert({ customer_id: user.id })
          .select('id')
          .single()
        if (createError) throw createError
        cart = newCart
      }

      setCartId(cart.id)

      const { data: cartItems, error: itemsError } = await supabase
        .from('cart_items')
        .select('*, product:products(*)')
        .eq('cart_id', cart.id)

      if (itemsError) throw itemsError
      setItems(cartItems ?? [])
    } catch (err) {
      console.error('Failed to load cart', err)
      toast.error('Could not load your cart')
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    if (role === 'customer') {
      loadCart()
    } else {
      setCartId(null)
      setItems([])
    }
  }, [role, loadCart])

  const addItem = useCallback(async (product, quantity = 1) => {
    if (!cartId) {
      toast.error('You must be logged in as a customer to add items to a cart')
      return
    }
    const existing = items.find((i) => i.product_id === product.id)
    try {
      if (existing) {
        const nextQty = existing.quantity + quantity
        const { error } = await supabase
          .from('cart_items')
          .update({ quantity: nextQty })
          .eq('id', existing.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('cart_items').insert({
          cart_id: cartId,
          product_id: product.id,
          quantity,
          unit_price: product.price,
        })
        if (error) throw error
      }
      await loadCart()
      toast.success(`${product.product_name} added to cart`)
    } catch (err) {
      console.error('Failed to add to cart', err)
      toast.error('Could not add item to cart')
    }
  }, [cartId, items, loadCart])

  const updateQuantity = useCallback(async (itemId, quantity) => {
    if (quantity < 1) return
    try {
      const { error } = await supabase.from('cart_items').update({ quantity }).eq('id', itemId)
      if (error) throw error
      await loadCart()
    } catch (err) {
      console.error('Failed to update quantity', err)
      toast.error('Could not update quantity')
    }
  }, [loadCart])

  const removeItem = useCallback(async (itemId) => {
    try {
      const { error } = await supabase.from('cart_items').delete().eq('id', itemId)
      if (error) throw error
      await loadCart()
      toast.success('Item removed')
    } catch (err) {
      console.error('Failed to remove item', err)
      toast.error('Could not remove item')
    }
  }, [loadCart])

  const clearCart = useCallback(async () => {
    if (!cartId) return
    try {
      const { error } = await supabase.from('cart_items').delete().eq('cart_id', cartId)
      if (error) throw error
      setItems([])
    } catch (err) {
      console.error('Failed to clear cart', err)
    }
  }, [cartId])

  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + Number(item.unit_price ?? item.product?.price ?? 0) * item.quantity, 0),
    [items]
  )

  const itemCount = useMemo(() => items.reduce((sum, item) => sum + item.quantity, 0), [items])

  const value = {
    cartId,
    items,
    loading,
    subtotal,
    itemCount,
    addItem,
    updateQuantity,
    removeItem,
    clearCart,
    reload: loadCart,
  }

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components -- hook lives alongside its provider by convention
export function useCart() {
  const ctx = useContext(CartContext)
  if (ctx === undefined) throw new Error('useCart must be used within a CartProvider')
  return ctx
}
