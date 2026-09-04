import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { rateLimiter } from './rateLimiter'
import { validateEnquiryPayload, validateUUID } from '../utils/securityValidators'
import { sanitizeErrorMessage } from '../utils/errorHandler'

// Clean up any old hardcoded/local enquiry storage from previous sessions
try {
  if (typeof window !== 'undefined' && window.localStorage) {
    window.localStorage.removeItem('tsm_enquiries')
  }
} catch {
  // Ignore storage access errors
}

function isValidUUID(str) {
  return Boolean(validateUUID(str).valid)
}

export const enquiryService = {
  // Submit customer enquiry with strict validation, rate limiting, and sanitized errors
  async submitEnquiry({ userId, vehicleId, vehicleName, name, email, phone, message, preferredContact = 'phone' }) {
    // 1. Strict input schema validation
    const validation = validateEnquiryPayload({
      name,
      phone,
      email,
      message,
      vehicleId,
    })

    if (!validation.valid) {
      const firstError = Object.values(validation.errors)[0]
      return {
        success: false,
        error: new Error(firstError),
        validationErrors: validation.errors,
      }
    }

    // 2. Public rate limiting for enquiries
    const rateCheck = rateLimiter.checkPublicLimit('enquiry', phone || email || 'anon', 10 * 60 * 1000, 5)
    if (!rateCheck.allowed) {
      return {
        success: false,
        error: new Error(rateCheck.message),
        message: rateCheck.message,
      }
    }

    if (!isSupabaseConfigured) {
      return {
        success: false,
        error: new Error('Database service is not configured.'),
      }
    }

    const sanitizedUserId = isValidUUID(userId) ? userId : null
    const sanitizedVehicleId = isValidUUID(vehicleId) ? vehicleId : null

    try {
      // 1. Insert directly into Supabase 'enquiries' table
      const enquiryPayload = {
        name: name.trim(),
        phone: String(phone).replace(/\D/g, ''),
        message: typeof message === 'string' ? message.slice(0, 1000) : '',
        status: 'new',
      }
      if (sanitizedUserId) enquiryPayload.user_id = sanitizedUserId
      if (sanitizedVehicleId) enquiryPayload.vehicle_id = sanitizedVehicleId
      if (email && email.trim()) enquiryPayload.email = email.trim().toLowerCase()

      const { data, error: insertError } = await supabase
        .from('enquiries')
        .insert(enquiryPayload)
        .select()
        .single()

      if (insertError) {
        throw insertError
      }

      const inserted = data

      // 2. Trigger Email Notification via Supabase Edge Function if available
      let emailStatus = { sent: false, error: null }
      if (inserted?.id && isValidUUID(inserted.id)) {
        try {
          const { data: fnData, error: fnError } = await supabase.functions.invoke('send-enquiry-email', {
            body: { enquiry_id: inserted.id },
          })
          if (fnError) {
            console.warn('Edge function invoke error:', fnError)
            emailStatus.error = sanitizeErrorMessage(fnError, 'Notification email queued.')
          } else {
            emailStatus.sent = fnData?.customer_email_sent || fnData?.success || false
          }
        } catch (e) {
          console.warn('Email dispatch warning (enquiry was safely saved):', e)
          emailStatus.error = sanitizeErrorMessage(e, 'Notification pending.')
        }
      }

      return {
        success: true,
        enquiry: inserted,
        emailStatus,
      }
    } catch (err) {
      console.error('Enquiry submission error:', err)
      return {
        success: false,
        error: new Error(sanitizeErrorMessage(err, 'Failed to submit enquiry. Please try again.')),
      }
    }
  },

  // Fetch enquiries for a specific logged-in user from Supabase
  async getUserEnquiries(userId, userEmail) {
    if (!userId || !isSupabaseConfigured) {
      return { data: [], error: null }
    }

    try {
      let query = supabase
        .from('enquiries')
        .select(`
          *,
          vehicles:vehicle_id (name, brand, model, year, price)
        `)

      if (userId && userEmail) {
        query = query.or(`user_id.eq.${userId},email.ilike.${userEmail}`)
      } else if (userId) {
        query = query.eq('user_id', userId)
      } else if (userEmail) {
        query = query.ilike('email', userEmail)
      }

      query = query.order('created_at', { ascending: false })

      const { data, error } = await query

      if (error) {
        throw error
      }

      const formatted = (data || []).map(e => ({
        ...e,
        vehicleName: e.vehicles?.name || 'General Vehicle Enquiry',
        createdAt: e.created_at,
      }))

      return { data: formatted, error: null }
    } catch (err) {
      console.error('getUserEnquiries error:', err)
      return { data: [], error: err }
    }
  },

  // Fetch all enquiries directly from Supabase (Admin)
  async getAllEnquiries(statusFilter = '') {
    if (!isSupabaseConfigured) {
      return { data: [], error: null }
    }

    try {
      let query = supabase
        .from('enquiries')
        .select(`
          *,
          vehicles:vehicle_id (id, name, brand, model, year, price),
          email_logs (id, email_type, status, error_message, sent_at)
        `)
        .order('created_at', { ascending: false })

      if (statusFilter) {
        query = query.eq('status', statusFilter)
      }

      const { data, error } = await query
      if (error) {
        throw error
      }

      const formatted = (data || []).map(e => ({
        ...e,
        vehicleName: e.vehicles?.name || 'General Enquiry',
        createdAt: e.created_at,
        customerEmailLog: (e.email_logs || []).find(l => l.email_type === 'customer_confirmation'),
        adminEmailLog: (e.email_logs || []).find(l => l.email_type === 'admin_notification'),
      }))

      return { data: formatted, error: null }
    } catch (err) {
      console.error('getAllEnquiries error:', err)
      return { data: [], error: err }
    }
  },

  // Update enquiry status in Supabase (Admin)
  async updateEnquiryStatus(id, status) {
    if (!isSupabaseConfigured) {
      return { success: false, error: new Error('Database service is not configured.') }
    }

    try {
      const { error } = await supabase
        .from('enquiries')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', id)

      if (error) throw error
      return { success: true, error: null }
    } catch (err) {
      console.error('updateEnquiryStatus error:', err)
      return { success: false, error: err }
    }
  },

  // Delete enquiry directly from Supabase (Admin)
  async deleteEnquiry(id) {
    if (!isSupabaseConfigured) {
      return { success: false, error: new Error('Database service is not configured.') }
    }

    try {
      const { error } = await supabase.from('enquiries').delete().eq('id', id)
      if (error) throw error
      return { success: true, error: null }
    } catch (err) {
      console.error('deleteEnquiry error:', err)
      return { success: false, error: err }
    }
  },

  // Retry sending email notification via Edge Function (Admin)
  async retryEmail(enquiryId) {
    if (!isSupabaseConfigured) return { success: false, error: new Error('Supabase not configured') }
    try {
      const { data, error } = await supabase.functions.invoke('send-enquiry-email', {
        body: { enquiry_id: enquiryId },
      })
      if (error) throw error
      return { success: true, data }
    } catch (err) {
      return { success: false, error: err }
    }
  },
}
