import { Link } from 'react-router-dom'
import { FiFacebook, FiInstagram, FiYoutube, FiPhone, FiMail, FiMapPin, FiClock } from 'react-icons/fi'
import { FaWhatsapp } from 'react-icons/fa'
import tsmLogo from '../assets/tsm_logo.jpg'

const QUICK_LINKS = [
  { label: 'Home', to: '/' },
  { label: 'About Us', to: '/about' },
  { label: 'Products', to: '/products' },
  { label: 'Cart', to: '/cart' },
  { label: 'Wishlist', to: '/wishlist' },
  { label: 'Contact', to: '/contact' },
]

const VEHICLE_CATEGORIES = [
  { label: 'Auto Rickshaw', to: '/products?category=auto-rickshaw' },
  { label: 'Cargo Auto', to: '/products?category=cargo-auto' },
  { label: 'Tractor', to: '/products?category=tractor' },
  { label: 'Pickup Truck', to: '/products?category=pickup-truck' },
  { label: 'Mini Truck', to: '/products?category=mini-truck' },
  { label: 'Commercial Vehicles', to: '/products?category=commercial' },
  { label: 'Agricultural Vehicles', to: '/products?category=agricultural' },
]

const SUPPORT_LINKS = [
  { label: 'Contact Us', to: '/contact' },
  { label: 'FAQ', to: '/faq' },
  { label: 'Terms & Conditions', to: '/terms' },
  { label: 'Privacy Policy', to: '/privacy' },
]

export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="bg-tsm-navy-950 text-tsm-navy-300">
      {/* Main Footer */}
      <div className="container-custom py-14">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-8">

          {/* Brand */}
          <div className="sm:col-span-2 lg:col-span-1">
            <Link to="/" className="flex items-center gap-2.5 mb-4">
              <img src={tsmLogo} alt="TSM Enterprises Logo" className="w-10 h-10 object-contain flex-shrink-0" />
              <span className="text-white font-bold text-lg font-display">TSM Enterprises</span>
            </Link>
            <p className="text-sm leading-relaxed mb-5">
              Trusted seller of quality second-hand commercial and agricultural vehicles. Serving farmers, businesses, and individuals across Jharkhand.
            </p>

            {/* Contact Info */}
            <div className="space-y-2.5 text-sm">
              <div className="flex items-start gap-2.5">
                <FiPhone size={14} className="text-tsm-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <a href="tel:+917759054042" className="hover:text-white transition-colors">+91 77590 54042</a>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <FiMail size={14} className="text-tsm-red-400 flex-shrink-0 mt-0.5" />
                <a href="mailto:kamikimnekaku@gmail.com" className="hover:text-white transition-colors">kamikimnekaku@gmail.com</a>
              </div>
              <div className="flex items-start gap-2.5">
                <FiMapPin size={14} className="text-tsm-red-400 flex-shrink-0 mt-0.5" />
                <span>Near Govt Bus Stand, Gayatri Nagar, Khunti, Jharkhand</span>
              </div>
              <div className="flex items-start gap-2.5">
                <FiClock size={14} className="text-tsm-red-400 flex-shrink-0 mt-0.5" />
                <span>Mon – Sat: 9 AM – 7 PM</span>
              </div>
            </div>

            {/* Social */}
            <div className="flex items-center gap-3 mt-5">
              <a href="https://www.facebook.com/share/1GGtX3tzbb/" target="_blank" rel="noopener noreferrer"
                className="w-9 h-9 bg-white/10 hover:bg-tsm-red-600 rounded-lg flex items-center justify-center text-tsm-navy-300 hover:text-white transition-all duration-200">
                <FiFacebook size={16} />
              </a>
              <a href="https://www.instagram.com/tsm_enterprises?igsi=MWlqNjVxaDhhc2V0ZQ==" target="_blank" rel="noopener noreferrer"
                className="w-9 h-9 bg-white/10 hover:bg-tsm-red-600 rounded-lg flex items-center justify-center text-tsm-navy-300 hover:text-white transition-all duration-200">
                <FiInstagram size={16} />
              </a>
              <a href="https://www.youtube.com/@TSMEnterprises2017" target="_blank" rel="noopener noreferrer"
                className="w-9 h-9 bg-white/10 hover:bg-tsm-red-600 rounded-lg flex items-center justify-center text-tsm-navy-300 hover:text-white transition-all duration-200">
                <FiYoutube size={16} />
              </a>
              <a href="https://wa.me/917759054042" target="_blank" rel="noopener noreferrer"
                className="w-9 h-9 bg-white/10 hover:bg-green-600 rounded-lg flex items-center justify-center text-tsm-navy-300 hover:text-white transition-all duration-200">
                <FaWhatsapp size={16} />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-semibold text-sm uppercase tracking-widest mb-4">Quick Links</h3>
            <ul className="space-y-2.5">
              {QUICK_LINKS.map(link => (
                <li key={link.to}>
                  <Link to={link.to} className="text-sm hover:text-white hover:pl-1 transition-all duration-200 flex items-center gap-1.5">
                    <span className="w-1 h-1 rounded-full bg-tsm-red-500 flex-shrink-0" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Vehicle Categories */}
          <div>
            <h3 className="text-white font-semibold text-sm uppercase tracking-widest mb-4">Vehicle Categories</h3>
            <ul className="space-y-2.5">
              {VEHICLE_CATEGORIES.map(cat => (
                <li key={cat.to}>
                  <Link to={cat.to} className="text-sm hover:text-white hover:pl-1 transition-all duration-200 flex items-center gap-1.5">
                    <span className="w-1 h-1 rounded-full bg-tsm-red-500 flex-shrink-0" />
                    {cat.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-white font-semibold text-sm uppercase tracking-widest mb-4">Customer Support</h3>
            <ul className="space-y-2.5 mb-6">
              {SUPPORT_LINKS.map(link => (
                <li key={link.to}>
                  <Link to={link.to} className="text-sm hover:text-white hover:pl-1 transition-all duration-200 flex items-center gap-1.5">
                    <span className="w-1 h-1 rounded-full bg-tsm-red-500 flex-shrink-0" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
            {/* CTA Buttons */}
            <div className="space-y-2">
              <a
                href="tel:+917759054042"
                className="flex items-center justify-center gap-2 w-full py-2.5 bg-tsm-red-600 text-white text-sm font-semibold rounded-lg hover:bg-tsm-red-700 transition-colors"
              >
                <FiPhone size={14} /> Call Now
              </a>
              <a
                href="https://wa.me/917759054042"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-2.5 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700 transition-colors"
              >
                <FaWhatsapp size={14} /> WhatsApp
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-white/10">
        <div className="container-custom py-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-tsm-navy-500">
          <p>© {year} TSM Enterprises. All Rights Reserved.</p>
          <p>Designed with ❤️ for Jharkhand farmers &amp; businesses</p>
        </div>
      </div>
    </footer>
  )
}
