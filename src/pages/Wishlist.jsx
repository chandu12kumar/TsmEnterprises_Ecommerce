import { Link } from 'react-router-dom'
import { FiHeart, FiShoppingCart, FiTrash2, FiEye, FiMapPin } from 'react-icons/fi'
import { useWishlist } from '../context/WishlistContext'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import { formatPrice, formatKm } from '../data/vehicles'

export default function Wishlist() {
  const { wishlistItems, removeFromWishlist } = useWishlist()
  const { addToCart, isInCart } = useCart()
  const { user } = useAuth()

  if (!user) {
    return (
      <div className="pt-24 min-h-screen flex items-center justify-center bg-tsm-gray-50">
        <div className="text-center max-w-sm mx-auto p-8">
          <span className="text-7xl block mb-5">🔐</span>
          <h1 className="text-2xl font-bold text-tsm-navy-900 font-display mb-2">Login Required</h1>
          <p className="text-gray-500 mb-6 text-sm">Please login to view your saved vehicles.</p>
          <Link to="/account" className="btn-primary">Login / Register</Link>
        </div>
      </div>
    )
  }

  if (wishlistItems.length === 0) {
    return (
      <div className="pt-24 min-h-screen flex items-center justify-center bg-tsm-gray-50">
        <div className="text-center max-w-sm mx-auto p-8">
          <span className="text-7xl block mb-5">💔</span>
          <h1 className="text-2xl font-bold text-tsm-navy-900 font-display mb-2">No Saved Vehicles</h1>
          <p className="text-gray-500 mb-6 text-sm">Tap the heart icon on any vehicle to save it here.</p>
          <Link to="/products" className="btn-primary">Browse Vehicles</Link>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="bg-tsm-navy-900 pt-24 pb-10">
        <div className="container-custom">
          <h1 className="text-3xl font-bold text-white font-display mb-1 flex items-center gap-3">
            <FiHeart className="text-tsm-red-400 fill-current" size={28} />
            My Wishlist
          </h1>
          <p className="text-tsm-navy-300 text-sm">{wishlistItems.length} saved vehicle{wishlistItems.length > 1 ? 's' : ''}</p>
        </div>
      </div>

      <div className="container-custom py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {wishlistItems.map(item => {
            const isSold = item.status === 'sold'
            const inCart = isInCart(item.id)
            return (
              <div key={item.id} className="vehicle-card group relative flex flex-col">
                {/* Remove */}
                <button
                  onClick={() => removeFromWishlist(item.id)}
                  className="absolute top-3 right-3 z-10 w-8 h-8 bg-white/90 hover:bg-red-50 hover:text-red-500 rounded-full flex items-center justify-center text-gray-500 shadow-md transition-all"
                  aria-label="Remove from wishlist"
                >
                  <FiTrash2 size={13} />
                </button>

                {/* Status */}
                <div className="absolute top-3 left-3 z-10">
                  <span className={`badge text-[10px] font-bold ${isSold ? 'badge-sold' : 'badge-available'}`}>
                    {isSold ? '● SOLD' : '● AVAILABLE'}
                  </span>
                </div>

                {/* Image */}
                <div className="overflow-hidden bg-gray-100 relative">
                  <img
                    src={item.images?.[0]}
                    alt={item.name}
                    className={`vehicle-card-img ${isSold ? 'grayscale opacity-70' : ''}`}
                    loading="lazy"
                    onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop' }}
                  />
                </div>

                <div className="p-4 flex flex-col flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs text-tsm-red-600 font-semibold uppercase">{item.brand}</span>
                  </div>
                  <h3 className="font-bold text-tsm-navy-900 font-display line-clamp-1 mb-1">{item.name}</h3>
                  <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-gray-500 mb-1.5">
                    <span>{item.year}</span>
                    <span>{item.fuelType}</span>
                    <span>{formatKm(item.kmDriven)}</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-gray-400 mb-3">
                    <FiMapPin size={9} /> {item.location}
                  </div>
                  <p className="text-xl font-bold text-tsm-navy-900 font-display mb-3">{formatPrice(item.price)}</p>

                  <div className="flex gap-2 mt-auto">
                    <Link to={`/product/${item.slug || item.id}`} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-tsm-navy-800 text-white text-xs font-semibold rounded-lg hover:bg-tsm-navy-900 transition-colors">
                      <FiEye size={11} /> View
                    </Link>
                    <button
                      onClick={() => !isSold && addToCart(item)}
                      disabled={isSold || inCart}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold rounded-lg transition-colors ${
                        isSold ? 'bg-gray-100 text-gray-400 cursor-not-allowed' :
                        inCart ? 'bg-green-50 text-green-700 border border-green-200 cursor-not-allowed' :
                        'bg-tsm-red-600 text-white hover:bg-tsm-red-700'
                      }`}
                    >
                      <FiShoppingCart size={11} />
                      {isSold ? 'Sold' : inCart ? 'In Cart' : 'Add'}
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </>
  )
}
