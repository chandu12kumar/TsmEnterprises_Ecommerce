import { supabase, isSupabaseConfigured } from '../lib/supabase'

const LOCAL_WISHLIST_KEY = 'tsm_wishlist'

function getLocalWishlist(userId) {
  const key = userId ? `${LOCAL_WISHLIST_KEY}_${userId}` : LOCAL_WISHLIST_KEY
  try {
    return JSON.parse(localStorage.getItem(key) || '[]')
  } catch {
    return []
  }
}

function saveLocalWishlist(userId, items) {
  const key = userId ? `${LOCAL_WISHLIST_KEY}_${userId}` : LOCAL_WISHLIST_KEY
  localStorage.setItem(key, JSON.stringify(items))
}

export const wishlistService = {
  // Fetch user wishlist
  async getWishlist(userId) {
    if (!userId || !isSupabaseConfigured) {
      return { data: getLocalWishlist(userId), error: null }
    }

    try {
      const { data, error } = await supabase
        .from('wishlist')
        .select(`
          id,
          created_at,
          vehicle:vehicle_id (
            id, name, category, brand, model, year, price, fuel_type,
            km_driven, location, condition, status,
            vehicle_images (image_url)
          )
        `)
        .eq('user_id', userId)

      if (error) throw error

      const normalized = (data || []).map(item => {
        const v = item.vehicle || {}
        return {
          wishlistItemId: item.id,
          id: v.id,
          name: v.name,
          category: v.category,
          brand: v.brand,
          model: v.model,
          year: v.year,
          price: v.price,
          fuelType: v.fuel_type,
          kmDriven: v.km_driven,
          location: v.location,
          condition: v.condition,
          status: v.status,
          images: v.vehicle_images && v.vehicle_images.length > 0
            ? v.vehicle_images.map(img => img.image_url)
            : ['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=600&fit=crop'],
        }
      })

      return { data: normalized, error: null }
    } catch (err) {
      console.warn('Wishlist fetch fallback to local:', err)
      return { data: getLocalWishlist(userId), error: err }
    }
  },

  // Add to wishlist
  async addToWishlist(userId, vehicle) {
    if (!userId || !isSupabaseConfigured) {
      const items = getLocalWishlist(userId)
      if (items.some(i => i.id === vehicle.id)) return { success: true, error: null }
      const newItems = [...items, { ...vehicle, savedAt: new Date().toISOString() }]
      saveLocalWishlist(userId, newItems)
      return { success: true, error: null }
    }

    try {
      const { error } = await supabase
        .from('wishlist')
        .insert({
          user_id: userId,
          vehicle_id: vehicle.id,
        })

      if (error && error.code !== '23505') throw error
      return { success: true, error: null }
    } catch (err) {
      return { success: false, error: err }
    }
  },

  // Remove from wishlist
  async removeFromWishlist(userId, vehicleId) {
    if (!userId || !isSupabaseConfigured) {
      const items = getLocalWishlist(userId)
      const updated = items.filter(i => i.id !== vehicleId)
      saveLocalWishlist(userId, updated)
      return { success: true, error: null }
    }

    try {
      const { error } = await supabase
        .from('wishlist')
        .delete()
        .eq('user_id', userId)
        .eq('vehicle_id', vehicleId)

      if (error) throw error
      return { success: true, error: null }
    } catch (err) {
      return { success: false, error: err }
    }
  },

  // Toggle wishlist state
  async toggleWishlist(userId, vehicle, isCurrentlyWishlisted) {
    if (isCurrentlyWishlisted) {
      const res = await this.removeFromWishlist(userId, vehicle.id)
      return { wishlisted: false, ...res }
    } else {
      const res = await this.addToWishlist(userId, vehicle)
      return { wishlisted: true, ...res }
    }
  }
}
