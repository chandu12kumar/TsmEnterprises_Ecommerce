import { useState, useEffect } from 'react'
import {
  FiPlus, FiEdit2, FiTrash2, FiSearch, FiCheck, FiX,
  FiEye, FiDollarSign, FiCalendar, FiTag, FiImage
} from 'react-icons/fi'
import AdminLayout from './AdminLayout'
import {
  SAMPLE_VEHICLES, VEHICLE_CATEGORIES, BRANDS,
  FUEL_TYPES, TRANSMISSION_TYPES, CONDITIONS, LOCATIONS, formatPrice
} from '../../data/vehicles'
import toast from 'react-hot-toast'

import { vehicleService } from '../../services/vehicleService'
import { sanitizeErrorMessage } from '../../utils/errorHandler'

export default function AdminVehicles() {
  const [vehicles, setVehicles] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingVehicle, setEditingVehicle] = useState(null)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [updatingId, setUpdatingId] = useState(null)

  // Form State
  const initialForm = {
    name: '',
    category: 'cargo-auto',
    brand: 'Mahindra',
    model: '',
    year: 2021,
    price: 250000,
    fuelType: 'Diesel',
    transmission: 'Manual',
    kmDriven: 45000,
    location: 'Salem, Tamil Nadu',
    condition: 'Good',
    status: 'available',
    registrationYear: 2021,
    ownerNumber: '1st Owner',
    engineDetails: '',
    insuranceStatus: 'Valid',
    documents: 'RC, Insurance, PUC',
    description: '',
    imagesText: 'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=800&h=600&fit=crop'
  }

  const [formData, setFormData] = useState(initialForm)

  const loadVehicles = async () => {
    const { data } = await vehicleService.getVehicles()
    if (data) setVehicles(data)
  }

  useEffect(() => {
    loadVehicles()
  }, [])

  const handleOpenAdd = () => {
    setEditingVehicle(null)
    setFormData(initialForm)
    setIsModalOpen(true)
  }

  const handleOpenEdit = (v) => {
    setEditingVehicle(v)
    setFormData({
      ...v,
      imagesText: (v.images || []).join('\n')
    })
    setIsModalOpen(true)
  }

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this vehicle?')) {
      const { success, error } = await vehicleService.deleteVehicle(id)
      if (success) {
        setVehicles(prev => prev.filter(v => v.id !== id))
        toast.success('Vehicle deleted successfully')
      } else {
        toast.error(sanitizeErrorMessage(error, 'Could not delete vehicle.'))
      }
    }
  }

  const handleStatusChange = async (vehicle, newStatus) => {
    try {
      setUpdatingId(vehicle.id)

      const normalizedStatus = String(newStatus)
        .toLowerCase()
        .trim()

      if (!['available', 'reserved', 'sold'].includes(normalizedStatus)) {
        throw new Error('Invalid vehicle status')
      }

      const { data, error } = await vehicleService.updateVehicle(
        vehicle.id,
        {
          status: normalizedStatus,
        }
      )

      if (error) {
        throw error
      }

      // Update local UI using the actual database response
      setVehicles(prev =>
        prev.map(v =>
          v.id === vehicle.id
            ? { ...v, ...(data || {}), status: normalizedStatus }
            : v
        )
      )

      toast.success(
        `Vehicle status changed to ${normalizedStatus}`
      )
    } catch (error) {
      console.error('Vehicle status update failed:', {
        vehicleId: vehicle.id,
        status: newStatus,
        error,
      })

      toast.error(
        error?.message || 'Failed to update vehicle status'
      )
    } finally {
      setUpdatingId(null)
    }
  }

  const toggleStatus = async (id) => {
    const current = vehicles.find(v => v.id === id)
    if (!current) return
    const nextStatus = current.status === 'available' ? 'sold' : 'available'
    await handleStatusChange(current, nextStatus)
  }

  // Handle image file upload to Supabase Storage
  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    setUploadingImage(true)
    const uploadedUrls = []
    for (const file of files) {
      const res = await vehicleService.uploadImage(file, editingVehicle?.id)
      if (res.url) {
        uploadedUrls.push(res.url)
      } else if (res.error) {
        toast.error(sanitizeErrorMessage(res.error, 'Image upload failed.'))
      }
    }
    setUploadingImage(false)

    if (uploadedUrls.length > 0) {
      setFormData(prev => ({
        ...prev,
        imagesText: prev.imagesText ? `${prev.imagesText}\n${uploadedUrls.join('\n')}` : uploadedUrls.join('\n')
      }))
      toast.success(`${uploadedUrls.length} image(s) uploaded to storage!`)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.name.trim()) {
      toast.error('Vehicle name is required')
      return
    }

    const imageArray = formData.imagesText
      .split('\n')
      .map(url => url.trim())
      .filter(Boolean)

    if (imageArray.length === 0) {
      imageArray.push('https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=600&fit=crop')
    }

    if (editingVehicle) {
      const { error } = await vehicleService.updateVehicle(editingVehicle.id, {
        ...formData,
        year: Number(formData.year),
        price: Number(formData.price),
        kmDriven: Number(formData.kmDriven),
        registrationYear: Number(formData.registrationYear),
        images: imageArray,
      })
      if (!error) {
        toast.success('Vehicle updated successfully')
        loadVehicles()
      } else {
        toast.error(sanitizeErrorMessage(error, 'Update failed.'))
      }
    } else {
      const { error } = await vehicleService.addVehicle({
        ...formData,
        year: Number(formData.year),
        price: Number(formData.price),
        kmDriven: Number(formData.kmDriven),
        registrationYear: Number(formData.registrationYear),
        images: imageArray,
      })
      if (!error) {
        toast.success('New vehicle added to inventory')
        loadVehicles()
      } else {
        toast.error(sanitizeErrorMessage(error, 'Failed to add vehicle.'))
      }
    }

    setIsModalOpen(false)
  }

  const filtered = vehicles.filter(v => {
    const matchesSearch = v.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.location.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCat = !filterCategory || v.category === filterCategory
    return matchesSearch && matchesCat
  })

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-tsm-navy-900 font-display">Vehicle Management</h1>
            <p className="text-gray-500 text-sm mt-0.5">Manage, add, edit, and update vehicle availability</p>
          </div>
          <button
            onClick={handleOpenAdd}
            className="btn-primary py-2.5 px-4 text-sm inline-flex items-center gap-2"
          >
            <FiPlus size={16} /> Add Vehicle
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-4 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Search by vehicle name, brand, location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="form-input pl-10 text-sm"
            />
          </div>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="form-select text-sm sm:w-56"
          >
            <option value="">All Categories</option>
            {VEHICLE_CATEGORIES.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-tsm-navy-900 text-white uppercase text-xs font-semibold">
                <tr>
                  <th className="px-5 py-4">Vehicle</th>
                  <th className="px-4 py-4">Category / Brand</th>
                  <th className="px-4 py-4">Price</th>
                  <th className="px-4 py-4">Year & KM</th>
                  <th className="px-4 py-4">Status</th>
                  <th className="px-5 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center py-10 text-gray-400">
                      No vehicles found matching your criteria.
                    </td>
                  </tr>
                ) : (
                  filtered.map(v => (
                    <tr key={v.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={v.images?.[0]}
                            alt={v.name}
                            className="w-14 h-11 object-cover rounded-lg border border-gray-200 flex-shrink-0"
                            onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=100&h=80&fit=crop' }}
                          />
                          <div>
                            <span className="font-semibold text-tsm-navy-900 line-clamp-1">{v.name}</span>
                            <span className="text-xs text-gray-400 line-clamp-1">{v.location}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-xs font-medium text-tsm-navy-800 capitalize">
                          {v.category?.replace(/-/g, ' ')}
                        </div>
                        <div className="text-xs text-gray-400">{v.brand}</div>
                      </td>
                      <td className="px-4 py-4 font-bold text-tsm-navy-900 font-display">
                        {formatPrice(v.price)}
                      </td>
                      <td className="px-4 py-4 text-xs">
                        <div>{v.year} • {v.fuelType}</div>
                        <div className="text-gray-400">{Number(v.kmDriven).toLocaleString('en-IN')} KM</div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-col gap-1 items-start">
                          <select
                            value={v.status}
                            disabled={updatingId === v.id}
                            onChange={(e) => handleStatusChange(v, e.target.value)}
                            className={`text-xs font-semibold rounded-lg px-2.5 py-1 border transition-colors cursor-pointer capitalize outline-none ${
                              v.status === 'available'
                                ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'
                                : v.status === 'reserved'
                                ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                                : 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
                            }`}
                          >
                            <option value="available">Available</option>
                            <option value="reserved">Reserved</option>
                            <option value="sold">Sold</option>
                          </select>
                          {updatingId === v.id && (
                            <span className="text-[10px] text-gray-400 font-medium animate-pulse">Saving...</span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="inline-flex items-center gap-2">
                          <button
                            onClick={() => handleOpenEdit(v)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit Vehicle"
                          >
                            <FiEdit2 size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(v.id)}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete Vehicle"
                          >
                            <FiTrash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl overflow-hidden my-8">
            <div className="bg-tsm-navy-900 text-white px-6 py-4 flex items-center justify-between">
              <h3 className="font-bold text-lg font-display">
                {editingVehicle ? 'Edit Vehicle' : 'Add New Vehicle'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-white/70 hover:text-white">
                <FiX size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Vehicle Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="form-input text-sm"
                    placeholder="e.g. Mahindra Cargo Auto"
                  />
                </div>
                <div>
                  <label className="form-label">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="form-select text-sm"
                  >
                    {VEHICLE_CATEGORIES.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="form-label">Brand</label>
                  <select
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    className="form-select text-sm"
                  >
                    {BRANDS.map(b => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="form-label">Model</label>
                  <input
                    type="text"
                    value={formData.model}
                    onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                    className="form-input text-sm"
                    placeholder="e.g. Maxima Cargo"
                  />
                </div>
                <div>
                  <label className="form-label">Manufacturing Year</label>
                  <input
                    type="number"
                    min="1990"
                    max="2030"
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                    className="form-input text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="form-label">Price (₹) *</label>
                  <input
                    type="number"
                    required
                    min="1000"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="form-input text-sm"
                  />
                </div>
                <div>
                  <label className="form-label">KM Driven</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.kmDriven}
                    onChange={(e) => setFormData({ ...formData, kmDriven: e.target.value })}
                    className="form-input text-sm"
                  />
                </div>
                <div>
                  <label className="form-label">Fuel Type</label>
                  <select
                    value={formData.fuelType}
                    onChange={(e) => setFormData({ ...formData, fuelType: e.target.value })}
                    className="form-select text-sm"
                  >
                    {FUEL_TYPES.map(f => (
                      <option key={f} value={f}>{f}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="form-label">Transmission</label>
                  <select
                    value={formData.transmission}
                    onChange={(e) => setFormData({ ...formData, transmission: e.target.value })}
                    className="form-select text-sm"
                  >
                    {TRANSMISSION_TYPES.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="form-label">Condition</label>
                  <select
                    value={formData.condition}
                    onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
                    className="form-select text-sm"
                  >
                    {CONDITIONS.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="form-label">Availability Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="form-select text-sm"
                  >
                    <option value="available">Available</option>
                    <option value="reserved">Reserved</option>
                    <option value="sold">Sold</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="form-label">Location</label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="form-input text-sm"
                    placeholder="e.g. Salem, Tamil Nadu"
                  />
                </div>
                <div>
                  <label className="form-label">Registration Year</label>
                  <input
                    type="number"
                    value={formData.registrationYear}
                    onChange={(e) => setFormData({ ...formData, registrationYear: e.target.value })}
                    className="form-input text-sm"
                  />
                </div>
                <div>
                  <label className="form-label">Owner Number</label>
                  <input
                    type="text"
                    value={formData.ownerNumber}
                    onChange={(e) => setFormData({ ...formData, ownerNumber: e.target.value })}
                    className="form-input text-sm"
                    placeholder="e.g. 1st Owner"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="form-label">Engine Details</label>
                  <input
                    type="text"
                    value={formData.engineDetails}
                    onChange={(e) => setFormData({ ...formData, engineDetails: e.target.value })}
                    className="form-input text-sm"
                    placeholder="e.g. 616cc Single Cylinder"
                  />
                </div>
                <div>
                  <label className="form-label">Insurance Status</label>
                  <select
                    value={formData.insuranceStatus}
                    onChange={(e) => setFormData({ ...formData, insuranceStatus: e.target.value })}
                    className="form-select text-sm"
                  >
                    <option value="Valid">Valid</option>
                    <option value="Expired">Expired</option>
                    <option value="Not Available">Not Available</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">Documents Available</label>
                  <input
                    type="text"
                    value={formData.documents}
                    onChange={(e) => setFormData({ ...formData, documents: e.target.value })}
                    className="form-input text-sm"
                    placeholder="RC, Insurance, PUC"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="form-label mb-0">Vehicle Images</label>
                  <label className={`cursor-pointer inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border border-tsm-red-200 text-tsm-red-600 hover:bg-tsm-red-50 transition-colors ${uploadingImage ? 'opacity-50 cursor-wait' : ''}`}>
                    <FiImage size={13} />
                    {uploadingImage ? 'Uploading...' : 'Upload to Supabase Storage'}
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      className="sr-only"
                      onChange={handleFileUpload}
                      disabled={uploadingImage}
                    />
                  </label>
                </div>
                <textarea
                  rows={3}
                  value={formData.imagesText}
                  onChange={(e) => setFormData({ ...formData, imagesText: e.target.value })}
                  className="form-input text-sm font-mono"
                  placeholder="https://images.unsplash.com/..."
                />
                <span className="text-xs text-gray-400 mt-1 block">
                  Paste direct image URLs or click "Upload to Supabase Storage" to store photos in the bucket.
                </span>
              </div>

              <div>
                <label className="form-label">Description</label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="form-input text-sm"
                  placeholder="Describe vehicle condition, service history, features..."
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary py-2.5 px-6 text-sm"
                >
                  {editingVehicle ? 'Update Vehicle' : 'Add Vehicle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
