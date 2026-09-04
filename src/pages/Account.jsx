import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { FiUser, FiMail, FiPhone, FiLock, FiEye, FiEyeOff, FiMapPin, FiLogOut, FiHeart, FiShoppingCart, FiMessageSquare, FiEdit2, FiSave } from 'react-icons/fi'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import { useWishlist } from '../context/WishlistContext'
import { enquiryService } from '../services/enquiryService'
import { validateEmail, validatePassword, validateName, validatePhone, validateCity } from '../utils/securityValidators'
import { SECURITY_CONFIG } from '../config/securityConfig'
import { sanitizeErrorMessage } from '../utils/errorHandler'
import toast from 'react-hot-toast'

export default function Account() {
  const { user, login, register, resendVerificationEmail, logout, updateProfile } = useAuth()
  const { cartCount } = useCart()
  const { wishlistCount } = useWishlist()
  const [tab, setTab] = useState('login')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [activeSection, setActiveSection] = useState('profile')
  const [editMode, setEditMode] = useState(false)

  // Verification states
  const [pendingVerificationEmail, setPendingVerificationEmail] = useState('')
  const [unconfirmedLoginEmail, setUnconfirmedLoginEmail] = useState('')
  const [resending, setResending] = useState(false)

  // Login form
  const [loginForm, setLoginForm] = useState({ email: '', password: '' })
  const [loginErrors, setLoginErrors] = useState({})

  // Register form
  const [regForm, setRegForm] = useState({ name: '', email: '', phone: '', password: '', confirmPassword: '', city: '' })
  const [regErrors, setRegErrors] = useState({})

  // Profile edit form
  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    city: user?.city || '',
  })

  // Sync profile form whenever user changes
  useEffect(() => {
    if (user) {
      setProfileForm({
        name: user.name || '',
        phone: user.phone || '',
        city: user.city || '',
      })
    }
  }, [user])

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

  const handleLogin = async (e) => {
    e.preventDefault()
    const errs = {}

    const emailVal = validateEmail(loginForm.email)
    if (!emailVal.valid) errs.email = emailVal.error

    const pwVal = validatePassword(loginForm.password)
    if (!pwVal.valid) errs.password = pwVal.error

    if (Object.keys(errs).length) { setLoginErrors(errs); return }

    setLoading(true)
    const result = await login(emailVal.value, loginForm.password)
    setLoading(false)
    if (result.success) {
      setUnconfirmedLoginEmail('')
      toast.success(`Welcome back, ${result.user.name || result.user.email}!`)
    } else {
      if (result.needsEmailConfirmation) {
        setUnconfirmedLoginEmail(result.email || loginForm.email)
      }
      const friendlyError = sanitizeErrorMessage(result.error, 'Incorrect email or password.')
      toast.error(friendlyError)
      setLoginErrors({ form: friendlyError })
    }
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    const errs = {}

    const nameVal = validateName(regForm.name)
    if (!nameVal.valid) errs.name = nameVal.error

    const emailVal = validateEmail(regForm.email)
    if (!emailVal.valid) errs.email = emailVal.error

    const phoneVal = validatePhone(regForm.phone)
    if (!phoneVal.valid) errs.phone = phoneVal.error

    const cityVal = validateCity(regForm.city)
    if (!cityVal.valid) errs.city = cityVal.error

    const pwVal = validatePassword(regForm.password)
    if (!pwVal.valid) errs.password = pwVal.error

    if (regForm.password !== regForm.confirmPassword) errs.confirmPassword = 'Passwords do not match'
    if (Object.keys(errs).length) { setRegErrors(errs); return }

    setLoading(true)
    const result = await register({
      name: nameVal.value,
      email: emailVal.value,
      phone: phoneVal.value,
      city: cityVal.value,
      password: regForm.password,
    })
    setLoading(false)
    if (result.success) {
      if (result.needsEmailConfirmation) {
        setPendingVerificationEmail(result.email || regForm.email)
        toast.success('Registration successful! Please verify your email.')
      } else {
        toast.success('Account created! Welcome to TSM Enterprises.')
      }
    } else {
      toast.error(sanitizeErrorMessage(result.error, 'Registration failed.'))
    }
  }

  const handleProfileSave = async () => {
    const nameVal = validateName(profileForm.name || '')
    if (!nameVal.valid) {
      toast.error(nameVal.error)
      return
    }

    if (profileForm.phone) {
      const phoneVal = validatePhone(profileForm.phone)
      if (!phoneVal.valid) {
        toast.error(phoneVal.error)
        return
      }
    }

    setLoading(true)
    try {
      await updateProfile(profileForm)
      setEditMode(false)
      toast.success('Profile updated!')
    } catch (err) {
      toast.error(sanitizeErrorMessage(err, 'Failed to update profile.'))
    } finally {
      setLoading(false)
    }
  }


  const [enquiries, setEnquiries] = useState([])

  useEffect(() => {
    if (user?.id || user?.email) {
      enquiryService.getUserEnquiries(user?.id, user?.email).then(res => {
        setEnquiries(res.data || [])
      })
    }
  }, [user?.id, user?.email])

  if (!user) {
    return (
      <div className="pt-20 min-h-screen bg-tsm-gray-50">
        <div className="container-custom py-12">
          <div className="max-w-md mx-auto">
            {/* Tab */}
            <div className="bg-white rounded-2xl shadow-card overflow-hidden">
              <div className="bg-tsm-navy-900 px-8 py-6 text-center">
                <div className="w-16 h-16 bg-tsm-red-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <FiUser size={28} className="text-white" />
                </div>
                <h1 className="text-2xl font-bold text-white font-display">My Account</h1>
                <p className="text-tsm-navy-300 text-sm mt-1">TSM Enterprises Customer Portal</p>
              </div>

              {pendingVerificationEmail ? (
                /* Verification Pending Screen */
                <div className="p-6 md:p-8 text-center space-y-4">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto text-blue-600">
                    <FiMail size={32} />
                  </div>
                  <h2 className="text-xl font-bold text-tsm-navy-900 font-display">
                    Confirm Your Email Address
                  </h2>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    We've sent a confirmation email to:<br />
                    <strong className="text-tsm-navy-900 text-base">{pendingVerificationEmail}</strong>
                  </p>
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 text-left">
                    <p className="font-semibold mb-1">ℹ️ Next Steps:</p>
                    <ol className="list-decimal pl-4 space-y-1">
                      <li>Open your email inbox and click the verification link.</li>
                      <li>Check your <strong>Spam</strong> or <strong>Junk</strong> folder if you don't see it within a minute.</li>
                      <li>Once confirmed, you will be able to log in to your account.</li>
                    </ol>
                  </div>
                  <div className="space-y-2 pt-2">
                    <button
                      type="button"
                      disabled={resending}
                      onClick={() => handleResend(pendingVerificationEmail)}
                      className="w-full py-3 bg-tsm-navy-800 text-white font-semibold rounded-xl hover:bg-tsm-navy-900 text-xs transition-colors flex items-center justify-center gap-2"
                    >
                      {resending ? 'Sending...' : 'Resend Confirmation Email'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setPendingVerificationEmail('')
                        setTab('login')
                      }}
                      className="w-full py-3 border border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 text-xs transition-colors"
                    >
                      Back to Login
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex border-b border-gray-100">
                    {['login', 'register'].map(t => (
                      <button
                        key={t}
                        onClick={() => { setTab(t); setUnconfirmedLoginEmail('') }}
                        className={`flex-1 py-3.5 text-sm font-semibold transition-all duration-200 ${
                          tab === t ? 'text-tsm-red-600 border-b-2 border-tsm-red-600 bg-tsm-red-50' : 'text-gray-500 hover:text-gray-700'
                        }`}
                      >
                        {t === 'login' ? 'Login' : 'Create Account'}
                      </button>
                    ))}
                  </div>

                  <div className="p-6">
                    {tab === 'login' ? (
                      <form onSubmit={handleLogin} className="space-y-4" noValidate>
                        {/* Demo hint (DEV only when explicitly enabled) */}
                        {SECURITY_CONFIG.DEMO_AUTH.ENABLED && (
                          <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-xs text-blue-700">
                            <strong>Development Demo Mode:</strong> {SECURITY_CONFIG.DEMO_AUTH.ADMIN_EMAIL}
                          </div>
                        )}


                        {/* Unconfirmed Email Notice if attempted login */}
                        {unconfirmedLoginEmail && (
                          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-900 space-y-2">
                            <p>
                              ⚠️ Your email (<strong>{unconfirmedLoginEmail}</strong>) is not verified yet. Please click the link sent to your email.
                            </p>
                            <button
                              type="button"
                              disabled={resending}
                              onClick={() => handleResend(unconfirmedLoginEmail)}
                              className="text-xs font-bold text-tsm-red-600 underline hover:text-tsm-red-700"
                            >
                              {resending ? 'Sending link...' : 'Resend verification link'}
                            </button>
                          </div>
                        )}
                        <div>
                      <label className="form-label">Email Address</label>
                      <div className="relative">
                        <FiMail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                          type="email"
                          className={`form-input pl-10 ${loginErrors.email ? 'border-red-400' : ''}`}
                          placeholder="your@email.com"
                          value={loginForm.email}
                          onChange={e => { setLoginForm(f => ({ ...f, email: e.target.value })); setLoginErrors(e2 => ({ ...e2, email: '' })) }}
                        />
                      </div>
                      {loginErrors.email && <p className="text-red-500 text-xs mt-1">{loginErrors.email}</p>}
                    </div>
                    <div>
                      <label className="form-label">Password</label>
                      <div className="relative">
                        <FiLock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                          type={showPw ? 'text' : 'password'}
                          className={`form-input pl-10 pr-10 ${loginErrors.password ? 'border-red-400' : ''}`}
                          placeholder="••••••••"
                          value={loginForm.password}
                          onChange={e => { setLoginForm(f => ({ ...f, password: e.target.value })); setLoginErrors(e2 => ({ ...e2, password: '' })) }}
                        />
                        <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                          {showPw ? <FiEyeOff size={15} /> : <FiEye size={15} />}
                        </button>
                      </div>
                      {loginErrors.password && <p className="text-red-500 text-xs mt-1">{loginErrors.password}</p>}
                    </div>
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-3.5 bg-tsm-red-600 text-white font-bold rounded-xl hover:bg-tsm-red-700 active:scale-[0.99] transition-all flex items-center justify-center gap-2"
                    >
                      {loading ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Logging in...</> : 'Login'}
                    </button>
                    <div className="text-center pt-1">
                      <Link
                        to="/forgot-password"
                        className="text-sm font-semibold text-tsm-red-600 hover:text-tsm-red-700 hover:underline inline-block transition-colors"
                      >
                        Forgot Password?
                      </Link>
                    </div>
                    <p className="text-center text-sm text-gray-500">
                      Don't have an account?{' '}
                      <button type="button" onClick={() => setTab('register')} className="text-tsm-red-600 font-semibold hover:underline">
                        Create one
                      </button>
                    </p>
                  </form>
                ) : (
                  <form onSubmit={handleRegister} className="space-y-4" noValidate>
                    <div>
                      <label className="form-label">Full Name *</label>
                      <div className="relative">
                        <FiUser size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input className={`form-input pl-10 ${regErrors.name ? 'border-red-400' : ''}`} placeholder="Your full name"
                          value={regForm.name} onChange={e => setRegForm(f => ({ ...f, name: e.target.value }))} />
                      </div>
                      {regErrors.name && <p className="text-red-500 text-xs mt-1">{regErrors.name}</p>}
                    </div>
                    <div>
                      <label className="form-label">Email *</label>
                      <div className="relative">
                        <FiMail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input type="email" className={`form-input pl-10 ${regErrors.email ? 'border-red-400' : ''}`} placeholder="your@email.com"
                          value={regForm.email} onChange={e => setRegForm(f => ({ ...f, email: e.target.value }))} />
                      </div>
                      {regErrors.email && <p className="text-red-500 text-xs mt-1">{regErrors.email}</p>}
                    </div>
                    <div>
                      <label className="form-label">Mobile Number *</label>
                      <div className="relative">
                        <FiPhone size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input className={`form-input pl-10 ${regErrors.phone ? 'border-red-400' : ''}`} placeholder="10-digit mobile"
                          value={regForm.phone} onChange={e => setRegForm(f => ({ ...f, phone: e.target.value }))} maxLength={10} />
                      </div>
                      {regErrors.phone && <p className="text-red-500 text-xs mt-1">{regErrors.phone}</p>}
                    </div>
                    <div>
                      <label className="form-label">City / Location</label>
                      <div className="relative">
                        <FiMapPin size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input className="form-input pl-10" placeholder="Your city"
                          value={regForm.city} onChange={e => setRegForm(f => ({ ...f, city: e.target.value }))} />
                      </div>
                    </div>
                    <div>
                      <label className="form-label">Password *</label>
                      <div className="relative">
                        <FiLock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input type={showPw ? 'text' : 'password'} className={`form-input pl-10 pr-10 ${regErrors.password ? 'border-red-400' : ''}`} placeholder="Min 6 characters"
                          value={regForm.password} onChange={e => setRegForm(f => ({ ...f, password: e.target.value }))} />
                        <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                          {showPw ? <FiEyeOff size={15} /> : <FiEye size={15} />}
                        </button>
                      </div>
                      {regErrors.password && <p className="text-red-500 text-xs mt-1">{regErrors.password}</p>}
                    </div>
                    <div>
                      <label className="form-label">Confirm Password *</label>
                      <div className="relative">
                        <FiLock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input type="password" className={`form-input pl-10 ${regErrors.confirmPassword ? 'border-red-400' : ''}`} placeholder="Repeat password"
                          value={regForm.confirmPassword} onChange={e => setRegForm(f => ({ ...f, confirmPassword: e.target.value }))} />
                      </div>
                      {regErrors.confirmPassword && <p className="text-red-500 text-xs mt-1">{regErrors.confirmPassword}</p>}
                    </div>
                    <button type="submit" disabled={loading} className="w-full py-3.5 bg-tsm-red-600 text-white font-bold rounded-xl hover:bg-tsm-red-700 active:scale-[0.99] transition-all flex items-center justify-center gap-2">
                      {loading ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Creating...</> : 'Create Account'}
                    </button>
                    <p className="text-center text-sm text-gray-500">
                      Already have an account?{' '}
                      <button type="button" onClick={() => setTab('login')} className="text-tsm-red-600 font-semibold hover:underline">Login</button>
                    </p>
                  </form>
                )}
              </div>
            </>
          )}
          </div>
        </div>
      </div>
    </div>
  )
}

  // ── LOGGED IN ──
  const SECTIONS = [
    { id: 'profile', icon: <FiUser size={16} />, label: 'My Profile' },
    { id: 'enquiries', icon: <FiMessageSquare size={16} />, label: 'My Enquiries' },
    { id: 'wishlist', icon: <FiHeart size={16} />, label: 'Saved Vehicles', count: wishlistCount },
    { id: 'cart', icon: <FiShoppingCart size={16} />, label: 'My Cart', count: cartCount },
  ]

  return (
    <div className="pt-20 min-h-screen bg-tsm-gray-50">
      {/* Header */}
      <div className="bg-tsm-navy-900 pb-10 pt-10">
        <div className="container-custom">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-tsm-red-600 rounded-2xl flex items-center justify-center">
              <span className="text-white text-2xl font-bold">{user.name?.charAt(0).toUpperCase()}</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white font-display">{user.name}</h1>
              <p className="text-tsm-navy-300 text-sm">{user.email}</p>
              {user.role === 'admin' && (
                <span className="inline-block mt-1 px-2 py-0.5 bg-tsm-red-600 text-white text-xs font-bold rounded-full">Admin</span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container-custom -mt-4 pb-10">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Sidebar */}
          <aside className="md:w-56 flex-shrink-0">
            <div className="bg-white rounded-2xl shadow-card border border-gray-100 overflow-hidden">
              {SECTIONS.map(s => (
                <button
                  key={s.id}
                  onClick={() => setActiveSection(s.id)}
                  className={`w-full flex items-center justify-between px-4 py-3.5 text-sm font-medium transition-all border-b border-gray-50 last:border-0 ${
                    activeSection === s.id ? 'bg-tsm-red-50 text-tsm-red-600' : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <span className="flex items-center gap-2.5">{s.icon}{s.label}</span>
                  {s.count > 0 && <span className="w-5 h-5 bg-tsm-red-600 text-white text-xs rounded-full flex items-center justify-center">{s.count}</span>}
                </button>
              ))}
              <button
                type="button"
                onClick={async () => {
                  await logout()
                  setActiveSection('profile')
                  setTab('login')
                }}
                className="w-full flex items-center gap-2.5 px-4 py-3.5 text-sm font-medium text-red-600 hover:bg-red-50 transition-all text-left"
              >
                <FiLogOut size={16} /> Logout
              </button>
            </div>
          </aside>

          {/* Content */}
          <div className="flex-1">
            <div className="bg-white rounded-2xl shadow-card border border-gray-100 p-6">
              {/* Profile Section */}
              {activeSection === 'profile' && (
                <div>
                  <div className="flex items-center justify-between mb-5">
                    <h2 className="text-lg font-bold text-tsm-navy-900 font-display">My Profile</h2>
                    {!editMode ? (
                      <button onClick={() => { setEditMode(true); setProfileForm({ name: user.name, phone: user.phone, city: user.city }) }} className="flex items-center gap-1.5 text-sm text-tsm-red-600 hover:underline">
                        <FiEdit2 size={13} /> Edit
                      </button>
                    ) : (
                      <button onClick={handleProfileSave} className="flex items-center gap-1.5 text-sm text-green-600 hover:underline font-semibold">
                        <FiSave size={13} /> Save
                      </button>
                    )}
                  </div>
                  <div className="space-y-4">
                    {[
                      { label: 'Full Name', key: 'name', icon: <FiUser size={14} /> },
                      { label: 'Mobile Number', key: 'phone', icon: <FiPhone size={14} /> },
                      { label: 'City / Location', key: 'city', icon: <FiMapPin size={14} /> },
                    ].map(field => (
                      <div key={field.key}>
                        <label className="form-label">{field.label}</label>
                        {editMode ? (
                          <div className="relative">
                            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">{field.icon}</span>
                            <input
                              className="form-input pl-10"
                              value={profileForm[field.key] || ''}
                              onChange={e => setProfileForm(f => ({ ...f, [field.key]: e.target.value }))}
                            />
                          </div>
                        ) : (
                          <div className="flex items-center gap-2.5 px-4 py-3 bg-gray-50 rounded-xl text-tsm-navy-800 text-sm">
                            <span className="text-gray-400">{field.icon}</span>
                            {user[field.key] || '—'}
                          </div>
                        )}
                      </div>
                    ))}
                    <div>
                      <label className="form-label">Email</label>
                      <div className="flex items-center gap-2.5 px-4 py-3 bg-gray-50 rounded-xl text-tsm-navy-800 text-sm">
                        <FiMail size={14} className="text-gray-400" />
                        {user.email}
                        {user.email_confirmed_at ? (
                          <span className="ml-auto text-xs bg-green-100 text-green-700 px-2.5 py-0.5 rounded-full font-medium">
                            ✓ Verified
                          </span>
                        ) : (
                          <div className="ml-auto flex items-center gap-2">
                            <span className="text-xs bg-amber-100 text-amber-800 px-2.5 py-0.5 rounded-full font-medium">
                              ⚠️ Unverified
                            </span>
                            <button
                              type="button"
                              disabled={resending}
                              onClick={() => handleResend(user.email)}
                              className="text-xs text-tsm-red-600 hover:underline font-semibold"
                            >
                              {resending ? 'Sending...' : 'Verify'}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Enquiries Section */}
              {activeSection === 'enquiries' && (
                <div>
                  <h2 className="text-lg font-bold text-tsm-navy-900 font-display mb-5">My Enquiries</h2>
                  {enquiries.length === 0 ? (
                    <div className="text-center py-12">
                      <span className="text-5xl block mb-3">📋</span>
                      <p className="text-gray-500 text-sm">No enquiries yet. Browse vehicles and send an enquiry!</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {enquiries.map(enq => (
                        <div key={enq.id} className="border border-gray-100 rounded-xl p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="font-semibold text-tsm-navy-900 text-sm">{enq.vehicleName || 'General Enquiry'}</p>
                              <p className="text-xs text-gray-500 mt-0.5">{enq.message?.slice(0, 80)}...</p>
                              <p className="text-xs text-gray-400 mt-1">{new Date(enq.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                            </div>
                            <span className={`badge text-xs status-${enq.status}`}>{enq.status}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Wishlist quick view */}
              {activeSection === 'wishlist' && (
                <div className="text-center py-12">
                  <FiHeart size={40} className="text-tsm-red-400 mx-auto mb-3" />
                  <h2 className="text-lg font-bold text-tsm-navy-900 font-display mb-2">Saved Vehicles</h2>
                  <p className="text-gray-500 text-sm mb-4">You have {wishlistCount} saved vehicle{wishlistCount !== 1 ? 's' : ''}.</p>
                  <a href="/wishlist" className="btn-primary">View Wishlist</a>
                </div>
              )}

              {/* Cart quick view */}
              {activeSection === 'cart' && (
                <div className="text-center py-12">
                  <FiShoppingCart size={40} className="text-tsm-navy-400 mx-auto mb-3" />
                  <h2 className="text-lg font-bold text-tsm-navy-900 font-display mb-2">My Cart</h2>
                  <p className="text-gray-500 text-sm mb-4">You have {cartCount} vehicle{cartCount !== 1 ? 's' : ''} in your cart.</p>
                  <a href="/cart" className="btn-primary">View Cart</a>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
