import { Link } from 'react-router-dom'

export default function CategoryCard({ category }) {
  return (
    <Link
      to={`/products?category=${category.id}`}
      className="group relative overflow-hidden rounded-2xl bg-tsm-navy-800 shadow-card hover:shadow-card-hover hover:-translate-y-1 transition-all duration-300 block"
      aria-label={`Browse ${category.name}`}
    >
      {/* Background Image */}
      <div className="relative h-44 overflow-hidden">
        <img
          src={category.image}
          alt={category.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 opacity-60"
          loading="lazy"
          onError={(e) => { e.target.style.display = 'none' }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-tsm-navy-900 via-tsm-navy-800/60 to-transparent" />
        {/* Icon */}
        <div className="absolute top-3 right-3 w-10 h-10 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center">
          <span className="text-xl">{category.icon}</span>
        </div>
        {/* Count */}
        <div className="absolute top-3 left-3">
          <span className="text-xs bg-tsm-red-600/90 text-white px-2 py-0.5 rounded-full font-medium">
            {category.count}+ vehicles
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="absolute bottom-0 left-0 right-0 p-4">
        <h3 className="text-white font-bold text-base font-display mb-1">{category.name}</h3>
        <div className="flex items-center gap-1 text-tsm-red-400 text-xs font-semibold group-hover:gap-2 transition-all duration-200">
          <span>Explore Vehicles</span>
          <span className="transition-transform group-hover:translate-x-1">→</span>
        </div>
      </div>
    </Link>
  )
}
