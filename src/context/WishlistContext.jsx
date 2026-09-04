import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import toast from 'react-hot-toast'
import { useAuth } from './AuthContext'
import { wishlistService } from '../services/wishlistService'
import { sanitizeErrorMessage } from '../utils/errorHandler'

const WishlistContext = createContext(null)

export function WishlistProvider({ children }) {
  const { user } = useAuth()
  const [wishlistItems, setWishlistItems] = useState([])
  const [loading, setLoading] = useState(false)

  // Load wishlist items on auth state change
  useEffect(() => {
    let mounted = true
    const loadWishlist = async () => {
      setLoading(true)
      const { data } = await wishlistService.getWishlist(user?.id)
      if (mounted) {
        setWishlistItems(data || [])
        setLoading(false)
      }
    }
    loadWishlist()
    return () => {
      mounted = false
    }
  }, [user?.id])

  const toggleWishlist = useCallback(async (vehicle) => {
    const isSaved = wishlistItems.some(item => item.id === vehicle.id)
    const { wishlisted, success, error } = await wishlistService.toggleWishlist(user?.id, vehicle, isSaved)

    if (success) {
      if (wishlisted) {
        setWishlistItems(prev => [...prev, { ...vehicle, savedAt: new Date().toISOString() }])
        toast.success('Added to wishlist!')
      } else {
        setWishlistItems(prev => prev.filter(item => item.id !== vehicle.id))
        toast('Removed from wishlist', { icon: '💔' })
      }
    } else {
      toast.error(sanitizeErrorMessage(error, 'Could not update wishlist.'))
    }
  }, [wishlistItems, user?.id])

  const removeFromWishlist = useCallback(async (vehicleId) => {
    const { success, error } = await wishlistService.removeFromWishlist(user?.id, vehicleId)
    if (success) {
      setWishlistItems(prev => prev.filter(item => item.id !== vehicleId))
      toast('Removed from wishlist', { icon: '💔' })
    } else {
      toast.error(sanitizeErrorMessage(error, 'Could not remove from wishlist.'))
    }
  }, [user?.id])

  const isInWishlist = useCallback((vehicleId) => {
    return wishlistItems.some(item => item.id === vehicleId)
  }, [wishlistItems])

  const wishlistCount = wishlistItems.length

  return (
    <WishlistContext.Provider
      value={{
        wishlistItems,
        toggleWishlist,
        removeFromWishlist,
        isInWishlist,
        wishlistCount,
        loading,
      }}
    >
      {children}
    </WishlistContext.Provider>
  )
}

export function useWishlist() {
  const ctx = useContext(WishlistContext)
  if (!ctx) throw new Error('useWishlist must be used within WishlistProvider')
  return ctx
}
