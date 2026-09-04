import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import toast from 'react-hot-toast'
import { useAuth } from './AuthContext'
import { cartService } from '../services/cartService'
import { sanitizeErrorMessage } from '../utils/errorHandler'

const CartContext = createContext(null)

export function CartProvider({ children }) {
  const { user } = useAuth()
  const [cartItems, setCartItems] = useState([])
  const [loading, setLoading] = useState(false)

  // Load cart items on auth state change
  useEffect(() => {
    let mounted = true
    const loadCart = async () => {
      setLoading(true)
      const { data } = await cartService.getCart(user?.id)
      if (mounted) {
        setCartItems(data || [])
        setLoading(false)
      }
    }
    loadCart()
    return () => {
      mounted = false
    }
  }, [user?.id])

  const addToCart = useCallback(async (vehicle) => {
    if (vehicle.status === 'sold') {
      toast.error('This vehicle has already been sold.')
      return false
    }

    // Client-side quick check
    if (cartItems.some(i => i.id === vehicle.id)) {
      toast('This vehicle is already in your cart.', { icon: '🛒' })
      return false
    }

    const { success, duplicate, error } = await cartService.addToCart(user?.id, vehicle)
    if (success) {
      setCartItems(prev => [...prev, { ...vehicle, addedAt: new Date().toISOString() }])
      toast.success(`${vehicle.name} added to cart!`)
      return true
    } else if (duplicate) {
      toast('This vehicle is already in your cart.', { icon: '🛒' })
      return false
    } else {
      toast.error(sanitizeErrorMessage(error, 'Could not add vehicle to cart.'))
      return false
    }
  }, [cartItems, user?.id])

  const removeFromCart = useCallback(async (vehicleId) => {
    const { success, error } = await cartService.removeFromCart(user?.id, vehicleId)
    if (success) {
      setCartItems(prev => prev.filter(item => item.id !== vehicleId))
      toast.success('Vehicle removed from cart')
    } else {
      toast.error(sanitizeErrorMessage(error, 'Could not remove vehicle.'))
    }
  }, [user?.id])

  const clearCart = useCallback(async () => {
    const { success } = await cartService.clearCart(user?.id)
    if (success) {
      setCartItems([])
    }
  }, [user?.id])

  const isInCart = useCallback((vehicleId) => {
    return cartItems.some(item => item.id === vehicleId)
  }, [cartItems])

  const cartCount = cartItems.length
  const cartTotal = cartItems.reduce((sum, item) => sum + (Number(item.price) || 0), 0)

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        clearCart,
        isInCart,
        cartCount,
        cartTotal,
        loading,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}
