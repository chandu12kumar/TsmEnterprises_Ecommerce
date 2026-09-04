import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import toast from 'react-hot-toast'
import { SECURITY_CONFIG } from '../config/securityConfig'
import { rateLimiter } from '../services/rateLimiter'
import {
  validateEmail,
  validatePassword,
  validateName,
  validatePhone,
  validateCity,
} from '../utils/securityValidators'
import { sanitizeErrorMessage } from '../utils/errorHandler'

const AuthContext = createContext(null)

const AUTH_KEY = 'tsm_auth_user'
const USERS_KEY = 'tsm_registered_users'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  // Fetch profile from Supabase
  const fetchProfile = async (userId) => {
    if (!isSupabaseConfigured || !userId) return null
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle()
      if (error) throw error
      return data
    } catch (err) {
      console.warn('Profile fetch warning:', err)
      return null
    }
  }

  // Load session & attach onAuthStateChange
  useEffect(() => {
    let subscription = null

    const initAuth = async () => {
      if (isSupabaseConfigured) {
        try {
          const { data: { session } } = await supabase.auth.getSession()
          if (session?.user) {
            const isConfirmed = Boolean(session.user.email_confirmed_at || session.user.app_metadata?.provider !== 'email')
            if (isConfirmed) {
              setUser(session.user)
              const prof = await fetchProfile(session.user.id)
              setProfile(prof)
            } else {
              // Unconfirmed email session — purge to prevent unauthorized client state
              await supabase.auth.signOut({ scope: 'local' })
              setUser(null)
              setProfile(null)
              localStorage.removeItem(AUTH_KEY)
            }
          } else {
            // Check localStorage demo session
            const stored = localStorage.getItem(AUTH_KEY)
            if (stored) {
              const parsed = JSON.parse(stored)
              setUser(parsed)
              setProfile(parsed)
            }
          }

          const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (event === 'PASSWORD_RECOVERY') {
              // Recovery session active for password reset — do not purge or redirect
              return
            }

            if (session?.user) {
              const isConfirmed = Boolean(session.user.email_confirmed_at || session.user.app_metadata?.provider !== 'email')
              if (isConfirmed) {
                setUser(session.user)
                const prof = await fetchProfile(session.user.id)
                setProfile(prof)
              } else {
                setUser(null)
                setProfile(null)
                localStorage.removeItem(AUTH_KEY)
              }
            } else if (event === 'SIGNED_OUT') {
              setUser(null)
              setProfile(null)
              localStorage.removeItem(AUTH_KEY)
            }
          })
          subscription = authListener?.subscription
        } catch (err) {
          console.warn('Auth init fallback:', err)
        }
      } else {
        // Local demo mode
        const stored = localStorage.getItem(AUTH_KEY)
        if (stored) {
          try {
            const parsed = JSON.parse(stored)
            setUser(parsed)
            setProfile(parsed)
          } catch {}
        }
      }
      setLoading(false)
    }

    initAuth()

    return () => {
      if (subscription) subscription.unsubscribe()
    }
  }, [])

  // Login with rate limiting, strict validation, and error sanitization
  const login = useCallback(async (email, password) => {
    // 1. Strict input schema validation
    const emailVal = validateEmail(email)
    if (!emailVal.valid) {
      return { success: false, error: emailVal.error }
    }
    const pwVal = validatePassword(password)
    if (!pwVal.valid) {
      return { success: false, error: pwVal.error }
    }
    const cleanEmail = emailVal.value

    // 2. Auth rate limiting with exponential backoff
    const rateCheck = rateLimiter.checkAuthLimit('login', cleanEmail)
    if (!rateCheck.allowed) {
      return { success: false, error: rateCheck.message }
    }

    // 3. Demo admin authentication (strictly restricted to DEV if enabled in environment)
    if (
      SECURITY_CONFIG.DEMO_AUTH.ENABLED &&
      SECURITY_CONFIG.DEMO_AUTH.ADMIN_PASSWORD &&
      cleanEmail === SECURITY_CONFIG.DEMO_AUTH.ADMIN_EMAIL &&
      password === SECURITY_CONFIG.DEMO_AUTH.ADMIN_PASSWORD
    ) {
      rateLimiter.recordAuthSuccess('login', cleanEmail)
      const adminUser = {
        id: 'admin-1',
        name: 'TSM Admin',
        full_name: 'TSM Admin',
        email: cleanEmail,
        phone: '9876543210',
        city: 'Salem, Tamil Nadu',
        role: 'admin',
      }
      setUser(adminUser)
      setProfile(adminUser)
      localStorage.setItem(AUTH_KEY, JSON.stringify(adminUser))
      return { success: true, user: adminUser }
    }

    // 4. Supabase Authentication
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        })

        if (error) {
          rateLimiter.recordAuthFailure('login', cleanEmail)
          const msg = sanitizeErrorMessage(error, 'Incorrect email or password.')
          if (msg.toLowerCase().includes('email not confirmed') || error.code === 'email_not_confirmed') {
            return {
              success: false,
              needsEmailConfirmation: true,
              email: cleanEmail,
              error: 'Please verify your email address before logging in. Check your inbox for the confirmation link.',
            }
          }
          return { success: false, error: msg }
        }

        // Verify that user's email has been confirmed
        const isConfirmed = Boolean(data.user?.email_confirmed_at || data.user?.app_metadata?.provider !== 'email')
        if (!isConfirmed) {
          await supabase.auth.signOut({ scope: 'local' })
          return {
            success: false,
            needsEmailConfirmation: true,
            email: cleanEmail,
            error: 'Please verify your email address before logging in. Check your inbox for the confirmation link.',
          }
        }

        rateLimiter.recordAuthSuccess('login', cleanEmail)
        const prof = await fetchProfile(data.user.id)
        setUser(data.user)
        setProfile(prof)
        return { success: true, user: data.user, profile: prof }
      } catch (err) {
        rateLimiter.recordAuthFailure('login', cleanEmail)
        return { success: false, error: sanitizeErrorMessage(err, 'Login failed. Please try again.') }
      }
    }

    // 5. Fallback demo registration check (local dev offline fallback only)
    if (import.meta.env.DEV) {
      const localUsers = JSON.parse(localStorage.getItem(USERS_KEY) || '[]')
      const found = localUsers.find(u => u.email === cleanEmail)
      if (!found) {
        rateLimiter.recordAuthFailure('login', cleanEmail)
        return { success: false, error: 'No account found with this email.' }
      }
      if (found.password !== btoa(password)) {
        rateLimiter.recordAuthFailure('login', cleanEmail)
        return { success: false, error: 'Incorrect password.' }
      }

      rateLimiter.recordAuthSuccess('login', cleanEmail)
      const { password: _p, ...safeUser } = found
      setUser(safeUser)
      setProfile(safeUser)
      localStorage.setItem(AUTH_KEY, JSON.stringify(safeUser))
      return { success: true, user: safeUser }
    }

    return { success: false, error: 'Authentication service is unavailable.' }
  }, [])

  // Register with rate limiting, strict validation, and error sanitization
  const register = useCallback(async ({ name, email, phone, city, password }) => {
    // 1. Strict schema validation on all registration fields
    const nameVal = validateName(name)
    if (!nameVal.valid) return { success: false, error: nameVal.error }

    const emailVal = validateEmail(email)
    if (!emailVal.valid) return { success: false, error: emailVal.error }
    const cleanEmail = emailVal.value

    const phoneVal = validatePhone(phone)
    if (!phoneVal.valid) return { success: false, error: phoneVal.error }

    const cityVal = validateCity(city)
    if (!cityVal.valid) return { success: false, error: cityVal.error }

    const pwVal = validatePassword(password)
    if (!pwVal.valid) return { success: false, error: pwVal.error }

    // 2. Auth rate limiting
    const rateCheck = rateLimiter.checkAuthLimit('register', cleanEmail)
    if (!rateCheck.allowed) {
      return { success: false, error: rateCheck.message }
    }

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.auth.signUp({
          email: cleanEmail,
          password,
          options: {
            data: {
              full_name: nameVal.value,
              phone: phoneVal.value,
              city: cityVal.value,
            },
            emailRedirectTo: `${window.location.origin}/account`,
          },
        })

        if (error) {
          rateLimiter.recordAuthFailure('register', cleanEmail)
          return { success: false, error: sanitizeErrorMessage(error, 'Registration failed. Please try again.') }
        }

        rateLimiter.recordAuthSuccess('register', cleanEmail)

        // Require email confirmation before user is logged in
        const isEmailConfirmed = Boolean(data.session && data.user?.email_confirmed_at)

        if (!isEmailConfirmed) {
          setUser(null)
          setProfile(null)
          localStorage.removeItem(AUTH_KEY)

          if (data.user?.id) {
            try {
              await supabase.from('profiles').upsert({
                id: data.user.id,
                full_name: nameVal.value,
                email: cleanEmail,
                phone: phoneVal.value,
                city: cityVal.value,
                role: 'customer',
              })
            } catch (pErr) {
              console.warn('Profile pre-registration warning:', pErr)
            }
          }

          return {
            success: true,
            needsEmailConfirmation: true,
            email: cleanEmail,
            user: data.user,
            message: 'Account created! Please check your email to confirm your account before logging in.',
          }
        }

        if (data.user) {
          await supabase.from('profiles').upsert({
            id: data.user.id,
            full_name: nameVal.value,
            email: cleanEmail,
            phone: phoneVal.value,
            city: cityVal.value,
            role: 'customer',
          })

          const prof = await fetchProfile(data.user.id)
          setUser(data.user)
          setProfile(prof)
        }

        return { success: true, needsEmailConfirmation: false, user: data.user }
      } catch (err) {
        rateLimiter.recordAuthFailure('register', cleanEmail)
        return { success: false, error: sanitizeErrorMessage(err, 'Registration failed.') }
      }
    }

    // Fallback demo register (local dev only)
    if (import.meta.env.DEV) {
      const localUsers = JSON.parse(localStorage.getItem(USERS_KEY) || '[]')
      if (localUsers.find(u => u.email === cleanEmail)) {
        rateLimiter.recordAuthFailure('register', cleanEmail)
        return { success: false, error: 'An account with this email already exists.' }
      }

      rateLimiter.recordAuthSuccess('register', cleanEmail)
      const newUser = {
        id: `user-${Date.now()}`,
        name: nameVal.value,
        full_name: nameVal.value,
        email: cleanEmail,
        phone: phoneVal.value,
        city: cityVal.value,
        password: btoa(password),
        role: 'customer',
        createdAt: new Date().toISOString(),
      }
      localUsers.push(newUser)
      localStorage.setItem(USERS_KEY, JSON.stringify(localUsers))

      const { password: _p, ...safeUser } = newUser
      setUser(safeUser)
      setProfile(safeUser)
      localStorage.setItem(AUTH_KEY, JSON.stringify(safeUser))
      return { success: true, needsEmailConfirmation: false, user: safeUser }
    }

    return { success: false, error: 'Registration service is unavailable.' }
  }, [])

  // Resend Email Verification
  const resendVerificationEmail = useCallback(async (email) => {
    if (!isSupabaseConfigured || !email) {
      return { success: false, error: 'Email address is required.' }
    }
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/account`,
        },
      })
      if (error) throw error
      return { success: true }
    } catch (err) {
      return { success: false, error: err.message || 'Could not resend verification email.' }
    }
  }, [])

  // Logout
  const logout = useCallback(async () => {
    try {
      if (isSupabaseConfigured) {
        await supabase.auth.signOut({ scope: 'local' })
      }
    } catch (err) {
      console.warn('Sign out warning:', err)
    } finally {
      setUser(null)
      setProfile(null)
      localStorage.removeItem(AUTH_KEY)
      try {
        Object.keys(localStorage).forEach(key => {
          if (key.startsWith('sb-') && key.endsWith('-auth-token')) {
            localStorage.removeItem(key)
          }
        })
      } catch {}
      toast.success('Logged out successfully')
    }
  }, [])

  // Update Profile
  const updateProfile = useCallback(async ({ name, phone, city }) => {
    if (!user) return

    if (isSupabaseConfigured && user.id) {
      try {
        const { error } = await supabase
          .from('profiles')
          .upsert({
            id: user.id,
            full_name: name,
            email: user.email,
            phone,
            city,
            updated_at: new Date().toISOString(),
          })

        if (error) throw error
        const prof = await fetchProfile(user.id)
        setProfile(prof)
      } catch (err) {
        console.warn('Profile update warning:', err)
      }
    }

    const updated = {
      ...user,
      name,
      full_name: name,
      phone,
      city,
    }
    setUser(updated)
    setProfile(prev => ({ ...prev, ...updated }))
    localStorage.setItem(AUTH_KEY, JSON.stringify(updated))
    return updated
  }, [user])

  // Secure account existence check (pre-reset verification)
  const checkUserEmail = useCallback(async (email) => {
    // 1. Strict schema validation
    const emailVal = validateEmail(email)
    if (!emailVal.valid) {
      return { exists: false, error: emailVal.error }
    }
    const cleanEmail = emailVal.value

    // 2. Public rate limiting for email lookups
    const rateCheck = rateLimiter.checkPublicLimit('check_email', cleanEmail, 60000, 15)
    if (!rateCheck.allowed) {
      return { exists: false, error: rateCheck.message }
    }

    // 3. Demo admin check (restricted to DEV if enabled)
    if (
      SECURITY_CONFIG.DEMO_AUTH.ENABLED &&
      cleanEmail === SECURITY_CONFIG.DEMO_AUTH.ADMIN_EMAIL
    ) {
      return { exists: true }
    }

    // 4. Local fallback (DEV only)
    if (import.meta.env.DEV) {
      const localUsers = JSON.parse(localStorage.getItem(USERS_KEY) || '[]')
      if (localUsers.some(u => (u.email || '').toLowerCase() === cleanEmail)) {
        return { exists: true }
      }
    }

    // 5. Supabase checks
    if (isSupabaseConfigured) {
      // Tier A: Supabase Edge Function check-user-email
      try {
        const { data, error } = await supabase.functions.invoke('check-user-email', {
          body: { email: cleanEmail },
        })
        if (!error && data && typeof data.exists === 'boolean') {
          return { exists: data.exists }
        }
      } catch (fnErr) {
        console.warn('Edge function check-user-email notice:', fnErr)
      }

      // Tier B: Supabase RPC check_user_exists
      try {
        const { data: rpcData, error: rpcErr } = await supabase.rpc('check_user_exists', {
          lookup_email: cleanEmail,
        })
        if (!rpcErr && typeof rpcData === 'boolean') {
          return { exists: rpcData }
        }
      } catch (rpcErr) {
        console.warn('RPC check_user_exists notice:', rpcErr)
      }

      // Tier C: Supabase public.profiles table check
      try {
        const { data: profData, error: profErr } = await supabase
          .from('profiles')
          .select('id')
          .ilike('email', cleanEmail)
          .maybeSingle()
        if (!profErr && profData?.id) {
          return { exists: true }
        }
      } catch (profErr) {
        console.warn('Profiles check notice:', profErr)
      }

      return { exists: false }
    }

    return { exists: false }
  }, [])

  // Send Supabase Password Recovery Email with rate limiting & error sanitization
  const sendPasswordReset = useCallback(async (email) => {
    // 1. Strict input validation
    const emailVal = validateEmail(email)
    if (!emailVal.valid) {
      return { success: false, error: emailVal.error }
    }
    const cleanEmail = emailVal.value

    // 2. Auth rate limiting with exponential backoff
    const rateCheck = rateLimiter.checkAuthLimit('forgot_password', cleanEmail)
    if (!rateCheck.allowed) {
      return { success: false, error: rateCheck.message }
    }

    if (isSupabaseConfigured) {
      try {
        const redirectTo = `${window.location.origin}/reset-password`
        const { data, error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
          redirectTo,
        })

        if (error) {
          rateLimiter.recordAuthFailure('forgot_password', cleanEmail)
          return { success: false, error: sanitizeErrorMessage(error, 'Unable to send reset email. Please try again.') }
        }

        rateLimiter.recordAuthSuccess('forgot_password', cleanEmail)
        return { success: true, data }
      } catch (err) {
        rateLimiter.recordAuthFailure('forgot_password', cleanEmail)
        return { success: false, error: sanitizeErrorMessage(err, 'Unable to send reset email. Please try again.') }
      }
    }

    // Demo mode simulation
    rateLimiter.recordAuthSuccess('forgot_password', cleanEmail)
    return { success: true, demo: true }
  }, [])

  // Update Password in Supabase Auth with rate limiting & error sanitization
  const updateUserPassword = useCallback(async (newPassword) => {
    // 1. Strict password validation
    const pwVal = validatePassword(newPassword)
    if (!pwVal.valid) {
      return { success: false, error: pwVal.error }
    }

    // 2. Rate limiting check
    const rateCheck = rateLimiter.checkAuthLimit('reset_password', 'active_session')
    if (!rateCheck.allowed) {
      return { success: false, error: rateCheck.message }
    }

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.auth.updateUser({
          password: pwVal.value,
        })

        if (error) {
          rateLimiter.recordAuthFailure('reset_password', 'active_session')
          let msg = sanitizeErrorMessage(error, 'Unable to update password. Please try again.')
          let isExpired = false
          const lower = (error.message || '').toLowerCase()
          if (lower.includes('expired') || lower.includes('invalid') || error.code === 'otp_expired') {
            msg = 'This reset link has expired. Please request a new one.'
            isExpired = true
          } else if (lower.includes('same password')) {
            msg = 'New password cannot be the same as the old password.'
          }
          return { success: false, error: msg, isExpired }
        }

        rateLimiter.recordAuthSuccess('reset_password', 'active_session')

        // Clean up temporary recovery session so user can log in with new password
        try {
          await supabase.auth.signOut({ scope: 'local' })
        } catch {}
        setUser(null)
        setProfile(null)
        localStorage.removeItem(AUTH_KEY)

        return { success: true, data }
      } catch (err) {
        rateLimiter.recordAuthFailure('reset_password', 'active_session')
        return { success: false, error: sanitizeErrorMessage(err, 'Something went wrong. Please try again.') }
      }
    }

    // Demo mode simulation: update local user or admin
    rateLimiter.recordAuthSuccess('reset_password', 'active_session')
    return { success: true, demo: true }
  }, [])

  const isAdmin = profile?.role === 'admin' || user?.role === 'admin'

  // Standardized user name & phone for components
  const activeUser = user ? {
    ...user,
    name: profile?.full_name || user.user_metadata?.full_name || user.name || user.email?.split('@')[0] || 'Customer',
    email: user.email,
    phone: profile?.phone || user.user_metadata?.phone || user.phone || '',
    city: profile?.city || user.user_metadata?.city || user.city || '',
    role: profile?.role || user.role || 'customer',
    email_confirmed_at: user.email_confirmed_at,
  } : null

  return (
    <AuthContext.Provider
      value={{
        user: activeUser,
        profile,
        loading,
        isAdmin,
        login,
        register,
        resendVerificationEmail,
        logout,
        updateProfile,
        checkUserEmail,
        sendPasswordReset,
        updateUserPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
