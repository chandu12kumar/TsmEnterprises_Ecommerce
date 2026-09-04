import { Link } from 'react-router-dom'
import { FiHeart, FiShoppingCart, FiEye, FiMapPin, FiCalendar, FiZap } from 'react-icons/fi'
import { useCart } from '../context/CartContext'
import { useWishlist } from '../context/WishlistContext'
import { useAuth } from '../context/AuthContext'
import { formatPrice, formatKm } from '../data/vehicles'

export default function VehicleCard({ vehicle, showDemo = true }) {
  const { user } = useAuth()
  const { addToCart, isInCart } = useCart()
  const { toggleWishlist, isInWishlist } = useWishlist()

  const inCart = isInCart(vehicle.id)
  const inWishlist = isInWishlist(vehicle.id)
  const isSold = vehicle.status === 'sold'

  return (
    <div className="vehicle-card group relative flex flex-col" role="article" aria-label={vehicle.name}>
      {/* Demo Badge */}
      {showDemo && vehicle.tags?.includes('demo') && (
        <div className="absolute top-3 left-3 z-10">
          <span className="badge badge-featured text-[10px]">DEMO</span>
        </div>
      )}

      {/* Sold / Available Badge */}
      <div className="absolute top-3 right-3 z-10">
        <span className={`badge text-[10px] font-bold ${isSold ? 'badge-sold' : 'badge-available'}`}>
          {isSold ? '● SOLD' : '● AVAILABLE'}
        </span>
      </div>

      {/* Wishlist Button - Only visible when user is logged in */}
      {user && (
        <button
          onClick={() => toggleWishlist(vehicle)}
          className={`absolute top-12 right-3 z-10 w-8 h-8 rounded-full flex items-center justify-center shadow-md transition-all duration-200 ${
            inWishlist ? 'bg-red-500 text-white' : 'bg-white/90 text-gray-500 hover:bg-red-50 hover:text-red-500'
          }`}
          aria-label={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          <FiHeart size={14} className={inWishlist ? 'fill-current' : ''} />
        </button>
      )}

      {/* Image */}
      <div className="overflow-hidden relative bg-gray-100">
        <img
          src={vehicle.images?.[0] || 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop'}
          alt={`${vehicle.name} - ${vehicle.year}`}
          className={`vehicle-card-img ${isSold ? 'grayscale opacity-70' : ''}`}
          loading="lazy"
          onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop' }}
        />
        {isSold && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40">
            <span className="text-white font-bold text-xl tracking-widest border-4 border-white/70 px-4 py-1 rounded -rotate-12 opacity-80">SOLD</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-1">
        {/* Category + Brand */}
        <div className="flex items-center gap-2 mb-1.5">
          <span className="text-xs text-tsm-red-600 font-semibold uppercase tracking-wide">{vehicle.brand}</span>
          <span className="text-tsm-gray-300">•</span>
          <span className="text-xs text-tsm-gray-500 capitalize">{vehicle.category?.replace(/-/g, ' ')}</span>
        </div>

        {/* Name */}
        <h3 className="font-bold text-tsm-navy-900 text-base mb-1 line-clamp-1 font-display">{vehicle.name}</h3>

        {/* Specs Row */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-tsm-gray-500 mb-3">
          <span className="flex items-center gap-1">
            <FiCalendar size={10} className="text-tsm-red-500" />
            {vehicle.year}
          </span>
          <span className="flex items-center gap-1">
            <FiZap size={10} className="text-tsm-red-500" />
            {vehicle.fuelType}
          </span>
          <span className="flex items-center gap-1">
            <span className="text-tsm-red-500 text-[10px]">⊙</span>
            {formatKm(vehicle.kmDriven)}
          </span>
        </div>

        {/* Location */}
        <div className="flex items-center gap-1 text-xs text-tsm-gray-500 mb-3">
          <FiMapPin size={10} className="text-tsm-red-500 flex-shrink-0" />
          <span className="line-clamp-1">{vehicle.location}</span>
        </div>

        {/* Condition */}
        <div className="mb-3">
          <span className="text-xs bg-tsm-navy-50 text-tsm-navy-700 px-2 py-0.5 rounded-full font-medium">
            Condition: {vehicle.condition}
          </span>
        </div>

        {/* Price */}
        <div className="mt-auto">
          <p className="text-xl font-bold text-tsm-navy-900 font-display mb-3">
            {formatPrice(vehicle.price)}
          </p>

          {/* Actions */}
          <div className="flex gap-2">
            <Link
              to={`/product/${vehicle.slug || vehicle.id}`}
              className={`flex items-center justify-center gap-1.5 py-2.5 bg-tsm-navy-800 text-white text-xs font-semibold rounded-lg hover:bg-tsm-navy-900 transition-colors ${
                user ? 'flex-1' : 'w-full'
              }`}
            >
              <FiEye size={12} /> View Details
            </Link>
            {user && (
              <button
                onClick={() => !isSold && addToCart(vehicle)}
                disabled={isSold || inCart}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold rounded-lg transition-colors ${
                  isSold
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : inCart
                    ? 'bg-green-50 text-green-700 border border-green-200 cursor-not-allowed'
                    : 'bg-tsm-red-600 text-white hover:bg-tsm-red-700'
                }`}
                aria-label={isSold ? 'Vehicle sold' : inCart ? 'In cart' : 'Add to cart'}
              >
                <FiShoppingCart size={12} />
                {isSold ? 'Sold' : inCart ? 'In Cart' : 'Add to Cart'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
