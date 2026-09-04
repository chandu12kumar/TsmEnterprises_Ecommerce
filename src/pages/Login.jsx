import { useState } from 'react'
import { Link, useNavigate, Navigate } from 'react-router-dom'
import { FiUser, FiMail, FiLock, FiEye, FiEyeOff } from 'react-icons/fi'
import { useAuth } from '../context/AuthContext'
import { validateEmail, validatePassword } from '../utils/securityValidators'
import { SECURITY_CONFIG } from '../config/securityConfig'
import { sanitizeErrorMessage } from '../utils/errorHandler'
import toast from 'react-hot-toast'

export default function Login() {
  const { user, isAdmin, login, resendVerificationEmail } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState({})
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [unconfirmedEmail, setUnconfirmedEmail] = useState('')
  const [resending, setResending] = useState(false)

  // If already logged in, redirect to appropriate destination
  if (user) {
    return <Navigate to={isAdmin ? '/admin' : '/account'} replace />
  }

  const handleResend = async (emailToResend) => {
    if (!emailToResend) return
    setResending(true)
    const res = await resendVerificationEmail(emailToResend)
    setResending(false)
    if (res.success) {
      toast.success(`Verification link sent to ${emailToResend}! Check your inbox.`)
    } else {
      toast.error(sanitizeErrorMessage(res.error, 'Failed to resend verification link.'))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = {}

    const emailVal = validateEmail(form.email)
    if (!emailVal.valid) errs.email = emailVal.error

    const pwVal = validatePassword(form.password)
    if (!pwVal.valid) errs.password = pwVal.error

    if (Object.keys(errs).length) {
      setErrors(errs)
      return
    }

    setLoading(true)
    const result = await login(emailVal.value, form.password)
    setLoading(false)

    if (result.success) {
      setUnconfirmedEmail('')
      toast.success(`Welcome back, ${result.user.name || result.user.email}!`)
      if (result.user.role === 'admin' || result.profile?.role === 'admin') {
        navigate('/admin')
      } else {
        navigate('/account')
      }
    } else {
      if (result.needsEmailConfirmation) {
        setUnconfirmedEmail(result.email || form.email)
      }
      const friendlyError = sanitizeErrorMessage(result.error, 'Incorrect email or password.')
      toast.error(friendlyError)
      setErrors({ form: friendlyError })
    }
  }

  return (
    <div className="pt-20 min-h-screen bg-tsm-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-card overflow-hidden border border-gray-100">
          {/* Header Banner */}
          <div className="bg-tsm-navy-900 px-8 py-8 text-center relative">
            <div className="w-16 h-16 bg-tsm-red-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-btn">
              <FiUser size={28} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white font-display">Customer Login</h1>
            <p className="text-tsm-navy-300 text-sm mt-1">TSM Enterprises Portal</p>
          </div>

          <div className="p-6 sm:p-8">
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              {/* Demo Notice (Only if demo is explicitly enabled in DEV) */}
              {SECURITY_CONFIG.DEMO_AUTH.ENABLED && (
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-xs text-blue-700">
                  <strong>Development Demo Mode Active:</strong> {SECURITY_CONFIG.DEMO_AUTH.ADMIN_EMAIL}
                </div>
              )}


              {/* Unconfirmed Email Notice */}
              {unconfirmedEmail && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-900 space-y-2">
                  <p>
                    ⚠️ Your email (<strong>{unconfirmedEmail}</strong>) is not verified yet. Please click the link sent to your email.
                  </p>
                  <button
                    type="button"
                    disabled={resending}
                    onClick={() => handleResend(unconfirmedEmail)}
                    className="text-xs font-bold text-tsm-red-600 underline hover:text-tsm-red-700"
                  >
                    {resending ? 'Sending link...' : 'Resend verification link'}
                  </button>
                </div>
              )}

              {/* Email */}
              <div>
                <label className="form-label" htmlFor="login-email">
                  Email
                </label>
                <div className="relative">
                  <FiMail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    id="login-email"
                    type="email"
                    className={`form-input pl-10 ${errors.email ? 'border-red-400' : ''}`}
                    placeholder="your@email.com"
                    value={form.email}
                    onChange={(e) => {
                      setForm((f) => ({ ...f, email: e.target.value }))
                      setErrors((e2) => ({ ...e2, email: '' }))
                    }}
                    autoComplete="email"
                  />
                </div>
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
              </div>

              {/* Password */}
              <div>
                <label className="form-label" htmlFor="login-password">
                  Password
                </label>
                <div className="relative">
                  <FiLock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    id="login-password"
                    type={showPw ? 'text' : 'password'}
                    className={`form-input pl-10 pr-10 ${errors.password ? 'border-red-400' : ''}`}
                    placeholder="••••••••"
                    value={form.password}
                    onChange={(e) => {
                      setForm((f) => ({ ...f, password: e.target.value }))
                      setErrors((e2) => ({ ...e2, password: '' }))
                    }}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(!showPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                    aria-label={showPw ? 'Hide password' : 'Show password'}
                  >
                    {showPw ? <FiEyeOff size={15} /> : <FiEye size={15} />}
                  </button>
                </div>
                {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-tsm-red-600 text-white font-bold rounded-xl hover:bg-tsm-red-700 active:scale-[0.99] transition-all flex items-center justify-center gap-2 shadow-btn disabled:opacity-70"
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Logging in...</span>
                  </>
                ) : (
                  'Login'
                )}
              </button>

              {/* Forgot Password Link - Clearly visible below login button / password */}
              <div className="text-center pt-1">
                <Link
                  to="/forgot-password"
                  className="text-sm font-semibold text-tsm-red-600 hover:text-tsm-red-700 hover:underline inline-block transition-colors"
                >
                  Forgot Password?
                </Link>
              </div>

              {/* Register Link */}
              <p className="text-center text-sm text-gray-500 pt-2 border-t border-gray-100">
                Don't have an account?{' '}
                <Link to="/register" className="text-tsm-red-600 font-semibold hover:underline">
                  Register
                </Link>
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
