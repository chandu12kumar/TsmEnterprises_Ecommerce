import { supabase, isSupabaseConfigured } from '../lib/supabase'

const LOCAL_CUSTOMERS_KEY = 'tsm_registered_users'

function getLocalCustomers() {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_CUSTOMERS_KEY) || '[]')
  } catch {
    return []
  }
}

export const customerService = {
  // Fetch all registered customers (Admin)
  async getCustomers(searchTerm = '') {
    if (!isSupabaseConfigured) {
      let all = getLocalCustomers()
      if (searchTerm) {
        const term = searchTerm.toLowerCase()
        all = all.filter(c =>
          (c.name || c.full_name || '').toLowerCase().includes(term) ||
          (c.email || '').toLowerCase().includes(term) ||
          (c.phone || '').includes(term) ||
          (c.city || '').toLowerCase().includes(term)
        )
      }
      return { data: all, error: null }
    }

    try {
      let query = supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })

      if (searchTerm) {
        query = query.or(`full_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%,city.ilike.%${searchTerm}%`)
      }

      const { data, error } = await query
      if (error) throw error

      const normalized = (data || []).map(p => ({
        ...p,
        name: p.full_name || p.name || 'Anonymous Customer',
        createdAt: p.created_at,
      }))

      return { data: normalized, error: null }
    } catch (err) {
      return { data: getLocalCustomers(), error: err }
    }
  }
}
