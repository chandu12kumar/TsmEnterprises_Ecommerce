import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import {
  FiArrowLeft, FiMapPin, FiCalendar, FiZap, FiSettings,
  FiPhone, FiHeart, FiShoppingCart, FiMessageSquare, FiShare2,
  FiCheckCircle, FiXCircle, FiUser
} from 'react-icons/fi'
import { FaWhatsapp } from 'react-icons/fa'
import { formatPrice, formatKm } from '../data/vehicles'
import { vehicleService } from '../services/vehicleService'
import ImageGallery from '../components/ImageGallery'
import EnquiryModal from '../components/EnquiryModal'
import VehicleCard from '../components/VehicleCard'
import { useCart } from '../context/CartContext'
import { useWishlist } from '../context/WishlistContext'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

export default function VehicleDetail() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { addToCart, isInCart } = useCart()
  const { toggleWishlist, isInWishlist } = useWishlist()
  const [vehicle, setVehicle] = useState(null)
  const [related, setRelated] = useState([])
  const [enquiryOpen, setEnquiryOpen] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    const loadVehicle = async () => {
      setLoading(true)
      const { data } = await vehicleService.getVehicleById(slug)
      if (mounted) {
        setVehicle(data)
        if (data?.category) {
          const { data: relData } = await vehicleService.getVehicles({ category: data.category })
          if (mounted) {
            setRelated((relData || []).filter(v => v.id !== data.id).slice(0, 3))
          }
        }
        setLoading(false)
      }
    }
    loadVehicle()

    return () => {
      mounted = false
    }
  }, [slug])

  if (loading) {
    return (
      <div className="pt-20 min-h-screen">
        <div className="container-custom py-8">
          <div className="grid lg:grid-cols-2 gap-8">
            <div className="space-y-3 animate-pulse">
              <div className="h-96 bg-gray-200 rounded-2xl" />
              <div className="grid grid-cols-4 gap-2">
                {[...Array(4)].map((_, i) => <div key={i} className="h-20 bg-gray-200 rounded-lg" />)}
              </div>
            </div>
            <div className="space-y-4 animate-pulse">
              <div className="h-6 w-3/4 bg-gray-200 rounded" />
              <div className="h-10 w-1/2 bg-gray-200 rounded" />
              <div className="h-4 w-1/3 bg-gray-200 rounded" />
              <div className="h-32 bg-gray-200 rounded" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!vehicle) {
    return (
      <div className="pt-24 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <span className="text-8xl block mb-4">🚗</span>
          <h1 className="text-2xl font-bold text-tsm-navy-900 font-display mb-2">Vehicle Not Found</h1>
          <p className="text-gray-500 mb-6">This vehicle may have been sold or removed.</p>
          <Link to="/products" className="btn-primary">Browse All Vehicles</Link>
        </div>
      </div>
    )
  }

  const inCart = isInCart(vehicle.id)
  const inWishlist = isInWishlist(vehicle.id)
  const isSold = vehicle.status === 'sold'

  const shareVehicle = async () => {
    if (navigator.share) {
      await navigator.share({ title: vehicle.name, url: window.location.href })
    } else {
      navigator.clipboard.writeText(window.location.href)
      toast.success('Link copied!')
    }
  }

  const SPECS = [
    { label: 'Brand', value: vehicle.brand },
    { label: 'Model', value: vehicle.model },
    { label: 'Year', value: vehicle.year },
    { label: 'Fuel Type', value: vehicle.fuelType },
    { label: 'Transmission', value: vehicle.transmission },
    { label: 'KM Driven', value: vehicle.kmDriven ? formatKm(vehicle.kmDriven) : '—' },
    { label: 'Condition', value: vehicle.condition },
    { label: 'Registration Year', value: vehicle.registrationYear },
    { label: 'Owner Number', value: vehicle.ownerNumber || '1st Owner' },
    { label: 'Engine', value: vehicle.engineDetails || vehicle.engine_details },
    { label: 'Insurance', value: vehicle.insuranceStatus },
    { label: 'Documents', value: vehicle.documents || 'RC, Insurance, PUC' },
    { label: 'Location', value: vehicle.location },
  ]

  return (
    <>
      <div className="pt-20 bg-tsm-gray-50 min-h-screen">
        {/* Breadcrumb */}
        <div className="bg-white border-b border-gray-100">
          <div className="container-custom py-3 flex items-center gap-2 text-sm text-gray-500">
            <Link to="/" className="hover:text-tsm-red-600 transition-colors">Home</Link>
            <span>/</span>
            <Link to="/products" className="hover:text-tsm-red-600 transition-colors">Vehicles</Link>
            <span>/</span>
            <span className="text-tsm-navy-900 font-medium line-clamp-1">{vehicle.name}</span>
          </div>
        </div>

        <div className="container-custom py-8">
          {/* Back button */}
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-gray-500 hover:text-tsm-navy-800 mb-6 transition-colors">
            <FiArrowLeft size={16} /> Back to vehicles
          </button>

          <div className="grid lg:grid-cols-2 gap-8 mb-12">
            {/* LEFT: Gallery */}
            <div>
              <ImageGallery images={vehicle.images} vehicleName={vehicle.name} />
              {vehicle.tags?.includes('demo') && (
                <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-xl text-xs text-yellow-700 flex items-center gap-2">
                  ⚠️ This is a <strong>demo vehicle</strong>. Real inventory will be populated via Supabase.
                </div>
              )}
            </div>

            {/* RIGHT: Info */}
            <div className="space-y-5">
              {/* Header */}
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span className={`badge text-xs font-bold ${isSold ? 'badge-sold' : 'badge-available'}`}>
                    {isSold ? '● SOLD' : '● AVAILABLE'}
                  </span>
                  <span className="text-xs text-gray-400 capitalize bg-gray-100 px-2.5 py-0.5 rounded-full">
                    {vehicle.category?.replace(/-/g, ' ')}
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold text-tsm-navy-900 font-display">{vehicle.name}</h1>
                <div className="flex items-center gap-2 mt-1.5">
                  <FiMapPin size={13} className="text-tsm-red-500 flex-shrink-0" />
                  <span className="text-sm text-gray-600">{vehicle.location}</span>
                </div>
              </div>

              {/* Price */}
              <div className="bg-tsm-navy-50 rounded-xl p-4">
                <p className="text-3xl font-bold text-tsm-navy-900 font-display">{formatPrice(vehicle.price)}</p>
                <p className="text-xs text-gray-500 mt-0.5">Price is negotiable. Contact TSM Enterprises for best deal.</p>
              </div>

              {/* Quick Specs */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { icon: <FiCalendar size={16} />, label: 'Year', val: vehicle.year },
                  { icon: <FiZap size={16} />, label: 'Fuel', val: vehicle.fuelType },
                  { icon: <FiSettings size={16} />, label: 'KM', val: vehicle.kmDriven ? formatKm(vehicle.kmDriven) : '—' },
                ].map((s, i) => (
                  <div key={i} className="bg-white rounded-xl p-3 border border-gray-100 text-center">
                    <div className="text-tsm-red-500 flex justify-center mb-1">{s.icon}</div>
                    <div className="text-xs text-gray-500">{s.label}</div>
                    <div className="font-semibold text-tsm-navy-800 text-sm">{s.val}</div>
                  </div>
                ))}
              </div>

              {/* Action Buttons */}
              {!isSold ? (
                user ? (
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setEnquiryOpen(true)}
                      className="flex items-center justify-center gap-2 py-3.5 bg-tsm-red-600 text-white font-semibold rounded-xl hover:bg-tsm-red-700 active:scale-[0.98] transition-all text-sm shadow-btn"
                    >
                      <FiMessageSquare size={15} /> Enquire Now
                    </button>
                    <button
                      onClick={() => addToCart(vehicle)}
                      disabled={inCart}
                      className={`flex items-center justify-center gap-2 py-3.5 font-semibold rounded-xl active:scale-[0.98] transition-all text-sm ${
                        inCart ? 'bg-green-50 text-green-700 border-2 border-green-200 cursor-not-allowed' : 'bg-tsm-navy-800 text-white hover:bg-tsm-navy-900'
                      }`}
                    >
                      <FiShoppingCart size={15} /> {inCart ? 'Added to Cart' : 'Add to Cart'}
                    </button>
                    <button
                      onClick={() => toggleWishlist(vehicle)}
                      className={`flex items-center justify-center gap-2 py-3 border-2 font-semibold rounded-xl text-sm transition-all ${
                        inWishlist ? 'border-red-200 text-red-600 bg-red-50' : 'border-gray-200 text-gray-700 hover:border-tsm-red-300 hover:text-tsm-red-600'
                      }`}
                    >
                      <FiHeart size={15} className={inWishlist ? 'fill-current' : ''} />
                      {inWishlist ? 'Wishlisted' : 'Add to Wishlist'}
                    </button>
                    <button
                      onClick={shareVehicle}
                      className="flex items-center justify-center gap-2 py-3 border-2 border-gray-200 text-gray-700 hover:border-tsm-navy-300 font-semibold rounded-xl text-sm transition-all"
                    >
                      <FiShare2 size={15} /> Share
                    </button>
                  </div>
                ) : (
                  <div className="bg-tsm-navy-50 border border-tsm-navy-100 rounded-xl p-4 space-y-3">
                    <p className="text-tsm-navy-900 text-sm font-medium text-center">
                      Please log in to enquire, save to wishlist, or add to cart.
                    </p>
                    <div className="flex gap-2">
                      <Link
                        to="/login"
                        className="flex-1 flex items-center justify-center gap-2 py-3 bg-tsm-red-600 text-white font-semibold rounded-xl hover:bg-tsm-red-700 transition-colors text-sm shadow-btn"
                      >
                        <FiUser size={15} /> Login to Enquire
                      </Link>
                      <button
                        onClick={shareVehicle}
                        className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-gray-200 text-gray-700 hover:border-tsm-navy-300 font-semibold rounded-xl text-sm transition-all bg-white"
                      >
                        <FiShare2 size={15} /> Share
                      </button>
                    </div>
                  </div>
                )
              ) : (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-center space-y-2">
                  <span className="badge badge-sold text-sm px-3 py-1 font-bold uppercase tracking-wider">● SOLD</span>
                  <p className="text-red-700 font-semibold text-sm">This vehicle is no longer available.</p>
                  <Link to="/products" className="text-tsm-red-600 text-xs font-semibold hover:underline block">Browse Available Vehicles →</Link>
                </div>
              )}

              {/* Direct Dealership Contact */}
              <div className="bg-tsm-navy-50 rounded-xl p-4">
                <p className="text-sm font-semibold text-tsm-navy-800 mb-3">Contact TSM Enterprises Directly</p>
                <div className="grid grid-cols-2 gap-2">
                  <a href="tel:+919876543210" className="flex items-center justify-center gap-2 py-2.5 bg-tsm-navy-800 text-white text-sm font-semibold rounded-lg hover:bg-tsm-navy-900 transition-colors">
                    <FiPhone size={13} /> Call Now
                  </a>
                  <a
                    href={`https://wa.me/919876543210?text=${encodeURIComponent(`Hi! I'm interested in ${vehicle.name} (${vehicle.year}) listed on TSM Enterprises. Price: ${formatPrice(vehicle.price)}.`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 py-2.5 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <FaWhatsapp size={13} /> WhatsApp
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Full Specs Table */}
          <div className="grid lg:grid-cols-3 gap-6 mb-12">
            <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-card overflow-hidden">
              <div className="bg-tsm-navy-900 px-6 py-4">
                <h2 className="text-white font-bold font-display text-lg">Vehicle Specifications</h2>
              </div>
              <div className="divide-y divide-gray-50">
                {SPECS.map((spec, i) => (
                  <div key={i} className="flex items-center gap-3 px-6 py-3 hover:bg-gray-50 transition-colors">
                    <span className="text-gray-500 text-sm w-36 flex-shrink-0">{spec.label}</span>
                    <span className="font-medium text-tsm-navy-900 text-sm">{spec.value || '—'}</span>
                    {spec.label === 'Insurance' && (
                      <span className={`ml-auto ${vehicle.insuranceStatus === 'Valid' ? 'text-green-500' : 'text-red-500'}`}>
                        {vehicle.insuranceStatus === 'Valid' ? <FiCheckCircle size={14} /> : <FiXCircle size={14} />}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Description + Enquiry Prompt */}
            <div className="space-y-5">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-5">
                <h2 className="font-bold text-tsm-navy-900 font-display text-lg mb-3">Description</h2>
                <p className="text-gray-600 text-sm leading-relaxed">{vehicle.description || 'No detailed description provided.'}</p>
              </div>

              {!isSold && (
                <div className="bg-tsm-navy-900 rounded-2xl p-5 text-white">
                  <h3 className="font-bold font-display text-lg mb-2">Interested in this vehicle?</h3>
                  <p className="text-tsm-navy-300 text-sm mb-4">
                    {user
                      ? 'Send an enquiry and our team will get in touch with documentation and best price.'
                      : 'Please log in to send an enquiry and connect with our team for documentation and best price.'}
                  </p>
                  {user ? (
                    <button
                      onClick={() => setEnquiryOpen(true)}
                      className="w-full py-3 bg-tsm-red-600 text-white font-semibold rounded-xl hover:bg-tsm-red-700 transition-colors text-sm shadow-btn"
                    >
                      Send Enquiry
                    </button>
                  ) : (
                    <Link
                      to="/login"
                      className="w-full py-3 bg-tsm-red-600 text-white font-semibold rounded-xl hover:bg-tsm-red-700 transition-colors text-sm shadow-btn text-center block"
                    >
                      Login to Enquire
                    </Link>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Related Vehicles */}
          {related.length > 0 && (
            <div>
              <h2 className="text-2xl font-bold text-tsm-navy-900 font-display mb-5">Similar Vehicles</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {related.map(v => <VehicleCard key={v.id} vehicle={v} />)}
              </div>
            </div>
          )}
        </div>
      </div>

      <EnquiryModal vehicle={vehicle} isOpen={enquiryOpen} onClose={() => setEnquiryOpen(false)} />
    </>
  )
}
