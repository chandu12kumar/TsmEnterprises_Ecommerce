// Centralized Security Configuration
// Thresholds are configurable via environment variables with safe defaults

export const SECURITY_CONFIG = {
  // Rate Limiting Tiers
  RATE_LIMITS: {
    // 1. Auth routes (stricter limits with exponential backoff)
    AUTH: {
      WINDOW_MS: Number(import.meta.env.VITE_RATE_LIMIT_AUTH_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
      MAX_ATTEMPTS: Number(import.meta.env.VITE_RATE_LIMIT_AUTH_MAX_ATTEMPTS) || 5,
      INITIAL_BACKOFF_MS: Number(import.meta.env.VITE_RATE_LIMIT_AUTH_INITIAL_BACKOFF_MS) || 2000, // 2 seconds
      BACKOFF_FACTOR: Number(import.meta.env.VITE_RATE_LIMIT_AUTH_BACKOFF_FACTOR) || 2, // 2x exponential multiplier
      MAX_BACKOFF_MS: Number(import.meta.env.VITE_RATE_LIMIT_AUTH_MAX_BACKOFF_MS) || 60000, // 60 seconds max delay
    },

    // 2. Public endpoints (moderate limits)
    PUBLIC: {
      SEARCH_WINDOW_MS: 60 * 1000, // 1 minute
      SEARCH_MAX_REQUESTS: Number(import.meta.env.VITE_RATE_LIMIT_SEARCH_MAX) || 40,
      ENQUIRY_WINDOW_MS: 10 * 60 * 1000, // 10 minutes
      ENQUIRY_MAX_REQUESTS: Number(import.meta.env.VITE_RATE_LIMIT_ENQUIRY_MAX) || 5,
    },

    // 3. Authenticated actions (looser limits)
    AUTHENTICATED: {
      WINDOW_MS: 60 * 1000, // 1 minute
      MAX_REQUESTS: Number(import.meta.env.VITE_RATE_LIMIT_AUTH_ACTIONS_MAX) || 120,
    },
  },

  // File Upload Constraints
  FILE_UPLOAD: {
    MAX_SIZE_BYTES: (Number(import.meta.env.VITE_MAX_FILE_UPLOAD_MB) || 5) * 1024 * 1024, // 5MB
    MAX_SIZE_MB: Number(import.meta.env.VITE_MAX_FILE_UPLOAD_MB) || 5,
    ALLOWED_MIME_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
    ALLOWED_EXTENSIONS: ['jpg', 'jpeg', 'png', 'webp'],
    MAGIC_BYTES: {
      JPEG: [0xff, 0xd8, 0xff],
      PNG: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
      WEBP: [0x52, 0x49, 0x46, 0x46], // "RIFF"
    },
  },

  // Input Validation Rules
  VALIDATION: {
    NAME_MIN_LENGTH: 2,
    NAME_MAX_LENGTH: 70,
    EMAIL_MAX_LENGTH: 254,
    PASSWORD_MIN_LENGTH: 8,
    PASSWORD_MAX_LENGTH: 128,
    PHONE_LENGTH: 10,
    CITY_MIN_LENGTH: 2,
    CITY_MAX_LENGTH: 60,
    ENQUIRY_MESSAGE_MAX_LENGTH: 1000,
    VEHICLE_PRICE_MIN: 1000,
    VEHICLE_PRICE_MAX: 100000000,
    VEHICLE_YEAR_MIN: 1990,
    VEHICLE_MAX_KM: 2000000,
    ALLOWED_CATEGORIES: ['cargo-auto', 'tractor', 'mini-truck', 'auto-rickshaw', 'pickup-truck'],
    ALLOWED_FUEL_TYPES: ['Diesel', 'Petrol', 'CNG', 'Electric'],
    ALLOWED_TRANSMISSIONS: ['Manual', 'Automatic'],
    ALLOWED_VEHICLE_STATUSES: ['available', 'reserved', 'sold'],
  },

  // Demo Mode Config (Strictly disabled in production)
  DEMO_AUTH: {
    ENABLED: import.meta.env.DEV && import.meta.env.VITE_ENABLE_DEMO_AUTH === 'true',
    ADMIN_EMAIL: import.meta.env.VITE_DEMO_ADMIN_EMAIL || 'admin@tsmenterprises.in',
    ADMIN_PASSWORD: import.meta.env.VITE_DEMO_ADMIN_PASSWORD || '',
  },
}
