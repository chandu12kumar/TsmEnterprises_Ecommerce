// Strict Input Schema Validators
// Strictly validates type, length, structure, and character sets.
// Rejects any input that does not conform to the schema.

import { SECURITY_CONFIG } from '../config/securityConfig'

// RFC 5322 Compliant Email Regex
const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/

// Strict UUID v4 Regex
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

// Generic safe UUID regex (v1-v5)
const SAFE_UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// Strict Name Regex: letters, spaces, hyphens, periods, apostrophes only
const NAME_REGEX = /^[a-zA-Z\u00C0-\u024F\s.'-]+$/

// Strict Phone: Indian 10-digit mobile starting with 6-9
const PHONE_REGEX = /^[6-9]\d{9}$/

// Safe City/Location Regex: alphanumeric, spaces, commas, hyphens
const CITY_REGEX = /^[a-zA-Z0-9\s,.-]+$/

/**
 * Validates Email Address
 */
export function validateEmail(email) {
  if (typeof email !== 'string') {
    return { valid: false, error: 'Email must be a string.' }
  }

  const trimmed = email.trim()
  if (!trimmed) {
    return { valid: false, error: 'Email is required.' }
  }

  if (trimmed.length > SECURITY_CONFIG.VALIDATION.EMAIL_MAX_LENGTH) {
    return { valid: false, error: `Email cannot exceed ${SECURITY_CONFIG.VALIDATION.EMAIL_MAX_LENGTH} characters.` }
  }

  if (!EMAIL_REGEX.test(trimmed)) {
    return { valid: false, error: 'Please enter a valid email address.' }
  }

  return { valid: true, value: trimmed.toLowerCase() }
}

/**
 * Validates Password
 */
export function validatePassword(password) {
  if (typeof password !== 'string') {
    return { valid: false, error: 'Password must be a string.' }
  }

  if (password.length < SECURITY_CONFIG.VALIDATION.PASSWORD_MIN_LENGTH) {
    return { valid: false, error: `Password must be at least ${SECURITY_CONFIG.VALIDATION.PASSWORD_MIN_LENGTH} characters.` }
  }

  if (password.length > SECURITY_CONFIG.VALIDATION.PASSWORD_MAX_LENGTH) {
    return { valid: false, error: `Password cannot exceed ${SECURITY_CONFIG.VALIDATION.PASSWORD_MAX_LENGTH} characters.` }
  }

  // Reject control characters or null bytes
  if (/[\x00-\x1F\x7F]/.test(password)) {
    return { valid: false, error: 'Password contains invalid control characters.' }
  }

  return { valid: true, value: password }
}

/**
 * Validates Full Name
 */
export function validateName(name, fieldName = 'Full Name') {
  if (typeof name !== 'string') {
    return { valid: false, error: `${fieldName} must be a string.` }
  }

  const trimmed = name.trim()
  if (trimmed.length < SECURITY_CONFIG.VALIDATION.NAME_MIN_LENGTH) {
    return { valid: false, error: `${fieldName} must be at least ${SECURITY_CONFIG.VALIDATION.NAME_MIN_LENGTH} characters.` }
  }

  if (trimmed.length > SECURITY_CONFIG.VALIDATION.NAME_MAX_LENGTH) {
    return { valid: false, error: `${fieldName} cannot exceed ${SECURITY_CONFIG.VALIDATION.NAME_MAX_LENGTH} characters.` }
  }

  if (!NAME_REGEX.test(trimmed)) {
    return { valid: false, error: `${fieldName} contains invalid characters.` }
  }

  return { valid: true, value: trimmed }
}

/**
 * Validates Phone Number
 */
export function validatePhone(phone) {
  if (typeof phone !== 'string' && typeof phone !== 'number') {
    return { valid: false, error: 'Phone number must be provided.' }
  }

  const cleaned = String(phone).replace(/\D/g, '')
  if (!PHONE_REGEX.test(cleaned)) {
    return { valid: false, error: 'Please enter a valid 10-digit mobile number starting with 6, 7, 8, or 9.' }
  }

  return { valid: true, value: cleaned }
}

/**
 * Validates City / Location
 */
export function validateCity(city) {
  if (!city) return { valid: true, value: '' }
  if (typeof city !== 'string') {
    return { valid: false, error: 'City must be a text string.' }
  }

  const trimmed = city.trim()
  if (trimmed.length > SECURITY_CONFIG.VALIDATION.CITY_MAX_LENGTH) {
    return { valid: false, error: `City cannot exceed ${SECURITY_CONFIG.VALIDATION.CITY_MAX_LENGTH} characters.` }
  }

  if (trimmed && !CITY_REGEX.test(trimmed)) {
    return { valid: false, error: 'City contains invalid characters.' }
  }

  return { valid: true, value: trimmed }
}

/**
 * Validates UUID
 * Returns object with { valid, value, error } for consistency with all schema validators.
 */
export function validateUUID(id) {
  if (typeof id !== 'string' && typeof id !== 'number') {
    return { valid: false, value: '', error: 'Vehicle ID is missing.' }
  }

  const str = String(id).trim()
  if (!str || str === 'undefined' || str === 'null') {
    return { valid: false, value: '', error: 'Vehicle ID is missing.' }
  }

  const isValid = SAFE_UUID_REGEX.test(str)
  return {
    valid: isValid,
    value: str,
    error: isValid ? null : 'Invalid vehicle ID format.',
  }
}

/**
 * Validates Vehicle Form Payload (Admin)
 */
export function validateVehiclePayload(payload, isUpdate = false) {
  const errors = {}

  if (!payload || typeof payload !== 'object') {
    return { valid: false, error: 'Invalid vehicle payload.', errors: { form: 'Invalid vehicle payload' } }
  }

  // Name
  if (!isUpdate || payload.name !== undefined) {
    if (typeof payload.name !== 'string' || payload.name.trim().length < 2 || payload.name.trim().length > 100) {
      errors.name = 'Vehicle name must be between 2 and 100 characters.'
    }
  }

  // Category whitelist
  if (!isUpdate || payload.category !== undefined) {
    if (!SECURITY_CONFIG.VALIDATION.ALLOWED_CATEGORIES.includes(payload.category)) {
      errors.category = `Category must be one of: ${SECURITY_CONFIG.VALIDATION.ALLOWED_CATEGORIES.join(', ')}`
    }
  }

  // Price
  if (!isUpdate || payload.price !== undefined) {
    const price = Number(payload.price)
    if (isNaN(price) || price < SECURITY_CONFIG.VALIDATION.VEHICLE_PRICE_MIN || price > SECURITY_CONFIG.VALIDATION.VEHICLE_PRICE_MAX) {
      errors.price = `Price must be between ₹${SECURITY_CONFIG.VALIDATION.VEHICLE_PRICE_MIN.toLocaleString()} and ₹${SECURITY_CONFIG.VALIDATION.VEHICLE_PRICE_MAX.toLocaleString()}.`
    }
  }

  // Year
  const yearVal = payload.year !== undefined ? payload.year : undefined
  if (!isUpdate || yearVal !== undefined) {
    const currentYear = new Date().getFullYear() + 1
    const year = Number(yearVal)
    if (isNaN(year) || year < SECURITY_CONFIG.VALIDATION.VEHICLE_YEAR_MIN || year > currentYear) {
      errors.year = `Year must be between ${SECURITY_CONFIG.VALIDATION.VEHICLE_YEAR_MIN} and ${currentYear}.`
    }
  }

  // KM Driven (support km_driven or kmDriven)
  const rawKm = payload.km_driven !== undefined ? payload.km_driven : payload.kmDriven
  if (rawKm !== undefined && rawKm !== null && rawKm !== '') {
    const km = Number(rawKm)
    if (isNaN(km) || km < 0 || km > SECURITY_CONFIG.VALIDATION.VEHICLE_MAX_KM) {
      errors.km_driven = `KM driven must be between 0 and ${SECURITY_CONFIG.VALIDATION.VEHICLE_MAX_KM.toLocaleString()} km.`
    }
  }

  // Fuel Type Whitelist (support fuel_type or fuelType)
  const fuel = payload.fuel_type || payload.fuelType
  if (fuel && !SECURITY_CONFIG.VALIDATION.ALLOWED_FUEL_TYPES.includes(fuel)) {
    errors.fuel_type = `Fuel type must be one of: ${SECURITY_CONFIG.VALIDATION.ALLOWED_FUEL_TYPES.join(', ')}`
  }

  // Status Whitelist
  if (payload.status && !SECURITY_CONFIG.VALIDATION.ALLOWED_VEHICLE_STATUSES.includes(payload.status)) {
    errors.status = `Status must be one of: ${SECURITY_CONFIG.VALIDATION.ALLOWED_VEHICLE_STATUSES.join(', ')}`
  }

  const valid = Object.keys(errors).length === 0
  return {
    valid,
    error: valid ? null : Object.values(errors)[0],
    errors,
  }
}

/**
 * Validates Enquiry Form Payload
 */
export function validateEnquiryPayload(payload) {
  const errors = {}

  if (!payload || typeof payload !== 'object') {
    return { valid: false, error: 'Invalid enquiry payload.', errors: { form: 'Invalid enquiry payload' } }
  }

  const nameVal = validateName(payload.name || '')
  if (!nameVal.valid) errors.name = nameVal.error

  const phoneVal = validatePhone(payload.phone || '')
  if (!phoneVal.valid) errors.phone = phoneVal.error

  if (payload.email) {
    const emailVal = validateEmail(payload.email)
    if (!emailVal.valid) errors.email = emailVal.error
  }

  if (payload.message && typeof payload.message === 'string') {
    if (payload.message.length > SECURITY_CONFIG.VALIDATION.ENQUIRY_MESSAGE_MAX_LENGTH) {
      errors.message = `Message cannot exceed ${SECURITY_CONFIG.VALIDATION.ENQUIRY_MESSAGE_MAX_LENGTH} characters.`
    }
  }

  if (payload.vehicleId && !validateUUID(payload.vehicleId).valid) {
    errors.vehicleId = 'Invalid vehicle identifier.'
  }

  const valid = Object.keys(errors).length === 0
  return {
    valid,
    error: valid ? null : Object.values(errors)[0],
    errors,
  }
}

/**
 * Verifies Image File Binary Magic Bytes
 * Inspects the first 12 bytes of a file to verify true file format (prevents disguised files/malware).
 */
export async function verifyImageMagicBytes(file) {
  if (!(file instanceof File) && !(file instanceof Blob)) {
    return { valid: false, error: 'Invalid file object.' }
  }

  // 1. File Size Check
  if (file.size > SECURITY_CONFIG.FILE_UPLOAD.MAX_SIZE_BYTES) {
    return {
      valid: false,
      error: `File size exceeds the maximum allowed limit of ${SECURITY_CONFIG.FILE_UPLOAD.MAX_SIZE_MB}MB.`,
    }
  }

  // 2. MIME Whitelist Check
  if (!SECURITY_CONFIG.FILE_UPLOAD.ALLOWED_MIME_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: 'Only JPEG, PNG, and WebP images are allowed.',
    }
  }

  // 3. Binary Magic Bytes Inspection
  try {
    const slice = file.slice(0, 12)
    const arrayBuffer = await slice.arrayBuffer()
    const bytes = new Uint8Array(arrayBuffer)

    if (bytes.length < 4) {
      return { valid: false, error: 'File is corrupted or empty.' }
    }

    // JPEG signature: FF D8 FF
    const isJpeg = bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff

    // PNG signature: 89 50 4E 47 0D 0A 1A 0A
    const isPng =
      bytes[0] === 0x89 &&
      bytes[1] === 0x50 &&
      bytes[2] === 0x4e &&
      bytes[3] === 0x47

    // WebP signature: "RIFF" .... "WEBP"
    const isWebP =
      bytes[0] === 0x52 &&
      bytes[1] === 0x49 &&
      bytes[2] === 0x46 &&
      bytes[3] === 0x46 &&
      bytes[8] === 0x57 &&
      bytes[9] === 0x45 &&
      bytes[10] === 0x42 &&
      bytes[11] === 0x50

    if (!isJpeg && !isPng && !isWebP) {
      return {
        valid: false,
        error: 'File content does not match genuine JPEG, PNG, or WebP image headers.',
      }
    }

    return { valid: true }
  } catch (err) {
    return { valid: false, error: 'Unable to verify image file integrity.' }
  }
}
