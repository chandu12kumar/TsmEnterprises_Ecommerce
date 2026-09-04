import { useState } from 'react'
import { Link, useNavigate, Navigate } from 'react-router-dom'
import { FiUser, FiMail, FiPhone, FiLock, FiEye, FiEyeOff, FiMapPin } from 'react-icons/fi'
import { useAuth } from '../context/AuthContext'
import { validateName, validateEmail, validatePhone, validateCity, validatePassword } from '../utils/securityValidators'
import { sanitizeErrorMessage } from '../utils/errorHandler'
import toast from 'react-hot-toast'

export default function Register() {
  const { user, isAdmin, register } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    city: '',
    password: '',
    confirmPassword: '',
  })
  const [errors, setErrors] = useState({})
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [pendingEmail, setPendingEmail] = useState('')

  // If already logged in, redirect
  if (user) {
    return <Navigate to={isAdmin ? '/admin' : '/account'} replace />
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = {}

    const nameVal = validateName(form.name)
    if (!nameVal.valid) errs.name = nameVal.error

    const emailVal = validateEmail(form.email)
    if (!emailVal.valid) errs.email = emailVal.error

    const phoneVal = validatePhone(form.phone)
    if (!phoneVal.valid) errs.phone = phoneVal.error

    const cityVal = validateCity(form.city)
    if (!cityVal.valid) errs.city = cityVal.error

    const pwVal = validatePassword(form.password)
    if (!pwVal.valid) errs.password = pwVal.error

    if (form.password !== form.confirmPassword) errs.confirmPassword = 'Passwords do not match'

    if (Object.keys(errs).length) {
      setErrors(errs)
      return
    }

    setLoading(true)
    const result = await register({
      name: nameVal.value,
      email: emailVal.value,
      phone: phoneVal.value,
      city: cityVal.value,
      password: form.password,
    })
    setLoading(false)

    if (result.success) {
      if (result.needsEmailConfirmation) {
        setPendingEmail(result.email || form.email)
        toast.success('Registration successful! Please verify your email.')
      } else {
        toast.success('Account created! Welcome to TSM Enterprises.')
        navigate('/account')
      }
    } else {
      const friendlyError = sanitizeErrorMessage(result.error, 'Registration failed.')
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
            <h1 className="text-2xl font-bold text-white font-display">Create Account</h1>
            <p className="text-tsm-navy-300 text-sm mt-1">Join TSM Enterprises Portal</p>
          </div>

          <div className="p-6 sm:p-8">
            {pendingEmail ? (
              <div className="text-center space-y-4 animate-fade-in">
                <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto border border-blue-200">
                  <FiMail size={32} />
                </div>
                <h2 className="text-xl font-bold text-tsm-navy-900 font-display">
                  Confirm Your Email Address
                </h2>
                <p className="text-sm text-gray-600 leading-relaxed">
                  We've sent a confirmation email to:<br />
                  <strong className="text-tsm-navy-900 text-base">{pendingEmail}</strong>
                </p>
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 text-left">
                  <p className="font-semibold mb-1">ℹ️ Next Steps:</p>
                  <ol className="list-decimal pl-4 space-y-1">
                    <li>Open your email inbox and click the verification link.</li>
                    <li>Check your <strong>Spam</strong> or <strong>Junk</strong> folder if you don't see it within a minute.</li>
                    <li>Once confirmed, you will be able to log in to your account.</li>
                  </ol>
                </div>
                <div className="pt-2">
                  <Link
                    to="/login"
                    className="w-full py-3 bg-tsm-red-600 text-white font-bold rounded-xl hover:bg-tsm-red-700 transition-all flex items-center justify-center text-sm shadow-btn"
                  >
                    Go to Login
                  </Link>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                {/* Full Name */}
                <div>
                  <label className="form-label">Full Name *</label>
                  <div className="relative">
                    <FiUser size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      className={`form-input pl-10 ${errors.name ? 'border-red-400' : ''}`}
                      placeholder="Your full name"
                      value={form.name}
                      onChange={(e) => {
                        setForm((f) => ({ ...f, name: e.target.value }))
                        setErrors((e2) => ({ ...e2, name: '' }))
                      }}
                    />
                  </div>
                  {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                </div>

                {/* Email */}
                <div>
                  <label className="form-label">Email Address *</label>
                  <div className="relative">
                    <FiMail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="email"
                      className={`form-input pl-10 ${errors.email ? 'border-red-400' : ''}`}
                      placeholder="your@email.com"
                      value={form.email}
                      onChange={(e) => {
                        setForm((f) => ({ ...f, email: e.target.value }))
                        setErrors((e2) => ({ ...e2, email: '' }))
                      }}
                    />
                  </div>
                  {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                </div>

                {/* Mobile Phone */}
                <div>
                  <label className="form-label">Mobile Number *</label>
                  <div className="relative">
                    <FiPhone size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      className={`form-input pl-10 ${errors.phone ? 'border-red-400' : ''}`}
                      placeholder="10-digit mobile"
                      value={form.phone}
                      onChange={(e) => {
                        setForm((f) => ({ ...f, phone: e.target.value }))
                        setErrors((e2) => ({ ...e2, phone: '' }))
                      }}
                      maxLength={10}
                    />
                  </div>
                  {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
                </div>

                {/* City */}
                <div>
                  <label className="form-label">City / Location</label>
                  <div className="relative">
                    <FiMapPin size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      className="form-input pl-10"
                      placeholder="Your city"
                      value={form.city}
                      onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="form-label">Password *</label>
                  <div className="relative">
                    <FiLock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type={showPw ? 'text' : 'password'}
                      className={`form-input pl-10 pr-10 ${errors.password ? 'border-red-400' : ''}`}
                      placeholder="Min 8 characters"
                      value={form.password}
                      onChange={(e) => {
                        setForm((f) => ({ ...f, password: e.target.value }))
                        setErrors((e2) => ({ ...e2, password: '' }))
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw(!showPw)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                    >
                      {showPw ? <FiEyeOff size={15} /> : <FiEye size={15} />}
                    </button>
                  </div>
                  {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="form-label">Confirm Password *</label>
                  <div className="relative">
                    <FiLock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="password"
                      className={`form-input pl-10 ${errors.confirmPassword ? 'border-red-400' : ''}`}
                      placeholder="Repeat password"
                      value={form.confirmPassword}
                      onChange={(e) => {
                        setForm((f) => ({ ...f, confirmPassword: e.target.value }))
                        setErrors((e2) => ({ ...e2, confirmPassword: '' }))
                      }}
                    />
                  </div>
                  {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>}
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
                      <span>Creating Account...</span>
                    </>
                  ) : (
                    'Create Account'
                  )}
                </button>

                <p className="text-center text-sm text-gray-500 pt-2 border-t border-gray-100">
                  Already have an account?{' '}
                  <Link to="/login" className="text-tsm-red-600 font-semibold hover:underline">
                    Login
                  </Link>
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
