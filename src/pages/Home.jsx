import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { FiSearch, FiArrowRight, FiStar, FiPhone } from 'react-icons/fi'
import { FaWhatsapp } from 'react-icons/fa'
import VehicleCard from '../components/VehicleCard'
import CategoryCard from '../components/CategoryCard'
import { vehicleService } from '../services/vehicleService'
import {
  VEHICLE_CATEGORIES, TESTIMONIALS,
  HOW_IT_WORKS, WHY_CHOOSE_US, BRANDS, LOCATIONS, formatPrice
} from '../data/vehicles'

export default function Home() {
  const navigate = useNavigate()
  const [search, setSearch] = useState({ type: '', brand: '', minPrice: '', maxPrice: '', location: '' })
  const [featuredVehicles, setFeaturedVehicles] = useState([])

  useEffect(() => {
    let mounted = true
    const loadFeatured = async () => {
      const { data } = await vehicleService.getVehicles()
      if (mounted && data) {
        const featured = data.filter(v => v.featured)
        setFeaturedVehicles(featured.length > 0 ? featured.slice(0, 6) : data.slice(0, 6))
      }
    }
    loadFeatured()
    return () => {
      mounted = false
    }
  }, [])

  const handleSearch = (e) => {
    e.preventDefault()
    const params = new URLSearchParams()
    if (search.type) params.set('category', search.type)
    if (search.brand) params.set('brand', search.brand)
    if (search.minPrice) params.set('minPrice', search.minPrice)
    if (search.maxPrice) params.set('maxPrice', search.maxPrice)
    if (search.location) params.set('location', search.location)
    navigate(`/products${params.toString() ? '?' + params.toString() : ''}`)
  }

  return (
    <main>
      {/* ─── HERO ─── */}
      <section
        className="relative min-h-screen flex flex-col items-center justify-center text-center overflow-hidden"
        aria-label="Hero section"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=1920&h=1080&fit=crop')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="hero-overlay absolute inset-0" />

        {/* Floating decorations */}
        <div className="absolute top-1/4 left-10 w-64 h-64 bg-tsm-red-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-10 w-48 h-48 bg-blue-600/10 rounded-full blur-3xl" />

        <div className="relative z-10 container-custom px-4 py-32 md:py-40">
          {/* Badge */}

          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white font-display leading-tight mb-5">
            Find the Right Vehicle
            <br />
            <span className="gradient-text">for Your Business</span>
          </h1>
          <p className="text-lg sm:text-xl text-white/80 max-w-2xl mx-auto mb-8 font-medium">
            Quality Second-Hand Vehicles at Affordable Prices — Auto, Cargo, Tractor, Pickup & More
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link to="/products" className="btn-primary text-base px-8 py-4 shadow-btn">
              Browse Vehicles <FiArrowRight size={18} />
            </Link>
            <Link to="/contact" className="btn-secondary text-base px-8 py-4">
              Contact Us
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-6 max-w-lg mx-auto mb-12">
            {[
              { num: '500+', label: 'Vehicles Sold' },
              { num: '8+', label: 'Categories' },
              { num: '5★', label: 'Customer Rating' },
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-white font-display">{stat.num}</div>
                <div className="text-white/60 text-xs mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-white/50">
          <span className="text-xs">Scroll</span>
          <div className="w-px h-8 bg-white/30 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1/2 bg-white/60 animate-bounce" />
          </div>
        </div>
      </section>

      {/* ─── FEATURED VEHICLES ─── */}
      <section className="section bg-white" aria-label="Featured Vehicles">
        <div className="container-custom">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
            <div>
              <span className="section-badge">Featured</span>
              <h2 className="section-title">Featured Vehicles</h2>
              <div className="divider mt-3" />
              <p className="section-subtitle mt-3">Hand-picked quality second-hand vehicles at affordable prices</p>
            </div>
            <Link to="/products" className="btn-outline whitespace-nowrap">
              View All Vehicles <FiArrowRight size={16} />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredVehicles.map(v => <VehicleCard key={v.id} vehicle={v} />)}
          </div>
        </div>
      </section>

      {/* ─── CATEGORIES ─── */}
      <section className="section bg-tsm-gray-50" aria-label="Vehicle Categories">
        <div className="container-custom">
          <div className="text-center mb-10">
            <span className="section-badge">Browse by Type</span>
            <h2 className="section-title">Vehicle Categories</h2>
            <div className="divider mt-3 mx-auto" />
            <p className="section-subtitle mt-3 mx-auto text-center">Find the right category for your business or agricultural needs</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
            {VEHICLE_CATEGORIES.map(cat => <CategoryCard key={cat.id} category={cat} />)}
          </div>
        </div>
      </section>

      {/* ─── WHY CHOOSE US ─── */}
      <section className="section bg-white" aria-label="Why Choose TSM Enterprises">
        <div className="container-custom">
          <div className="text-center mb-12">
            <span className="section-badge">Our Promise</span>
            <h2 className="section-title">Why Choose TSM Enterprises?</h2>
            <div className="divider mt-3 mx-auto" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {WHY_CHOOSE_US.map((item, i) => (
              <div key={i} className="card card-hover p-6 text-center group">
                <div className="w-16 h-16 bg-tsm-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:bg-tsm-red-100 transition-colors text-3xl">
                  {item.icon}
                </div>
                <h3 className="font-bold text-tsm-navy-900 text-lg font-display mb-2">{item.title}</h3>
                <p className="text-tsm-gray-600 text-sm leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <section className="section bg-tsm-navy-950" aria-label="How It Works">
        <div className="container-custom">
          <div className="text-center mb-12">
            <span className="inline-block px-3 py-1 bg-tsm-red-600/20 text-tsm-red-400 text-sm font-semibold rounded-full mb-3 uppercase tracking-wide">Process</span>
            <h2 className="text-3xl md:text-4xl font-bold text-white font-display">How It Works</h2>
            <div className="h-1 w-16 bg-tsm-red-600 rounded-full mt-3 mx-auto" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 relative">
            {/* Connector line (desktop only) */}
            <div className="hidden lg:block absolute top-12 left-[calc(12.5%+2rem)] right-[calc(12.5%+2rem)] h-0.5 bg-tsm-navy-700" />
            {HOW_IT_WORKS.map((step, i) => (
              <div key={i} className="flex flex-col items-center text-center relative">
                <div className="relative w-24 h-24 rounded-full bg-tsm-navy-800 border-2 border-tsm-navy-700 flex flex-col items-center justify-center mb-5 z-10">
                  <span className="text-3xl">{step.icon}</span>
                  <span className="absolute -top-2 -right-2 w-7 h-7 bg-tsm-red-600 text-white text-xs font-bold rounded-full flex items-center justify-center">
                    {step.step}
                  </span>
                </div>
                <h3 className="text-white font-bold text-lg font-display mb-2">{step.title}</h3>
                <p className="text-tsm-navy-400 text-sm leading-relaxed">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── TESTIMONIALS ─── */}
      <section className="section bg-tsm-gray-50" aria-label="Customer Testimonials">
        <div className="container-custom">
          <div className="text-center mb-10">
            <span className="section-badge">Customer Reviews</span>
            <h2 className="section-title">What Our Customers Say</h2>
            <div className="divider mt-3 mx-auto" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {TESTIMONIALS.map(t => (
              <div key={t.id} className="card card-hover p-5 flex flex-col">
                {/* Stars */}
                <div className="flex items-center gap-0.5 mb-3">
                  {[...Array(5)].map((_, i) => (
                    <FiStar key={i} size={14} className={i < t.rating ? 'star-filled fill-current' : 'text-gray-200 fill-current'} />
                  ))}
                  <span className="ml-1.5 text-xs text-gray-500 font-medium">{t.rating}.0</span>
                </div>
                <blockquote className="text-gray-700 text-sm leading-relaxed mb-4 flex-1 italic">
                  "{t.review}"
                </blockquote>
                <div className="border-t pt-3 mt-auto">
                  <p className="font-semibold text-tsm-navy-900 text-sm">{t.name}</p>
                  <p className="text-xs text-gray-500">{t.location}</p>
                  <p className="text-xs text-tsm-red-600 font-medium mt-0.5">Purchased: {t.vehicle}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="py-20 bg-gradient-to-br from-tsm-red-600 to-tsm-red-700 relative overflow-hidden" aria-label="Call to action">
        <div className="absolute top-0 left-0 w-64 h-64 bg-white/5 rounded-full -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-48 h-48 bg-white/5 rounded-full translate-x-1/3 translate-y-1/3" />
        <div className="container-custom text-center relative z-10">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white font-display mb-4">
            Looking for a Reliable Used Vehicle?
          </h2>
          <p className="text-white/85 text-lg mb-8 max-w-xl mx-auto">
            Explore our available vehicles and find the right one for your business. Transparent pricing. No hidden charges.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/products" className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-tsm-red-600 font-bold text-base rounded-lg hover:bg-gray-50 active:scale-[0.98] transition-all duration-200">
              View All Vehicles <FiArrowRight size={18} />
            </Link>
            <a href="tel:+919876543210" className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/10 text-white font-bold text-base rounded-lg hover:bg-white/20 border border-white/30 active:scale-[0.98] transition-all duration-200">
              <FiPhone size={18} /> Call Us Now
            </a>
          </div>
          <div className="mt-8 flex items-center justify-center gap-4">
            <a
              href="https://wa.me/919876543210"
              target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-white/80 hover:text-white text-sm transition-colors"
            >
              <FaWhatsapp size={16} /> Chat on WhatsApp
            </a>
          </div>
        </div>
      </section>
    </main>
  )
}
