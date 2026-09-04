import { useState } from 'react'
import { FiPhone, FiMail, FiMapPin, FiClock, FiMessageSquare, FiUser, FiSend } from 'react-icons/fi'
import { FaWhatsapp } from 'react-icons/fa'
import toast from 'react-hot-toast'

import { useAuth } from '../context/AuthContext'
import { enquiryService } from '../services/enquiryService'
import { sanitizeErrorMessage } from '../utils/errorHandler'

export default function Contact() {
  const { user } = useAuth()
  const [form, setForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    email: user?.email || '',
    vehicle: '',
    message: '',
  })
  const [errors, setErrors] = useState({})
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [emailStatus, setEmailStatus] = useState(null)

  const validate = () => {
    const errs = {}
    if (!form.name.trim()) errs.name = 'Name is required'
    if (!form.phone || !/^[0-9]{10}$/.test(form.phone.replace(/[^0-9]/g, ''))) errs.phone = '10-digit mobile number required'
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Invalid email'
    if (!form.message.trim()) errs.message = 'Message is required'
    return errs
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }

    setLoading(true)
    const result = await enquiryService.submitEnquiry({
      userId: user?.id,
      name: form.name.trim(),
      phone: form.phone.trim(),
      email: form.email.trim(),
      vehicleName: form.vehicle.trim() || 'General Enquiry',
      message: form.message.trim(),
    })
    setLoading(false)

    if (result.success) {
      setSubmitted(true)
      setEmailStatus(result.emailStatus)
      toast.success('Enquiry submitted! TSM Enterprises will contact you shortly.')
    } else {
      toast.error(sanitizeErrorMessage(result.error, 'Unable to send enquiry. Please check your inputs and try again.'))
    }
  }

  const change = (field) => (e) => {
    setForm(p => ({ ...p, [field]: e.target.value }))
    if (errors[field]) setErrors(p => ({ ...p, [field]: '' }))
  }

  return (
    <main className="pt-16">
      {/* Hero */}
      <section className="bg-tsm-navy-950 py-20">
        <div className="container-custom text-center">
          <span className="inline-block px-3 py-1 bg-tsm-red-600/20 text-tsm-red-400 text-sm font-semibold rounded-full mb-4 uppercase tracking-wide">Contact Us</span>
          <h1 className="text-4xl md:text-5xl font-bold text-white font-display mb-4">Get in Touch</h1>
          <div className="h-1 w-16 bg-tsm-red-600 rounded-full mx-auto mb-5" />
          <p className="text-tsm-navy-300 text-lg max-w-xl mx-auto">
            Have a question about a vehicle? Ready to buy? Contact TSM Enterprises — we respond quickly!
          </p>
        </div>
      </section>

      <section className="section bg-tsm-gray-50">
        <div className="container-custom">
          <div className="grid lg:grid-cols-2 gap-10">
            {/* Contact Info */}
            <div className="space-y-5">
              <div>
                <h2 className="text-2xl font-bold text-tsm-navy-900 font-display mb-1">TSM Enterprises</h2>
                <p className="text-gray-500 text-sm">Trusted dealer of quality second-hand commercial and agricultural vehicles.</p>
              </div>

              {/* Cards */}
              {[
                {
                  icon: <FiPhone size={20} className="text-tsm-red-600" />,
                  title: 'Phone',
                  lines: ['+91 77590 54042'],
                  action: { label: 'Call Now', href: 'tel:+917759054042', color: 'bg-tsm-navy-800 text-white hover:bg-tsm-navy-900' },
                },
                {
                  icon: <FaWhatsapp size={20} className="text-green-600" />,
                  title: 'WhatsApp',
                  lines: ['+91 77590 54042', 'Chat anytime — quick response'],
                  action: {
                    label: 'Chat on WhatsApp',
                    href: 'https://wa.me/917759054042?text=Hi%20TSM%20Enterprises!%20I\'m%20interested%20in%20your%20vehicles.',
                    color: 'bg-green-600 text-white hover:bg-green-700',
                    external: true,
                  },
                },
                {
                  icon: <FiMail size={20} className="text-blue-600" />,
                  title: 'Email',
                  lines: ['kamikimnekaku@gmail.com'],
                  action: { label: 'Send Email', href: 'mailto:kamikimnekaku@gmail.com', color: 'bg-blue-600 text-white hover:bg-blue-700' },
                },
                {
                  icon: <FiMapPin size={20} className="text-orange-600" />,
                  title: 'Address',
                  lines: ['Near Govt Bus Stand, Gayatri Nagar', 'Khunti, Jharkhand, India'],
                },
                {
                  icon: <FiClock size={20} className="text-purple-600" />,
                  title: 'Business Hours',
                  lines: ['Monday – Saturday: 9 AM – 7 PM', 'Sunday: 10 AM – 4 PM'],
                },
              ].map((c, i) => (
                <div key={i} className="card p-5 flex items-start gap-4">
                  <div className="w-11 h-11 bg-gray-50 rounded-xl flex items-center justify-center flex-shrink-0">
                    {c.icon}
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-tsm-navy-900 text-sm mb-1">{c.title}</p>
                    {c.lines.map((l, j) => <p key={j} className="text-gray-600 text-sm">{l}</p>)}
                    {c.action && (
                      <a
                        href={c.action.href}
                        target={c.action.external ? '_blank' : undefined}
                        rel={c.action.external ? 'noopener noreferrer' : undefined}
                        className={`inline-flex items-center gap-1.5 mt-2.5 px-4 py-2 text-xs font-semibold rounded-lg transition-colors ${c.action.color}`}
                      >
                        {c.action.label}
                      </a>
                    )}
                  </div>
                </div>
              ))}

              {/* Map Placeholder */}
              <div className="card overflow-hidden">
                <div className="bg-gray-100 h-48 flex items-center justify-center relative">
                  <img
                    src="https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?w=600&h=300&fit=crop"
                    alt="Location map area"
                    className="w-full h-full object-cover opacity-60"
                  />
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <FiMapPin size={32} className="text-tsm-red-600 mb-2" />
                    <p className="text-tsm-navy-900 font-semibold text-sm">Khunti, Jharkhand</p>
                    <a
                      href="https://maps.google.com/?q=Mahindra+Genuine+Spare+Parts,+Ranchi+Rd,+opposite+Reliable+Automotive,+near+KTM+Showroom,+Jannat+Nagar,+Khunti,+Jharkhand+835210 "
                      target="_blank" rel="noopener noreferrer"
                      className="mt-2 px-3 py-1.5 bg-tsm-red-600 text-white text-xs font-semibold rounded-lg hover:bg-tsm-red-700 transition-colors"
                    >
                      Open in Maps
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div className="card p-6 md:p-8">
              {submitted ? (
                <div className="text-center py-12">
                  <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
                    <span className="text-4xl">✅</span>
                  </div>
                  <h3 className="text-2xl font-bold text-tsm-navy-900 font-display mb-3">Message Sent!</h3>
                  <p className="text-gray-600 mb-6">
                    Thank you! <strong>TSM Enterprises</strong> will contact you shortly.
                  </p>
                  <div className="flex gap-3 justify-center">
                    <a href="tel:+917759054042" className="flex items-center gap-2 px-5 py-2.5 bg-tsm-navy-800 text-white text-sm font-semibold rounded-xl hover:bg-tsm-navy-900 transition-colors">
                      <FiPhone size={14} /> Call Now
                    </a>
                    <a
                      href="https://wa.me/917759054042"
                      target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white text-sm font-semibold rounded-xl hover:bg-green-700 transition-colors"
                    >
                      <FaWhatsapp size={14} /> WhatsApp
                    </a>
                  </div>
                </div>
              ) : (
                <>
                  <h2 className="text-2xl font-bold text-tsm-navy-900 font-display mb-5 flex items-center gap-2">
                    <FiMessageSquare className="text-tsm-red-600" size={22} />
                    Send an Enquiry
                  </h2>

                  <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="form-label">Full Name *</label>
                        <div className="relative">
                          <FiUser size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                          <input className={`form-input pl-10 ${errors.name ? 'border-red-400' : ''}`} placeholder="Your name" value={form.name} onChange={change('name')} />
                        </div>
                        {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                      </div>
                      <div>
                        <label className="form-label">Mobile Number *</label>
                        <div className="relative">
                          <FiPhone size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                          <input className={`form-input pl-10 ${errors.phone ? 'border-red-400' : ''}`} placeholder="10-digit mobile" value={form.phone} onChange={change('phone')} maxLength={10} />
                        </div>
                        {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
                      </div>
                    </div>

                    <div>
                      <label className="form-label">Email Address (Optional)</label>
                      <div className="relative">
                        <FiMail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input type="email" className={`form-input pl-10 ${errors.email ? 'border-red-400' : ''}`} placeholder="your@email.com" value={form.email} onChange={change('email')} />
                      </div>
                      {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                    </div>

                    <div>
                      <label className="form-label">Vehicle of Interest</label>
                      <input className="form-input" placeholder="e.g. Mahindra Tractor, Cargo Auto..." value={form.vehicle} onChange={change('vehicle')} />
                    </div>

                    <div>
                      <label className="form-label">Message *</label>
                      <textarea
                        className={`form-input resize-none ${errors.message ? 'border-red-400' : ''}`}
                        rows={4}
                        placeholder="Tell us what you're looking for, your budget, preferred location, etc."
                        value={form.message}
                        onChange={change('message')}
                      />
                      {errors.message && <p className="text-red-500 text-xs mt-1">{errors.message}</p>}
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-4 bg-tsm-red-600 text-white font-bold rounded-xl hover:bg-tsm-red-700 active:scale-[0.99] transition-all flex items-center justify-center gap-2"
                    >
                      {loading ? (
                        <><span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Sending...</>
                      ) : (
                        <><FiSend size={16} /> Submit Enquiry</>
                      )}
                    </button>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
