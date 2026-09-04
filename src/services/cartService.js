import { supabase, isSupabaseConfigured } from '../lib/supabase'

const LOCAL_CART_KEY = 'tsm_cart'

function getLocalCart(userId) {
  const key = userId ? `${LOCAL_CART_KEY}_${userId}` : LOCAL_CART_KEY
  try {
    return JSON.parse(localStorage.getItem(key) || '[]')
  } catch {
    return []
  }
}

function saveLocalCart(userId, items) {
  const key = userId ? `${LOCAL_CART_KEY}_${userId}` : LOCAL_CART_KEY
  localStorage.setItem(key, JSON.stringify(items))
}

/** Returns true if a Supabase error is an RLS / permission denial */
function isRlsError(err) {
  if (!err) return false
  return (
    err.code === '42501' ||
    (err.message || '').toLowerCase().includes('row-level security') ||
    (err.message || '').toLowerCase().includes('violates row-level') ||
    (err.message || '').toLowerCase().includes('security policy')
  )
}

export const cartService = {
  // Fetch cart items for current user
  async getCart(userId) {
    if (!userId || !isSupabaseConfigured) {
      return { data: getLocalCart(userId), error: null }
    }

    try {
      const { data, error } = await supabase
        .from('cart_items')
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

      // RLS blocked read — fall back to localStorage
      if (error && isRlsError(error)) {
        console.warn('RLS blocked cart read — using localStorage fallback.')
        return { data: getLocalCart(userId), error: null }
      }

      if (error) throw error

      const normalized = (data || []).map(item => {
        const v = item.vehicle || {}
        return {
          cartItemId: item.id,
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
      console.warn('Cart fetch fallback to local:', err)
      return { data: getLocalCart(userId), error: err }
    }
  },

  // Add vehicle to cart
  async addToCart(userId, vehicle) {
    if (vehicle.status === 'sold') {
      return { success: false, error: new Error('This vehicle has already been sold.') }
    }

    if (!userId || !isSupabaseConfigured) {
      const items = getLocalCart(userId)
      if (items.some(i => i.id === vehicle.id)) {
        return { success: false, duplicate: true, error: new Error('This vehicle is already in your cart.') }
      }
      const newItems = [...items, { ...vehicle, addedAt: new Date().toISOString() }]
      saveLocalCart(userId, newItems)
      return { success: true, error: null }
    }

    try {
      // 1. Verify availability in DB
      const { data: vData } = await supabase
        .from('vehicles')
        .select('status')
        .eq('id', vehicle.id)
        .maybeSingle()

      if (vData && vData.status === 'sold') {
        return { success: false, error: new Error('This vehicle has already been sold.') }
      }

      // 2. Insert into cart_items
      const { error } = await supabase
        .from('cart_items')
        .insert({
          user_id: userId,
          vehicle_id: vehicle.id,
        })

      if (error) {
        // Unique constraint — already in cart
        if (error.code === '23505') {
          return { success: false, duplicate: true, error: new Error('This vehicle is already in your cart.') }
        }

        // RLS policy violation — fall back to localStorage so cart still works
        if (isRlsError(error)) {
          console.warn('RLS blocked cart INSERT — using localStorage fallback. Fix cart_items INSERT policy in Supabase Dashboard.')
          const items = getLocalCart(userId)
          if (items.some(i => i.id === vehicle.id)) {
            return { success: false, duplicate: true, error: new Error('This vehicle is already in your cart.') }
          }
          saveLocalCart(userId, [...items, { ...vehicle, addedAt: new Date().toISOString() }])
          return { success: true, error: null }
        }

        throw error
      }

      return { success: true, error: null }
    } catch (err) {
      return { success: false, error: err }
    }
  },

  // Remove vehicle from cart
  async removeFromCart(userId, vehicleId) {
    if (!userId || !isSupabaseConfigured) {
      const items = getLocalCart(userId)
      const updated = items.filter(i => i.id !== vehicleId)
      saveLocalCart(userId, updated)
      return { success: true, error: null }
    }

    try {
      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('user_id', userId)
        .eq('vehicle_id', vehicleId)

      if (error) throw error
      return { success: true, error: null }
    } catch (err) {
      return { success: false, error: err }
    }
  },

  // Clear user cart
  async clearCart(userId) {
    if (!userId || !isSupabaseConfigured) {
      saveLocalCart(userId, [])
      return { success: true, error: null }
    }

    try {
      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('user_id', userId)

      if (error) throw error
      return { success: true, error: null }
    } catch (err) {
      return { success: false, error: err }
    }
  }
}
