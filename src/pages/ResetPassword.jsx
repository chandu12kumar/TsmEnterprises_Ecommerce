import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { FiLock, FiEye, FiEyeOff, FiCheckCircle, FiAlertCircle, FiArrowLeft, FiRefreshCw } from 'react-icons/fi'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { validatePassword } from '../utils/securityValidators'
import { sanitizeErrorMessage } from '../utils/errorHandler'
import toast from 'react-hot-toast'

export default function ResetPassword() {
  const { updateUserPassword } = useAuth()
  const navigate = useNavigate()

  // State: 'checking' | 'valid' | 'invalid' | 'success'
  const [sessionState, setSessionState] = useState('checking')
  const [errorMessage, setErrorMessage] = useState('')

  // Form states
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [showConfirmPw, setShowConfirmPw] = useState(false)
  const [formErrors, setFormErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)

  const checkTimeoutRef = useRef(null)

  useEffect(() => {
    // 1. Inspect URL parameters for Supabase Auth errors
    const hash = window.location.hash || ''
    const search = window.location.search || ''
    const fullParams = new URLSearchParams(search || hash.replace(/^#/, ''))

    const errorParam = fullParams.get('error') || (hash.includes('error=') ? 'error' : null)
    const errorCode = fullParams.get('error_code') || ''
    const errorDescription = fullParams.get('error_description') || ''

    if (errorParam || errorCode === 'otp_expired' || errorDescription.toLowerCase().includes('expired')) {
      setErrorMessage(
        errorCode === 'otp_expired' || errorDescription.toLowerCase().includes('expired')
          ? 'This reset link has expired. Please request a new one.'
          : 'This password reset link is invalid or has already been used.'
      )
      setSessionState('invalid')
      return
    }

    // 2. Demo mode check
    if (!isSupabaseConfigured) {
      setSessionState('valid')
      return
    }

    let authSubscription = null

    // 3. Listen to Supabase Auth state changes (PASSWORD_RECOVERY event)
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' || (session?.user && (hash.includes('type=recovery') || search.includes('type=recovery')))) {
        if (checkTimeoutRef.current) clearTimeout(checkTimeoutRef.current)
        setSessionState('valid')
      }
    })
    authSubscription = listener?.subscription

    // 4. Also check active session immediately
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        setSessionState('invalid')
        setErrorMessage('Unable to verify reset link. Please request a new link.')
        return
      }

      if (session?.user) {
        // Has active session (e.g. established by recovery token in URL hash)
        setSessionState('valid')
      } else if (hash.includes('type=recovery') || search.includes('type=recovery') || hash.includes('access_token')) {
        // Token in URL hash being processed by Supabase client; give it a moment
        checkTimeoutRef.current = setTimeout(() => {
          supabase.auth.getSession().then(({ data: { session: retrySession } }) => {
            if (retrySession?.user) {
              setSessionState('valid')
            } else {
              setSessionState('invalid')
              setErrorMessage('This password reset link is no longer valid.')
            }
          })
        }, 1200)
      } else {
        // No recovery session and no recovery tokens in URL
        checkTimeoutRef.current = setTimeout(() => {
          setSessionState('invalid')
          setErrorMessage('No active password reset session was found.')
        }, 800)
      }
    })

    return () => {
      if (authSubscription) authSubscription.unsubscribe()
      if (checkTimeoutRef.current) clearTimeout(checkTimeoutRef.current)
    }
  }, [])

  // Form Validation with strict schema
  const validateForm = () => {
    const errs = {}

    const pwVal = validatePassword(password)
    if (!pwVal.valid) {
      errs.password = pwVal.error
    }

    if (!confirmPassword) {
      errs.confirmPassword = 'Password confirmation is required.'
    } else if (password !== confirmPassword) {
      errs.confirmPassword = 'Passwords do not match.'
    }

    setFormErrors(errs)
    return Object.keys(errs).length === 0
  }

  // Handle password submission
  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateForm()) return

    setSubmitting(true)

    try {
      const result = await updateUserPassword(password)

      if (result.success) {
        setSessionState('success')
        toast.success('Password updated successfully!')

        // Automatically redirect to login after a short delay
        setTimeout(() => {
          navigate('/login')
        }, 4000)
      } else {
        if (result.isExpired) {
          setSessionState('invalid')
          setErrorMessage(sanitizeErrorMessage(result.error, 'This reset link has expired. Please request a new one.'))
        } else {
          const friendlyError = sanitizeErrorMessage(result.error, 'Unable to update password. Please try again.')
          setFormErrors({ submit: friendlyError })
          toast.error(friendlyError)
        }
      }
    } catch (err) {
      const friendlyError = sanitizeErrorMessage(err, 'Something went wrong. Please try again.')
      setFormErrors({ submit: friendlyError })
      toast.error(friendlyError)
    } finally {
      setSubmitting(false)
    }
  }


  return (
    <div className="pt-20 min-h-screen bg-tsm-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-card overflow-hidden border border-gray-100">
          {/* Header Banner */}
          <div className="bg-tsm-navy-900 px-8 py-8 text-center relative">
            <div className="w-16 h-16 bg-tsm-red-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-btn">
              <FiLock size={28} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white font-display">Reset Password</h1>
            <p className="text-tsm-navy-300 text-sm mt-1.5 max-w-xs mx-auto">
              Create a new password for your account.
            </p>
          </div>

          <div className="p-6 sm:p-8">
            {/* 1. Checking Session State */}
            {sessionState === 'checking' && (
              <div className="py-10 text-center space-y-3">
                <div className="w-12 h-12 border-4 border-tsm-red-600/30 border-t-tsm-red-600 rounded-full animate-spin mx-auto" />
                <p className="text-sm font-semibold text-tsm-navy-900">Verifying reset session...</p>
                <p className="text-xs text-gray-500">Please wait while we validate your recovery link.</p>
              </div>
            )}

            {/* 2. Invalid / Expired Link State */}
            {sessionState === 'invalid' && (
              <div className="text-center space-y-4 animate-fade-in">
                <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto border border-red-200">
                  <FiAlertCircle size={32} />
                </div>
                <h2 className="text-xl font-bold text-tsm-navy-900 font-display">
                  Reset Link Invalid or Expired
                </h2>
                <p className="text-sm text-gray-600 leading-relaxed max-w-sm mx-auto">
                  {errorMessage || 'This password reset link is no longer valid.'}
                </p>
                <p className="text-xs text-gray-500">
                  Please request a new password reset link.
                </p>
                <div className="pt-4 space-y-2">
                  <Link
                    to="/forgot-password"
                    className="w-full py-3.5 bg-tsm-red-600 text-white font-bold rounded-xl hover:bg-tsm-red-700 transition-all flex items-center justify-center gap-2 text-sm shadow-btn"
                  >
                    <FiRefreshCw size={15} /> Forgot Password
                  </Link>
                  <Link
                    to="/login"
                    className="w-full py-3 border border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-all flex items-center justify-center gap-2 text-sm"
                  >
                    <FiArrowLeft size={14} /> Back to Login
                  </Link>
                </div>
              </div>
            )}

            {/* 3. Password Reset Successful State */}
            {sessionState === 'success' && (
              <div className="text-center space-y-4 animate-fade-in">
                <div className="w-16 h-16 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto border border-green-200">
                  <FiCheckCircle size={32} />
                </div>
                <h2 className="text-xl font-bold text-tsm-navy-900 font-display">
                  Password Reset Successful
                </h2>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Your password has been updated successfully.
                </p>
                <p className="text-xs text-gray-500">
                  You can now log in using your new password.
                </p>
                <div className="pt-4">
                  <Link
                    to="/login"
                    className="w-full py-3.5 bg-tsm-red-600 text-white font-bold rounded-xl hover:bg-tsm-red-700 transition-all flex items-center justify-center gap-2 text-sm shadow-btn"
                  >
                    Login Now
                  </Link>
                  <p className="text-xs text-gray-400 mt-3">Redirecting to login automatically...</p>
                </div>
              </div>
            )}

            {/* 4. Valid Session: Show Password Update Form */}
            {sessionState === 'valid' && (
              <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                {formErrors.submit && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-700 flex items-center gap-2">
                    <FiAlertCircle size={16} className="text-red-500 flex-shrink-0" />
                    <span>{formErrors.submit}</span>
                  </div>
                )}

                {/* New Password */}
                <div>
                  <label className="form-label" htmlFor="new-password">
                    New Password
                  </label>
                  <div className="relative">
                    <FiLock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      id="new-password"
                      type={showPw ? 'text' : 'password'}
                      className={`form-input pl-10 pr-10 ${formErrors.password ? 'border-red-400 focus:border-red-500 focus:ring-red-200' : ''}`}
                      placeholder="Minimum 8 characters"
                      value={password}
                      disabled={submitting}
                      onChange={(e) => {
                        setPassword(e.target.value)
                        if (formErrors.password) setFormErrors((prev) => ({ ...prev, password: '' }))
                        if (formErrors.submit) setFormErrors((prev) => ({ ...prev, submit: '' }))
                      }}
                      autoComplete="new-password"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw(!showPw)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none p-1"
                      aria-label={showPw ? 'Hide password' : 'Show password'}
                    >
                      {showPw ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                    </button>
                  </div>
                  {formErrors.password && (
                    <p className="text-red-500 text-xs mt-1 font-medium">{formErrors.password}</p>
                  )}
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="form-label" htmlFor="confirm-password">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <FiLock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      id="confirm-password"
                      type={showConfirmPw ? 'text' : 'password'}
                      className={`form-input pl-10 pr-10 ${formErrors.confirmPassword ? 'border-red-400 focus:border-red-500 focus:ring-red-200' : ''}`}
                      placeholder="Re-enter your new password"
                      value={confirmPassword}
                      disabled={submitting}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value)
                        if (formErrors.confirmPassword) setFormErrors((prev) => ({ ...prev, confirmPassword: '' }))
                        if (formErrors.submit) setFormErrors((prev) => ({ ...prev, submit: '' }))
                      }}
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPw(!showConfirmPw)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none p-1"
                      aria-label={showConfirmPw ? 'Hide confirm password' : 'Show confirm password'}
                    >
                      {showConfirmPw ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                    </button>
                  </div>
                  {formErrors.confirmPassword && (
                    <p className="text-red-500 text-xs mt-1 font-medium">{formErrors.confirmPassword}</p>
                  )}
                </div>

                {/* Password Strength Requirement Hint */}
                <div className="p-3 bg-gray-50 rounded-xl text-xs text-gray-500 space-y-1">
                  <p className="font-semibold text-gray-700">Password requirements:</p>
                  <ul className="list-disc pl-4 space-y-0.5 text-gray-500">
                    <li className={password.length >= 8 ? 'text-green-600 font-medium' : ''}>
                      Minimum 8 characters
                    </li>
                    <li className={password && password === confirmPassword ? 'text-green-600 font-medium' : ''}>
                      Both passwords must match
                    </li>
                  </ul>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3.5 bg-tsm-red-600 text-white font-bold rounded-xl hover:bg-tsm-red-700 active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed shadow-btn"
                >
                  {submitting ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Updating Password...</span>
                    </>
                  ) : (
                    'Update Password'
                  )}
                </button>

                <div className="text-center pt-2">
                  <Link
                    to="/login"
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-600 hover:text-tsm-red-600 transition-colors"
                  >
                    <FiArrowLeft size={14} /> Back to Login
                  </Link>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
