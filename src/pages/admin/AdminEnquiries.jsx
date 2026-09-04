import { useState, useEffect } from 'react'
import {
  FiMessageSquare, FiPhone, FiMail, FiTrash2, FiSearch,
  FiFilter, FiCheckCircle, FiClock, FiCalendar, FiExternalLink, FiRefreshCw, FiAlertCircle
} from 'react-icons/fi'
import { FaWhatsapp } from 'react-icons/fa'
import AdminLayout from './AdminLayout'
import { enquiryService } from '../../services/enquiryService'
import { sanitizeErrorMessage } from '../../utils/errorHandler'
import toast from 'react-hot-toast'

const STATUS_OPTIONS = [
  { value: 'new', label: 'New', color: 'bg-blue-100 text-blue-700' },
  { value: 'contacted', label: 'Contacted', color: 'bg-yellow-100 text-yellow-700' },
  { value: 'negotiating', label: 'Negotiating', color: 'bg-purple-100 text-purple-700' },
  { value: 'completed', label: 'Completed', color: 'bg-green-100 text-green-700' },
  { value: 'cancelled', label: 'Cancelled', color: 'bg-red-100 text-red-700' },
]

export default function AdminEnquiries() {
  const [enquiries, setEnquiries] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [retryingId, setRetryingId] = useState(null)

  useEffect(() => {
    loadEnquiries()
  }, [])

  const loadEnquiries = async () => {
    const { data } = await enquiryService.getAllEnquiries()
    if (data) setEnquiries(data)
  }

  const updateStatus = async (id, newStatus) => {
    const { success, error } = await enquiryService.updateEnquiryStatus(id, newStatus)
    if (success) {
      setEnquiries(prev => prev.map(e => (e.id === id ? { ...e, status: newStatus } : e)))
      toast.success(`Enquiry status updated to ${newStatus}`)
    } else {
      toast.error(sanitizeErrorMessage(error, 'Failed to update status.'))
    }
  }

  const handleDelete = async (id) => {
    if (window.confirm('Delete this enquiry record?')) {
      const { success, error } = await enquiryService.deleteEnquiry(id)
      if (success) {
        setEnquiries(prev => prev.filter(e => e.id !== id))
        toast.success('Enquiry deleted')
      } else {
        toast.error(sanitizeErrorMessage(error, 'Delete failed.'))
      }
    }
  }

  const handleRetryEmail = async (id) => {
    setRetryingId(id)
    const { success, error } = await enquiryService.retryEmail(id)
    setRetryingId(null)
    if (success) {
      toast.success('Email re-sent successfully!')
      loadEnquiries()
    } else {
      toast.error(sanitizeErrorMessage(error, 'Email dispatch failed.'))
    }
  }

  const filtered = enquiries.filter(e => {
    const term = searchTerm.toLowerCase()
    const matchesSearch = (e.name || '').toLowerCase().includes(term) ||
                          (e.phone || '').includes(term) ||
                          (e.vehicleName || '').toLowerCase().includes(term) ||
                          (e.message || '').toLowerCase().includes(term)
    const matchesStatus = !filterStatus || e.status === filterStatus
    return matchesSearch && matchesStatus
  })

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-tsm-navy-900 font-display">Customer Enquiries</h1>
          <p className="text-gray-500 text-sm mt-0.5">Manage customer inquiries, view vehicle interest, and monitor email delivery status</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-4 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Search by customer name, phone, vehicle..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="form-input pl-10 text-sm"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="form-select text-sm sm:w-52"
          >
            <option value="">All Statuses</option>
            {STATUS_OPTIONS.map(s => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>

        {/* Enquiries Grid/Table */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-tsm-navy-900 text-white uppercase text-xs font-semibold">
                <tr>
                  <th className="px-5 py-4">Customer Details</th>
                  <th className="px-4 py-4">Vehicle Interested</th>
                  <th className="px-4 py-4">Message / Notes</th>
                  <th className="px-4 py-4">Status</th>
                  <th className="px-4 py-4">Email Status</th>
                  <th className="px-4 py-4">Date</th>
                  <th className="px-5 py-4 text-right">Connect / Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center py-10 text-gray-400">
                      No enquiries found.
                    </td>
                  </tr>
                ) : (
                  filtered.map(enq => {
                    const statusObj = STATUS_OPTIONS.find(s => s.value === enq.status) || STATUS_OPTIONS[0]
                    const customerEmailSent = enq.customerEmailLog?.status === 'sent'
                    const adminEmailSent = enq.adminEmailLog?.status === 'sent'

                    return (
                      <tr key={enq.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-5 py-4">
                          <div className="font-semibold text-tsm-navy-900">{enq.name}</div>
                          <div className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                            <FiPhone size={11} className="text-tsm-red-500" /> {enq.phone}
                          </div>
                          {enq.email && (
                            <div className="text-xs text-gray-400 flex items-center gap-1">
                              <FiMail size={11} /> {enq.email}
                            </div>
                          )}
                          <div className="text-[10px] text-gray-400 mt-1 uppercase">
                            Prefers: <span className="font-semibold text-tsm-navy-800">{enq.preferredContact || 'Phone'}</span>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <span className="font-semibold text-tsm-navy-800 text-sm">
                            {enq.vehicleName || 'General Enquiry'}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <p className="text-xs text-gray-600 max-w-xs line-clamp-3 bg-gray-50 p-2 rounded-lg border border-gray-100">
                            {enq.message || 'No additional message.'}
                          </p>
                        </td>
                        <td className="px-4 py-4">
                          <select
                            value={enq.status}
                            onChange={(e) => updateStatus(enq.id, e.target.value)}
                            className={`text-xs font-semibold rounded-lg px-2.5 py-1 border border-gray-200 cursor-pointer ${statusObj.color}`}
                          >
                            {STATUS_OPTIONS.map(opt => (
                              <option key={opt.value} value={opt.value} className="bg-white text-gray-800">
                                {opt.label}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-4 py-4 text-xs">
                          {enq.email ? (
                            <div className="space-y-1">
                              <div className="flex items-center gap-1 text-[11px]">
                                <span className={customerEmailSent ? 'text-green-600 font-semibold' : 'text-gray-400'}>
                                  Customer: {customerEmailSent ? '✓ Sent' : '— Queued'}
                                </span>
                              </div>
                              <div className="flex items-center gap-1 text-[11px]">
                                <span className={adminEmailSent ? 'text-green-600 font-semibold' : 'text-gray-400'}>
                                  Admin: {adminEmailSent ? '✓ Sent' : '— Queued'}
                                </span>
                              </div>
                            </div>
                          ) : (
                            <span className="text-[11px] text-gray-400">No email provided</span>
                          )}
                        </td>
                        <td className="px-4 py-4 text-xs text-gray-400 whitespace-nowrap">
                          {enq.createdAt ? new Date(enq.createdAt).toLocaleDateString('en-IN', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          }) : '—'}
                        </td>
                        <td className="px-5 py-4 text-right">
                          <div className="inline-flex items-center gap-2">
                            {/* Call */}
                            <a
                              href={`tel:${enq.phone}`}
                              className="p-2 text-tsm-navy-800 bg-gray-100 hover:bg-tsm-navy-800 hover:text-white rounded-lg transition-colors"
                              title="Call Customer"
                            >
                              <FiPhone size={14} />
                            </a>
                            {/* WhatsApp */}
                            <a
                              href={`https://wa.me/91${enq.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hello ${enq.name}, this is TSM Enterprises regarding your enquiry for ${enq.vehicleName || 'our vehicles'}.`)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 text-green-700 bg-green-50 hover:bg-green-600 hover:text-white rounded-lg transition-colors"
                              title="WhatsApp Customer"
                            >
                              <FaWhatsapp size={14} />
                            </a>
                            {/* Retry Email */}
                            {enq.email && (
                              <button
                                onClick={() => handleRetryEmail(enq.id)}
                                disabled={retryingId === enq.id}
                                className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-600 hover:text-white rounded-lg transition-colors disabled:opacity-50"
                                title="Resend Notification Emails"
                              >
                                <FiRefreshCw size={13} className={retryingId === enq.id ? 'animate-spin' : ''} />
                              </button>
                            )}
                            {/* Delete */}
                            <button
                              onClick={() => handleDelete(enq.id)}
                              className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete Enquiry"
                            >
                              <FiTrash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
