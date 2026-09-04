import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { FiTruck, FiCheckCircle, FiXCircle, FiUsers, FiMessageSquare, FiClock, FiArrowRight } from 'react-icons/fi'
import AdminLayout from './AdminLayout'
import { vehicleService } from '../../services/vehicleService'
import { enquiryService } from '../../services/enquiryService'
import { customerService } from '../../services/customerService'

export default function AdminDashboard() {
  const [vehicles, setVehicles] = useState([])
  const [enquiries, setEnquiries] = useState([])
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    const loadData = async () => {
      setLoading(true)
      const [vRes, eRes, cRes] = await Promise.all([
        vehicleService.getVehicles(),
        enquiryService.getAllEnquiries(),
        customerService.getCustomers(),
      ])
      if (mounted) {
        setVehicles(vRes.data || [])
        setEnquiries(eRes.data || [])
        setCustomers(cRes.data || [])
        setLoading(false)
      }
    }
    loadData()
    return () => {
      mounted = false
    }
  }, [])

  const available = vehicles.filter(v => v.status === 'available').length
  const sold = vehicles.filter(v => v.status === 'sold').length
  const newEnquiries = enquiries.filter(e => e.status === 'new').length
  const pendingEnquiries = enquiries.filter(e => e.status === 'contacted' || e.status === 'negotiating').length

  const STATS = [
    { icon: <FiTruck size={22} />, label: 'Total Vehicles', value: vehicles.length, color: 'bg-blue-500', to: '/admin/vehicles' },
    { icon: <FiCheckCircle size={22} />, label: 'Available', value: available, color: 'bg-green-500', to: '/admin/vehicles' },
    { icon: <FiXCircle size={22} />, label: 'Sold', value: sold, color: 'bg-red-500', to: '/admin/vehicles' },
    { icon: <FiUsers size={22} />, label: 'Customers', value: customers.length, color: 'bg-purple-500', to: '/admin/customers' },
    { icon: <FiMessageSquare size={22} />, label: 'Total Enquiries', value: enquiries.length, color: 'bg-orange-500', to: '/admin/enquiries' },
    { icon: <FiClock size={22} />, label: 'New Enquiries', value: newEnquiries, color: 'bg-yellow-500', to: '/admin/enquiries' },
  ]

  const recentEnquiries = enquiries.slice(0, 5)
  const recentVehicles = vehicles.slice(0, 4)

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-tsm-navy-900 font-display">Dashboard</h1>
          <p className="text-gray-500 text-sm mt-0.5">Welcome back! Here's live inventory and customer enquiry data at TSM Enterprises.</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-4">
          {STATS.map((s, i) => (
            <Link key={i} to={s.to} className="bg-white rounded-2xl border border-gray-100 shadow-card p-4 hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-200">
              <div className={`w-10 h-10 ${s.color} rounded-xl flex items-center justify-center text-white mb-3`}>
                {s.icon}
              </div>
              <div className="text-2xl font-bold text-tsm-navy-900 font-display">
                {loading ? '—' : s.value}
              </div>
              <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
            </Link>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Recent Enquiries */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-card">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 className="font-bold text-tsm-navy-900">Recent Enquiries</h2>
              <Link to="/admin/enquiries" className="text-xs text-tsm-red-600 hover:underline flex items-center gap-1">
                View All <FiArrowRight size={11} />
              </Link>
            </div>
            {recentEnquiries.length === 0 ? (
              <div className="py-10 text-center text-gray-400 text-sm">
                {loading ? 'Loading enquiries...' : 'No enquiries yet'}
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {recentEnquiries.map(enq => (
                  <div key={enq.id} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors">
                    <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <FiMessageSquare size={14} className="text-orange-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-tsm-navy-900 text-sm line-clamp-1">{enq.name}</p>
                      <p className="text-xs text-gray-400 line-clamp-1">{enq.vehicleName || 'General Enquiry'}</p>
                    </div>
                    <span className={`badge text-[10px] status-${enq.status}`}>{enq.status}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Vehicles */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-card">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 className="font-bold text-tsm-navy-900">Vehicle Inventory</h2>
              <Link to="/admin/vehicles" className="text-xs text-tsm-red-600 hover:underline flex items-center gap-1">
                Manage <FiArrowRight size={11} />
              </Link>
            </div>
            <div className="divide-y divide-gray-50">
              {recentVehicles.map(v => (
                <div key={v.id} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors">
                  <img
                    src={v.images?.[0]}
                    alt={v.name}
                    className="w-12 h-9 rounded-lg object-cover flex-shrink-0"
                    onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=100&h=80&fit=crop' }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-tsm-navy-900 text-sm line-clamp-1">{v.name}</p>
                    <p className="text-xs text-gray-400">{v.year} • {v.brand}</p>
                  </div>
                  <span className={`badge text-[10px] ${v.status === 'available' ? 'badge-available' : 'badge-sold'}`}>
                    {v.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
