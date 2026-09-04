import { useState } from 'react'
import { Link, useLocation, Navigate } from 'react-router-dom'
import {
  FiGrid, FiTruck, FiMessageSquare, FiUsers, FiMenu, FiX,
  FiHome, FiLogOut, FiChevronRight
} from 'react-icons/fi'
import { useAuth } from '../../context/AuthContext'

const ADMIN_NAV = [
  { to: '/admin', icon: <FiGrid size={16} />, label: 'Dashboard' },
  { to: '/admin/vehicles', icon: <FiTruck size={16} />, label: 'Vehicles' },
  { to: '/admin/enquiries', icon: <FiMessageSquare size={16} />, label: 'Enquiries' },
  { to: '/admin/customers', icon: <FiUsers size={16} />, label: 'Customers' },
]

export default function AdminLayout({ children }) {
  const { user, isAdmin, logout } = useAuth()
  const { pathname } = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  if (!user) return <Navigate to="/account" replace />
  if (!isAdmin) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <span className="text-6xl block mb-4">🔐</span>
        <h2 className="text-xl font-bold text-gray-800 mb-2">Admin Access Required</h2>
        <p className="text-gray-500 mb-4">You don't have admin privileges.</p>
        <Link to="/" className="btn-primary">Go Home</Link>
      </div>
    </div>
  )

  const isActive = (to) => pathname === to

  return (
    <div className="flex min-h-screen bg-tsm-gray-50">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-60 bg-tsm-navy-950 transform transition-transform duration-300 lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:relative lg:flex lg:flex-col`}>
        {/* Logo */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-tsm-red-600 rounded-lg flex items-center justify-center">
              <span className="text-white text-xs font-bold">TSM</span>
            </div>
            <div>
              <div className="text-white text-sm font-bold font-display">TSM Admin</div>
              <div className="text-tsm-navy-400 text-[9px]">Dashboard</div>
            </div>
          </Link>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-white/60 hover:text-white">
            <FiX size={18} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {ADMIN_NAV.map(item => (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => setSidebarOpen(false)}
              className={`admin-nav-item ${isActive(item.to) ? 'active' : 'text-tsm-navy-400'}`}
            >
              {item.icon}
              <span>{item.label}</span>
              {isActive(item.to) && <FiChevronRight size={14} className="ml-auto" />}
            </Link>
          ))}
        </nav>

        {/* Bottom */}
        <div className="px-3 py-4 border-t border-white/10 space-y-1">
          <Link to="/" className="admin-nav-item text-tsm-navy-400">
            <FiHome size={16} /> View Site
          </Link>
          <button onClick={logout} className="admin-nav-item text-red-400 hover:text-red-300 w-full text-left">
            <FiLogOut size={16} /> Logout
          </button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-30">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-1.5 text-gray-500 hover:text-gray-700">
            <FiMenu size={20} />
          </button>
          <div className="hidden lg:block text-sm text-gray-500">
            {ADMIN_NAV.find(n => n.to === pathname)?.label || 'Admin'}
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-tsm-red-600 rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-bold">{user.name?.charAt(0)}</span>
            </div>
            <div className="hidden sm:block">
              <div className="text-sm font-semibold text-gray-800">{user.name}</div>
              <div className="text-xs text-gray-500">Administrator</div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 sm:p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
