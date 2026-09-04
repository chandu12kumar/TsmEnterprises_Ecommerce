import { useState } from 'react'
import { FiX, FiZoomIn } from 'react-icons/fi'

export default function ImageGallery({ images = [], vehicleName = '' }) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [lightboxOpen, setLightboxOpen] = useState(false)

  if (!images.length) return null

  const activeImage = images[activeIndex]

  return (
    <div className="space-y-3">
      {/* Main Image */}
      <div
        className="relative rounded-2xl overflow-hidden bg-gray-100 cursor-zoom-in group"
        onClick={() => setLightboxOpen(true)}
        role="button"
        aria-label="View full size image"
      >
        <img
          src={activeImage}
          alt={`${vehicleName} - Image ${activeIndex + 1}`}
          className="w-full h-72 sm:h-96 object-cover transition-transform duration-500 group-hover:scale-105"
          onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=600&fit=crop' }}
        />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300 flex items-center justify-center">
          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-white/90 rounded-full p-3">
            <FiZoomIn size={20} className="text-tsm-navy-800" />
          </div>
        </div>
        {images.length > 1 && (
          <div className="absolute bottom-3 right-3 bg-black/50 text-white text-xs px-2 py-1 rounded-full">
            {activeIndex + 1} / {images.length}
          </div>
        )}
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
          {images.map((img, i) => (
            <button
              key={i}
              onClick={() => setActiveIndex(i)}
              className={`gallery-thumb aspect-square overflow-hidden rounded-lg ${i === activeIndex ? 'active' : ''}`}
              aria-label={`View image ${i + 1}`}
            >
              <img
                src={img}
                alt={`${vehicleName} thumbnail ${i + 1}`}
                className="w-full h-full object-cover"
                onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=200&h=200&fit=crop' }}
              />
            </button>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {lightboxOpen && (
        <div
          className="fixed inset-0 bg-black/95 z-[100] flex items-center justify-center p-4"
          onClick={() => setLightboxOpen(false)}
        >
          <button
            className="absolute top-4 right-4 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors z-10"
            onClick={() => setLightboxOpen(false)}
            aria-label="Close lightbox"
          >
            <FiX size={20} />
          </button>

          {/* Prev/Next */}
          {activeIndex > 0 && (
            <button
              className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors"
              onClick={(e) => { e.stopPropagation(); setActiveIndex(i => i - 1) }}
            >
              ←
            </button>
          )}
          {activeIndex < images.length - 1 && (
            <button
              className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors"
              onClick={(e) => { e.stopPropagation(); setActiveIndex(i => i + 1) }}
            >
              →
            </button>
          )}

          <img
            src={activeImage}
            alt={vehicleName}
            className="max-w-full max-h-[90vh] object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  )
}
