import { useState } from 'react'
import { Link } from 'react-router-dom'
import { FiX, FiPhone, FiMail, FiMessageSquare, FiCheckCircle, FiAlertCircle } from 'react-icons/fi'
import { FaWhatsapp } from 'react-icons/fa'
import { useAuth } from '../context/AuthContext'
import { enquiryService } from '../services/enquiryService'
import { sanitizeErrorMessage } from '../utils/errorHandler'
import toast from 'react-hot-toast'

export default function EnquiryModal({ vehicle, isOpen, onClose }) {
  const { user } = useAuth()
  const [form, setForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    email: user?.email || '',
    message: '',
  })
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [emailStatus, setEmailStatus] = useState(null)
  const [errors, setErrors] = useState({})

  if (!isOpen) return null

  if (!user) {
    return (
      <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
        <div className="bg-white rounded-2xl max-w-sm w-full p-6 text-center shadow-2xl relative" onClick={e => e.stopPropagation()}>
          <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600" aria-label="Close">
            <FiX size={20} />
          </button>
          <span className="text-5xl block mb-3">🔐</span>
          <h3 className="text-lg font-bold text-tsm-navy-900 mb-1 font-display">Login Required</h3>
          <p className="text-xs text-gray-500 mb-5">
            Please log in to your account to submit an enquiry for {vehicle?.name || 'this vehicle'}.
          </p>
          <Link
            to="/login"
            onClick={onClose}
            className="w-full flex items-center justify-center gap-2 py-3 bg-tsm-red-600 text-white font-semibold rounded-xl hover:bg-tsm-red-700 transition-colors text-sm shadow-btn"
          >
            Login / Register
          </Link>
        </div>
      </div>
    )
  }

  const validate = () => {
    const errs = {}
    if (!form.name.trim()) errs.name = 'Full name is required'
    if (!form.phone.trim() || !/^[0-9]{10}$/.test(form.phone.replace(/[^0-9]/g, ''))) {
      errs.phone = 'Valid 10-digit mobile number required'
    }
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      errs.email = 'Valid email required'
    }
    if (!form.message.trim()) errs.message = 'Please provide details or questions'
    return errs
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) {
      setErrors(errs)
      return
    }

    setLoading(true)

    const result = await enquiryService.submitEnquiry({
      userId: user?.id,
      vehicleId: vehicle?.id,
      vehicleName: vehicle?.name,
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      message: form.message.trim(),
    })

    setLoading(false)

    if (result.success) {
      setSubmitted(true)
      setEmailStatus(result.emailStatus)
      if (result.emailStatus?.error && !result.emailStatus?.demo) {
        toast('Enquiry saved! Email notification couldn\'t be delivered right now.', { icon: '⚠️' })
      } else {
        toast.success('Enquiry submitted successfully!')
      }
    } else {
      toast.error(sanitizeErrorMessage(result.error, 'Unable to submit enquiry. Please check your inputs and try again.'))
    }
  }

  const change = (field) => (e) => {
    setForm(prev => ({ ...prev, [field]: e.target.value }))
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }))
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl relative max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="bg-tsm-navy-900 rounded-t-2xl px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-white font-bold font-display text-lg">Send Enquiry</h2>
            {vehicle && <p className="text-tsm-navy-300 text-xs mt-0.5 line-clamp-1">{vehicle.name}</p>}
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white transition-colors p-1" aria-label="Close modal">
            <FiX size={20} />
          </button>
        </div>

        <div className="p-6">
          {submitted ? (
            <div className="text-center py-4 space-y-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto text-green-600">
                <FiCheckCircle size={36} />
              </div>
              <h3 className="text-xl font-bold text-tsm-navy-900 font-display">
                Enquiry Submitted Successfully!
              </h3>

              {emailStatus?.error && !emailStatus?.demo ? (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800 text-left flex items-start gap-2">
                  <FiAlertCircle size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
                  <span>
                    Your enquiry was submitted successfully, but we could not send the confirmation email right now. Our team has still received your enquiry and will contact you shortly.
                  </span>
                </div>
              ) : (
                <p className="text-gray-600 text-sm leading-relaxed">
                  Your vehicle enquiry has been received. {form.email ? 'A confirmation email has been sent to your email address.' : ''} TSM Enterprises will contact you shortly to confirm availability, documentation, and pricing.
                </p>
              )}

              <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
                <Link
                  to="/account"
                  onClick={onClose}
                  className="flex-1 py-3 bg-tsm-navy-800 text-white font-semibold rounded-xl hover:bg-tsm-navy-900 text-xs text-center transition-colors"
                >
                  View My Enquiries
                </Link>
                <button
                  onClick={onClose}
                  className="flex-1 py-3 border border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 text-xs transition-colors"
                >
                  Continue Browsing
                </button>
              </div>

              {/* Instant Call / WhatsApp */}
              <div className="pt-3 border-t border-gray-100 flex gap-2">
                <a
                  href="tel:+917759054042"
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-tsm-red-50 text-tsm-red-700 text-xs font-semibold rounded-lg hover:bg-tsm-red-100 transition-colors"
                >
                  <FiPhone size={12} /> Call Now
                </a>
                <a
                  href={`https://wa.me/917759054042?text=${encodeURIComponent(`Hi TSM Enterprises, I just enquired about ${vehicle?.name || 'a vehicle'}.`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-green-50 text-green-700 text-xs font-semibold rounded-lg hover:bg-green-100 transition-colors"
                >
                  <FaWhatsapp size={12} /> WhatsApp
                </a>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              {/* Vehicle badge preview */}
              {vehicle && (
                <div className="bg-tsm-gray-50 rounded-xl p-3 flex items-center gap-3 border border-gray-100">
                  <img
                    src={vehicle.images?.[0] || 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=200&h=150&fit=crop'}
                    alt={vehicle.name}
                    className="w-14 h-11 object-cover rounded-lg flex-shrink-0"
                    onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=200&h=150&fit=crop' }}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-sm text-tsm-navy-900 line-clamp-1">{vehicle.name}</p>
                    <p className="text-xs text-gray-500">{vehicle.year} • {vehicle.fuelType}</p>
                  </div>
                </div>
              )}

              <div>
                <label className="form-label">Full Name *</label>
                <input
                  className={`form-input ${errors.name ? 'border-red-500' : ''}`}
                  placeholder="Enter your full name"
                  value={form.name}
                  onChange={change('name')}
                />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
              </div>

              <div>
                <label className="form-label">Mobile Number *</label>
                <input
                  className={`form-input ${errors.phone ? 'border-red-500' : ''}`}
                  placeholder="10-digit mobile number"
                  value={form.phone}
                  onChange={change('phone')}
                  maxLength={10}
                />
                {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
              </div>

              <div>
                <label className="form-label">Email Address (Optional)</label>
                <input
                  type="email"
                  className={`form-input ${errors.email ? 'border-red-500' : ''}`}
                  placeholder="For confirmation email"
                  value={form.email}
                  onChange={change('email')}
                />
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
              </div>

              <div>
                <label className="form-label">Message / Questions *</label>
                <textarea
                  className={`form-input resize-none ${errors.message ? 'border-red-500' : ''}`}
                  rows={3}
                  placeholder="Tell us about your requirements, preferred timing, document inquiries..."
                  value={form.message}
                  onChange={change('message')}
                />
                {errors.message && <p className="text-red-500 text-xs mt-1">{errors.message}</p>}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-tsm-red-600 text-white font-semibold rounded-xl hover:bg-tsm-red-700 active:scale-[0.99] transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-75 disabled:cursor-not-allowed shadow-btn"
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <FiMessageSquare size={15} /> Submit Enquiry
                  </>
                )}
              </button>

              <div className="pt-2 text-center text-[11px] text-gray-400">
                TSM Enterprises will confirm availability, registration documents, and final pricing directly.
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
