import { useState, useEffect } from 'react'
import { FiUsers, FiSearch, FiPhone, FiMail, FiMapPin, FiCalendar, FiShield, FiHeart } from 'react-icons/fi'
import AdminLayout from './AdminLayout'

import { customerService } from '../../services/customerService'

export default function AdminCustomers() {
  const [customers, setCustomers] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    const loadCustomers = async () => {
      setLoading(true)
      const { data } = await customerService.getCustomers(searchTerm)
      if (mounted) {
        setCustomers(data || [])
        setLoading(false)
      }
    }

    const timer = setTimeout(loadCustomers, 250)
    return () => {
      mounted = false
      clearTimeout(timer)
    }
  }, [searchTerm])

  const filtered = customers

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-tsm-navy-900 font-display">Registered Customers</h1>
          <p className="text-gray-500 text-sm mt-0.5">View user profiles, contact information, and registration dates</p>
        </div>

        {/* Search Bar */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-4">
          <div className="relative">
            <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Search by name, email, phone number, or city..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="form-input pl-10 text-sm"
            />
          </div>
        </div>

        {/* Customer Cards & Table */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-tsm-navy-900 text-white uppercase text-xs font-semibold">
                <tr>
                  <th className="px-5 py-4">Customer</th>
                  <th className="px-4 py-4">Contact</th>
                  <th className="px-4 py-4">Location</th>
                  <th className="px-4 py-4">Role</th>
                  <th className="px-5 py-4 text-right">Joined Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="text-center py-10 text-gray-400">
                      No customers found matching your search.
                    </td>
                  </tr>
                ) : (
                  filtered.map(cust => (
                    <tr key={cust.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-tsm-navy-800 text-white font-bold rounded-full flex items-center justify-center flex-shrink-0 text-sm">
                            {cust.name?.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-semibold text-tsm-navy-900">{cust.name}</div>
                            <div className="text-xs text-gray-400">ID: {cust.id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-xs">
                        <div className="flex items-center gap-1.5 text-gray-700 font-medium">
                          <FiPhone size={12} className="text-tsm-red-500" />
                          <a href={`tel:${cust.phone}`} className="hover:underline">{cust.phone || '—'}</a>
                        </div>
                        <div className="flex items-center gap-1.5 text-gray-400 mt-0.5">
                          <FiMail size={12} />
                          <span>{cust.email || '—'}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-xs">
                        <div className="flex items-center gap-1 text-gray-600">
                          <FiMapPin size={12} className="text-gray-400" />
                          <span>{cust.city || 'Tamil Nadu'}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          cust.role === 'admin'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}>
                          {cust.role === 'admin' && <FiShield size={10} />}
                          {cust.role === 'admin' ? 'Administrator' : 'Customer'}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right text-xs text-gray-400">
                        {cust.createdAt ? new Date(cust.createdAt).toLocaleDateString('en-IN', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        }) : '—'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
