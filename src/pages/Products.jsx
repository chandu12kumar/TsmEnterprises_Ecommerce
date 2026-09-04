import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { FiFilter, FiGrid, FiList, FiSearch, FiX, FiChevronDown, FiChevronUp } from 'react-icons/fi'
import VehicleCard from '../components/VehicleCard'
import SkeletonCard from '../components/SkeletonCard'
import { vehicleService } from '../services/vehicleService'
import {
  VEHICLE_CATEGORIES, BRANDS, FUEL_TYPES,
  TRANSMISSION_TYPES, CONDITIONS, LOCATIONS, formatPrice
} from '../data/vehicles'

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'km-asc', label: 'KM: Low to High' },
]

const ITEMS_PER_PAGE = 9

export default function Products() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [vehicles, setVehicles] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterOpen, setFilterOpen] = useState(false)
  const [viewMode, setViewMode] = useState('grid')
  const [page, setPage] = useState(1)

  // Filter state
  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    category: searchParams.get('category') || '',
    brand: searchParams.get('brand') || '',
    year: '',
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || '',
    fuelType: '',
    transmission: '',
    condition: '',
    location: searchParams.get('location') || '',
    status: '',
  })
  const [sort, setSort] = useState('newest')

  // Fetch vehicles whenever filters or sort change
  useEffect(() => {
    let mounted = true
    const fetchData = async () => {
      setLoading(true)
      const { data } = await vehicleService.getVehicles(filters, sort)
      if (mounted) {
        setVehicles(data || [])
        setLoading(false)
      }
    }
    fetchData()

    // Realtime subscription for vehicle changes
    const unsubscribe = vehicleService.subscribeToChanges(() => {
      fetchData()
    })

    return () => {
      mounted = false
      unsubscribe()
    }
  }, [filters, sort])

  const setFilter = (key, value) => {
    setFilters(f => ({ ...f, [key]: value }))
    setPage(1)
  }

  const clearFilters = () => {
    setFilters({
      search: '',
      category: '',
      brand: '',
      year: '',
      minPrice: '',
      maxPrice: '',
      fuelType: '',
      transmission: '',
      condition: '',
      location: '',
      status: '',
    })
    setPage(1)
  }

  const activeFilterCount = Object.values(filters).filter(v => v !== '').length

  const totalPages = Math.ceil(vehicles.length / ITEMS_PER_PAGE)
  const paginated = vehicles.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE)

  return (
    <>
      <div className="bg-tsm-navy-900 pt-24 pb-10">
        <div className="container-custom">
          <div className="mb-1">
            <span className="section-badge">Our Inventory</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white font-display mb-2">Explore Our Vehicles</h1>
          <p className="text-tsm-navy-300">Find quality second-hand vehicles at the right price.</p>
        </div>
      </div>

      <div className="container-custom py-8">
        <div className="flex flex-col lg:flex-row gap-6">

          {/* ─── FILTER SIDEBAR ─── */}
          <aside className="lg:w-72 flex-shrink-0">
            {/* Mobile toggle */}
            <button
              onClick={() => setFilterOpen(!filterOpen)}
              className="lg:hidden w-full flex items-center justify-between px-4 py-3 bg-white rounded-xl border border-gray-200 mb-4 font-semibold text-tsm-navy-800"
            >
              <span className="flex items-center gap-2">
                <FiFilter size={16} />
                Filters
                {activeFilterCount > 0 && (
                  <span className="w-5 h-5 bg-tsm-red-600 text-white text-xs rounded-full flex items-center justify-center">{activeFilterCount}</span>
                )}
              </span>
              {filterOpen ? <FiChevronUp size={16} /> : <FiChevronDown size={16} />}
            </button>

            <div className={`${filterOpen ? 'block' : 'hidden'} lg:block bg-white rounded-2xl border border-gray-100 shadow-card p-5 space-y-5`}>
              <div className="flex items-center justify-between">
                <h2 className="font-bold text-tsm-navy-900">Filters</h2>
                {activeFilterCount > 0 && (
                  <button onClick={clearFilters} className="text-xs text-tsm-red-600 hover:underline flex items-center gap-1">
                    <FiX size={12} /> Clear all
                  </button>
                )}
              </div>

              {/* Search */}
              <div>
                <label className="form-label">Search</label>
                <div className="relative">
                  <FiSearch size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    className="form-input pl-9 text-sm"
                    placeholder="Vehicle name or brand..."
                    value={filters.search}
                    onChange={e => setFilter('search', e.target.value)}
                  />
                </div>
              </div>

              {/* Category */}
              <div>
                <label className="form-label">Category</label>
                <select className="form-select text-sm" value={filters.category} onChange={e => setFilter('category', e.target.value)}>
                  <option value="">All Categories</option>
                  {VEHICLE_CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              {/* Brand */}
              <div>
                <label className="form-label">Brand</label>
                <select className="form-select text-sm" value={filters.brand} onChange={e => setFilter('brand', e.target.value)}>
                  <option value="">All Brands</option>
                  {BRANDS.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>

              {/* Year */}
              <div>
                <label className="form-label">Year</label>
                <select className="form-select text-sm" value={filters.year} onChange={e => setFilter('year', e.target.value)}>
                  <option value="">Any Year</option>
                  {[2024, 2023, 2022, 2021, 2020, 2019, 2018, 2017, 2016].map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>

              {/* Price Range */}
              <div>
                <label className="form-label">Price Range</label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    className="form-input text-xs"
                    placeholder="Min ₹"
                    value={filters.minPrice}
                    onChange={e => setFilter('minPrice', e.target.value)}
                    min={0}
                  />
                  <input
                    type="number"
                    className="form-input text-xs"
                    placeholder="Max ₹"
                    value={filters.maxPrice}
                    onChange={e => setFilter('maxPrice', e.target.value)}
                    min={0}
                  />
                </div>
              </div>

              {/* Fuel Type */}
              <div>
                <label className="form-label">Fuel Type</label>
                <select className="form-select text-sm" value={filters.fuelType} onChange={e => setFilter('fuelType', e.target.value)}>
                  <option value="">All Fuel Types</option>
                  {FUEL_TYPES.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>

              {/* Transmission */}
              <div>
                <label className="form-label">Transmission</label>
                <select className="form-select text-sm" value={filters.transmission} onChange={e => setFilter('transmission', e.target.value)}>
                  <option value="">All</option>
                  {TRANSMISSION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>

              {/* Condition */}
              <div>
                <label className="form-label">Condition</label>
                <select className="form-select text-sm" value={filters.condition} onChange={e => setFilter('condition', e.target.value)}>
                  <option value="">Any Condition</option>
                  {CONDITIONS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              {/* Location */}
              <div>
                <label className="form-label">Location</label>
                <select className="form-select text-sm" value={filters.location} onChange={e => setFilter('location', e.target.value)}>
                  <option value="">All Locations</option>
                  {LOCATIONS.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>

              {/* Status */}
              <div>
                <label className="form-label">Availability</label>
                <select className="form-select text-sm" value={filters.status} onChange={e => setFilter('status', e.target.value)}>
                  <option value="">All</option>
                  <option value="available">Available Only</option>
                  <option value="sold">Sold</option>
                </select>
              </div>

              <button onClick={clearFilters} className="w-full py-2.5 border border-gray-200 text-gray-600 text-xs font-semibold rounded-lg hover:bg-gray-50 transition-colors">
                Clear All Filters
              </button>
            </div>
          </aside>

          {/* ─── MAIN CONTENT ─── */}
          <div className="flex-1 min-w-0">
            {/* Sort + View toggle bar */}
            <div className="flex flex-col xs:flex-row items-start xs:items-center justify-between gap-3 mb-5 bg-white rounded-xl border border-gray-100 px-4 py-3">
              <p className="text-sm text-gray-600">
                <span className="font-semibold text-tsm-navy-900">{vehicles.length}</span> vehicles found
                {activeFilterCount > 0 && <span className="ml-1 text-tsm-red-600 text-xs">({activeFilterCount} filter{activeFilterCount > 1 ? 's' : ''} applied)</span>}
              </p>
              <div className="flex items-center gap-3">
                <select
                  value={sort}
                  onChange={e => setSort(e.target.value)}
                  className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-tsm-red-500"
                >
                  {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                <div className="flex gap-1 border border-gray-200 rounded-lg p-0.5">
                  <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-tsm-navy-800 text-white' : 'text-gray-500 hover:text-gray-700'}`} aria-label="Grid view">
                    <FiGrid size={15} />
                  </button>
                  <button onClick={() => setViewMode('list')} className={`p-1.5 rounded-md transition-colors ${viewMode === 'list' ? 'bg-tsm-navy-800 text-white' : 'text-gray-500 hover:text-gray-700'}`} aria-label="List view">
                    <FiList size={15} />
                  </button>
                </div>
              </div>
            </div>

            {/* Vehicle Grid */}
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
              </div>
            ) : paginated.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-2xl border border-gray-100">
                <span className="text-6xl mb-4">🔍</span>
                <h3 className="text-xl font-bold text-tsm-navy-900 font-display mb-2">No Vehicles Found</h3>
                <p className="text-gray-500 text-sm mb-5">Try adjusting your search filters or browse all vehicles.</p>
                <button onClick={clearFilters} className="btn-primary">Clear Filters</button>
              </div>
            ) : (
              <div className={viewMode === 'grid'
                ? 'grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5'
                : 'flex flex-col gap-4'
              }>
                {paginated.map(v => <VehicleCard key={v.id} vehicle={v} />)}
              </div>
            )}

            {/* Pagination */}
            {!loading && totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 text-sm font-medium border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition-colors"
                >
                  ← Previous
                </button>
                {[...Array(totalPages)].map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setPage(i + 1)}
                    className={`w-9 h-9 text-sm font-medium rounded-lg transition-colors ${
                      page === i + 1 ? 'bg-tsm-red-600 text-white' : 'border border-gray-200 hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2 text-sm font-medium border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition-colors"
                >
                  Next →
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
