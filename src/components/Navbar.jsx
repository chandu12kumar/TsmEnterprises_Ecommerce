import React, { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { FiMenu, FiX, FiSearch, FiShoppingCart, FiHeart, FiUser, FiLogOut, FiSettings, FiChevronDown } from 'react-icons/fi'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import { useWishlist } from '../context/WishlistContext'
import tsmLogo from '../assets/tsm_logo.jpg'

const NAV_LINKS = [
  { label: 'Home', to: '/' },
  { label: 'About', to: '/about' },
  { label: 'Products', to: '/products' },
  { label: 'Contact', to: '/contact' },
]

export default function Navbar() {
  const { user, logout, isAdmin } = useAuth()
  const { cartCount } = useCart()
  const { wishlistCount } = useWishlist()
  const navigate = useNavigate()
  const { pathname } = useLocation()

  const [menuOpen, setMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [userDropdown, setUserDropdown] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const dropdownRef = React.useRef(null)

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  React.useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setUserDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = async () => {
    setUserDropdown(false)
    setMenuOpen(false)
    await logout()
    navigate('/')
  }

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`)
      setSearchOpen(false)
      setSearchQuery('')
    }
  }

  const isActive = (to) => {
    if (to === '/') return pathname === '/'
    return pathname.startsWith(to)
  }

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-tsm-navy-950/95 backdrop-blur-md shadow-navbar' : 'bg-tsm-navy-950'}`}>
      <div className="container-custom">
        <div className="flex items-center justify-between h-16 lg:h-18">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 flex-shrink-0" onClick={() => setMenuOpen(false)}>
            <img src={tsmLogo} alt="TSM Enterprises Logo" className="w-10 h-10 object-contain flex-shrink-0" />
            <div className="flex flex-col leading-tight">
              <span className="text-white font-bold text-base font-display tracking-wide">TSM Enterprises</span>
              <span className="text-tsm-navy-300 text-[9px] uppercase tracking-widest font-medium hidden sm:block">Quality Second-Hand Vehicles</span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden lg:flex items-center gap-1">
            {NAV_LINKS.map(link => (
              <Link
                key={link.to}
                to={link.to}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive(link.to)
                    ? 'text-white bg-white/10'
                    : 'text-tsm-navy-300 hover:text-white hover:bg-white/5'
                }`}
              >
                {link.label}
              </Link>
            ))}
            {isAdmin && (
              <Link
                to="/admin"
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive('/admin') ? 'text-tsm-red-400 bg-tsm-red-900/20' : 'text-tsm-red-400 hover:bg-tsm-red-900/20'
                }`}
              >
                Admin
              </Link>
            )}
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-1">
            {/* Search */}
            <button
              onClick={() => setSearchOpen(!searchOpen)}
              className="p-2 text-tsm-navy-300 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200"
              aria-label="Search"
            >
              <FiSearch size={18} />
            </button>

            {/* Wishlist - only visible when logged in */}
            {user && (
              <Link to="/wishlist" className="p-2 text-tsm-navy-300 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200 relative" aria-label="Wishlist">
                <FiHeart size={18} />
                {wishlistCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-tsm-red-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {wishlistCount > 9 ? '9+' : wishlistCount}
                  </span>
                )}
              </Link>
            )}

            {/* Cart - only visible when logged in */}
            {user && (
              <Link to="/cart" className="p-2 text-tsm-navy-300 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200 relative" aria-label="Cart">
                <FiShoppingCart size={18} />
                {cartCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-tsm-red-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {cartCount > 9 ? '9+' : cartCount}
                  </span>
                )}
              </Link>
            )}

            {/* User / Auth */}
            {user ? (
              <div ref={dropdownRef} className="relative hidden lg:block">
                <button
                  onClick={() => setUserDropdown(!userDropdown)}
                  className="flex items-center gap-2 px-3 py-1.5 text-tsm-navy-200 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200"
                >
                  <div className="w-7 h-7 bg-tsm-red-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-bold">{user.name?.charAt(0).toUpperCase()}</span>
                  </div>
                  <span className="text-sm font-medium">{user.name?.split(' ')[0]}</span>
                  <FiChevronDown size={14} className={`transition-transform duration-200 ${userDropdown ? 'rotate-180' : ''}`} />
                </button>
                {userDropdown && (
                  <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50 animate-fade-in">
                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="text-sm font-semibold text-gray-900">{user.name}</p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                    </div>
                    <Link
                      to="/account"
                      onClick={() => setUserDropdown(false)}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-tsm-red-600 transition-colors"
                    >
                      <FiUser size={14} /> My Account
                    </Link>
                    {isAdmin && (
                      <Link
                        to="/admin"
                        onClick={() => setUserDropdown(false)}
                        className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-tsm-red-600 transition-colors"
                      >
                        <FiSettings size={14} /> Admin Panel
                      </Link>
                    )}
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors text-left"
                    >
                      <FiLogOut size={14} /> Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                to="/account"
                className="hidden lg:flex items-center gap-1.5 px-4 py-2 bg-tsm-red-600 text-white text-sm font-semibold rounded-lg hover:bg-tsm-red-700 transition-all duration-200"
              >
                <FiUser size={14} /> Login
              </Link>
            )}

            {/* Mobile hamburger */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="lg:hidden p-2 text-tsm-navy-300 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200 ml-1"
              aria-label="Toggle menu"
            >
              {menuOpen ? <FiX size={20} /> : <FiMenu size={20} />}
            </button>
          </div>
        </div>

        {/* Search Bar Dropdown */}
        {searchOpen && (
          <div className="pb-3 animate-slide-up">
            <form onSubmit={handleSearch} className="flex gap-2">
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search vehicles (e.g. Mahindra Tractor, Cargo Auto...)"
                className="flex-1 px-4 py-2.5 bg-white/10 text-white placeholder-tsm-navy-400 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-tsm-red-500 text-sm"
                autoFocus
              />
              <button type="submit" className="px-4 py-2.5 bg-tsm-red-600 text-white rounded-lg hover:bg-tsm-red-700 transition-colors text-sm font-medium">
                Search
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="lg:hidden bg-tsm-navy-900 border-t border-white/10 mobile-menu-enter">
          <div className="container-custom py-4 space-y-1">
            {NAV_LINKS.map(link => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMenuOpen(false)}
                className={`block px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive(link.to)
                    ? 'text-white bg-white/10'
                    : 'text-tsm-navy-300 hover:text-white hover:bg-white/5'
                }`}
              >
                {link.label}
              </Link>
            ))}
            {isAdmin && (
              <Link to="/admin" onClick={() => setMenuOpen(false)} className="block px-4 py-3 rounded-lg text-sm font-medium text-tsm-red-400">
                Admin Panel
              </Link>
            )}
            <div className="pt-2 border-t border-white/10 mt-2 flex flex-col gap-2">
              {user ? (
                <>
                  <Link to="/account" onClick={() => setMenuOpen(false)} className="flex items-center gap-2 px-4 py-3 text-sm text-tsm-navy-200 hover:text-white">
                    <FiUser size={14} /> {user.name}
                  </Link>
                  <button type="button" onClick={handleLogout} className="flex items-center gap-2 px-4 py-2.5 text-sm text-red-400 hover:text-red-300">
                    <FiLogOut size={14} /> Logout
                  </button>
                </>
              ) : (
                <Link to="/account" onClick={() => setMenuOpen(false)} className="flex items-center justify-center gap-1.5 px-4 py-3 bg-tsm-red-600 text-white text-sm font-semibold rounded-lg">
                  <FiUser size={14} /> Login / Register
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}
