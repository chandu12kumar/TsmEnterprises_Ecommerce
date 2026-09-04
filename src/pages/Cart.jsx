import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { FiTrash2, FiShoppingCart, FiMessageSquare, FiArrowRight, FiMapPin } from 'react-icons/fi'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import { formatPrice, formatKm } from '../data/vehicles'
import EnquiryModal from '../components/EnquiryModal'

export default function Cart() {
  const { cartItems, removeFromCart, clearCart, cartTotal } = useCart()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [enquiryOpen, setEnquiryOpen] = useState(false)

  if (!user) {
    return (
      <div className="pt-24 min-h-screen flex items-center justify-center bg-tsm-gray-50">
        <div className="text-center max-w-sm mx-auto p-8">
          <span className="text-7xl block mb-5">🔐</span>
          <h1 className="text-2xl font-bold text-tsm-navy-900 font-display mb-2">Login Required</h1>
          <p className="text-gray-500 mb-6 text-sm">Please login to view your cart and send enquiries.</p>
          <Link to="/account" className="btn-primary">Login / Register</Link>
        </div>
      </div>
    )
  }

  if (cartItems.length === 0) {
    return (
      <div className="pt-24 min-h-screen flex items-center justify-center bg-tsm-gray-50">
        <div className="text-center max-w-sm mx-auto p-8">
          <span className="text-7xl block mb-5">🛒</span>
          <h1 className="text-2xl font-bold text-tsm-navy-900 font-display mb-2">Your Cart is Empty</h1>
          <p className="text-gray-500 mb-6 text-sm">Add vehicles to your cart and proceed to enquiry.</p>
          <Link to="/products" className="btn-primary">Browse Vehicles</Link>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="bg-tsm-navy-900 pt-24 pb-10">
        <div className="container-custom">
          <h1 className="text-3xl font-bold text-white font-display mb-1">My Cart</h1>
          <p className="text-tsm-navy-300 text-sm">
            {cartItems.length} vehicle{cartItems.length > 1 ? 's' : ''} selected for enquiry
          </p>
        </div>
      </div>

      <div className="container-custom py-8">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Cart Items */}
          <div className="flex-1">
            <div className="space-y-4">
              {cartItems.map(item => (
                <div key={item.id} className="bg-white rounded-2xl border border-gray-100 shadow-card p-4 flex gap-4 group">
                  {/* Image */}
                  <Link to={`/product/${item.slug || item.id}`} className="flex-shrink-0">
                    <img
                      src={item.images?.[0]}
                      alt={item.name}
                      className="w-28 sm:w-36 h-24 object-cover rounded-xl"
                      onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop' }}
                    />
                  </Link>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-xs text-tsm-red-600 font-semibold uppercase">{item.brand}</span>
                        <h3 className="font-bold text-tsm-navy-900 font-display line-clamp-1">{item.name}</h3>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-gray-500 mt-0.5">
                          <span>{item.year}</span>
                          <span>{item.fuelType}</span>
                          <span>{formatKm(item.kmDriven)}</span>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-gray-400 mt-0.5">
                          <FiMapPin size={9} /> {item.location}
                        </div>
                      </div>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all flex-shrink-0"
                        aria-label="Remove from cart"
                      >
                        <FiTrash2 size={15} />
                      </button>
                    </div>
                    <div className="flex items-center justify-between mt-3">
                      <p className="text-xl font-bold text-tsm-navy-900 font-display">{formatPrice(item.price)}</p>
                      <Link
                        to={`/product/${item.slug || item.id}`}
                        className="text-xs text-tsm-red-600 hover:underline"
                      >
                        View Details →
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Clear Cart */}
            <div className="mt-4 flex justify-end">
              <button
                onClick={clearCart}
                className="text-sm text-gray-500 hover:text-red-600 flex items-center gap-1.5 transition-colors"
              >
                <FiTrash2 size={13} /> Clear Cart
              </button>
            </div>
          </div>

          {/* Cart Summary */}
          <div className="lg:w-80 flex-shrink-0">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-6 sticky top-20">
              <h2 className="text-lg font-bold text-tsm-navy-900 font-display mb-5">Cart Summary</h2>

              <div className="space-y-3 mb-5">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Number of Vehicles</span>
                  <span className="font-semibold text-tsm-navy-900">{cartItems.length}</span>
                </div>
                {cartItems.map(item => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="text-gray-500 line-clamp-1 flex-1 mr-2">{item.name}</span>
                    <span className="font-medium text-tsm-navy-800 flex-shrink-0">{formatPrice(item.price)}</span>
                  </div>
                ))}
                <div className="border-t pt-3 flex justify-between">
                  <span className="font-semibold text-tsm-navy-900">Estimated Total</span>
                  <span className="font-bold text-xl text-tsm-navy-900 font-display">{formatPrice(cartTotal)}</span>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 mb-5 text-xs text-blue-700">
                ℹ️ This is an <strong>estimated total</strong>. Final price will be confirmed after enquiry. No online payment required.
              </div>

              <button
                onClick={() => setEnquiryOpen(true)}
                className="w-full flex items-center justify-center gap-2 py-4 bg-tsm-red-600 text-white font-bold rounded-xl hover:bg-tsm-red-700 active:scale-[0.98] transition-all mb-3"
              >
                <FiMessageSquare size={16} /> Proceed to Enquiry
              </button>

              <Link
                to="/products"
                className="w-full flex items-center justify-center gap-2 py-3 border-2 border-tsm-navy-200 text-tsm-navy-700 font-semibold rounded-xl hover:bg-tsm-navy-50 transition-colors text-sm"
              >
                Continue Browsing <FiArrowRight size={14} />
              </Link>

              {/* TSM Contact */}
              <div className="mt-5 pt-5 border-t text-center">
                <p className="text-xs text-gray-500 mb-2">Need help? Contact us directly</p>
                <a href="tel:+917759054042" className="text-tsm-red-600 font-semibold text-sm hover:underline">
                  +91 77590 54042
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enquiry Modal (bulk) */}
      <EnquiryModal
        vehicle={cartItems.length === 1 ? cartItems[0] : { name: `${cartItems.length} vehicles from cart`, images: [cartItems[0]?.images?.[0]] }}
        isOpen={enquiryOpen}
        onClose={() => setEnquiryOpen(false)}
      />
    </>
  )
}
