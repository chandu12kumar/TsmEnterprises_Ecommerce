import { Link } from 'react-router-dom'
import { FiArrowLeft, FiSearch } from 'react-icons/fi'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-tsm-gray-50 pt-16">
      <div className="text-center max-w-md mx-auto px-6">
        <div className="relative mb-8">
          <div className="text-[10rem] font-black text-tsm-navy-100 font-display leading-none select-none">404</div>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-6xl">🚗</span>
          </div>
        </div>
        <h1 className="text-3xl font-bold text-tsm-navy-900 font-display mb-3">Page Not Found</h1>
        <p className="text-gray-500 text-sm mb-2">Looks like this vehicle drove off the road!</p>
        <p className="text-gray-400 text-xs mb-8">The page you're looking for doesn't exist or may have been moved.</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link to="/" className="btn-primary">
            <FiArrowLeft size={16} /> Back to Home
          </Link>
          <Link to="/products" className="btn-outline">
            <FiSearch size={16} /> Browse Vehicles
          </Link>
        </div>
      </div>
    </div>
  )
}
