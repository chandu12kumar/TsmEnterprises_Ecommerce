import { useState } from 'react'
import { Link } from 'react-router-dom'
import { FiMail, FiArrowLeft, FiAlertCircle, FiCheckCircle, FiUserPlus } from 'react-icons/fi'
import { useAuth } from '../context/AuthContext'
import { validateEmail } from '../utils/securityValidators'
import { sanitizeErrorMessage } from '../utils/errorHandler'
import toast from 'react-hot-toast'

export default function ForgotPassword() {
  const { checkUserEmail, sendPasswordReset } = useAuth()

  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [unregisteredError, setUnregisteredError] = useState(false)
  const [emailSent, setEmailSent] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setUnregisteredError(false)

    const emailVal = validateEmail(email)
    if (!emailVal.valid) {
      setError(emailVal.error)
      return
    }
    const cleanEmail = emailVal.value

    setLoading(true)

    try {
      // 1. Verify account existence securely
      const checkResult = await checkUserEmail(cleanEmail)

      if (!checkResult.exists) {
        setLoading(false)
        setUnregisteredError(true)
        setError('This email is not registered. Please create an account first.')
        return
      }

      // 2. Account exists: Dispatch Supabase password reset email
      const resetResult = await sendPasswordReset(cleanEmail)
      setLoading(false)

      if (resetResult.success) {
        setEmailSent(true)
        toast.success('Password reset link sent to your email!')
      } else {
        const friendlyError = sanitizeErrorMessage(resetResult.error, 'Unable to send reset email. Please try again.')
        setError(friendlyError)
        toast.error(friendlyError)
      }
    } catch (err) {
      setLoading(false)
      const friendlyError = sanitizeErrorMessage(err, 'Something went wrong. Please try again.')
      setError(friendlyError)
      toast.error(friendlyError)
    }
  }


  return (
    <div className="pt-20 min-h-screen bg-tsm-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-card overflow-hidden border border-gray-100">
          {/* Header Banner */}
          <div className="bg-tsm-navy-900 px-8 py-8 text-center relative">
            <div className="w-16 h-16 bg-tsm-red-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-btn">
              <FiMail size={28} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white font-display">Forgot Password?</h1>
            <p className="text-tsm-navy-300 text-sm mt-1.5 max-w-xs mx-auto">
              Enter the email address you used to register.
            </p>
          </div>

          <div className="p-6 sm:p-8">
            {emailSent ? (
              /* Success State UI */
              <div className="text-center space-y-4 animate-fade-in">
                <div className="w-16 h-16 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto border border-green-200">
                  <FiCheckCircle size={32} />
                </div>
                <h2 className="text-xl font-bold text-tsm-navy-900 font-display">
                  Check Your Email
                </h2>
                <p className="text-sm text-gray-600 leading-relaxed">
                  If this email is registered with TSM Enterprises, you will receive a password reset link at:
                </p>
                <div className="p-3 bg-tsm-gray-100 rounded-xl text-sm font-semibold text-tsm-navy-900 break-all">
                  {email}
                </div>
                <p className="text-xs text-gray-500">
                  Please check your inbox and spam folder. The link will expire shortly for security.
                </p>

                <div className="pt-3 space-y-2">
                  <button
                    type="button"
                    onClick={() => {
                      setEmailSent(false)
                      setEmail('')
                    }}
                    className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-tsm-navy-900 text-sm font-semibold rounded-xl transition-all"
                  >
                    Send to another email
                  </button>
                  <Link
                    to="/login"
                    className="w-full py-3.5 bg-tsm-red-600 text-white font-bold rounded-xl hover:bg-tsm-red-700 transition-all flex items-center justify-center gap-2 text-sm"
                  >
                    Back to Login
                  </Link>
                </div>
              </div>
            ) : (
              /* Form State UI */
              <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                {/* Unregistered Account Error Notice */}
                {unregisteredError && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-xs text-red-700 animate-slide-up space-y-3">
                    <div className="flex items-start gap-2.5">
                      <FiAlertCircle size={18} className="text-red-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-sm text-red-800 mb-0.5">Account Not Found</p>
                        <p>{error}</p>
                      </div>
                    </div>
                    <Link
                      to="/register"
                      className="w-full py-2.5 bg-tsm-red-600 hover:bg-tsm-red-700 text-white font-bold rounded-lg transition-all flex items-center justify-center gap-2 text-xs shadow-sm"
                    >
                      <FiUserPlus size={14} /> Register Now
                    </Link>
                  </div>
                )}

                {/* Generic error message */}
                {error && !unregisteredError && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-700 flex items-center gap-2">
                    <FiAlertCircle size={16} className="text-red-500 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <div>
                  <label className="form-label" htmlFor="forgot-email">
                    Email Address
                  </label>
                  <div className="relative">
                    <FiMail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      id="forgot-email"
                      type="email"
                      className={`form-input pl-10 ${error ? 'border-red-400 focus:border-red-500 focus:ring-red-200' : ''}`}
                      placeholder="your@email.com"
                      value={email}
                      disabled={loading}
                      onChange={(e) => {
                        setEmail(e.target.value)
                        if (error) setError('')
                        if (unregisteredError) setUnregisteredError(false)
                      }}
                      autoComplete="email"
                      autoFocus
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 bg-tsm-red-600 text-white font-bold rounded-xl hover:bg-tsm-red-700 active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed shadow-btn"
                >
                  {loading ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Sending...</span>
                    </>
                  ) : (
                    'Send Reset Link'
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
