// Client-side & Action Rate Limiter with Sliding Window & Exponential Backoff
import { SECURITY_CONFIG } from '../config/securityConfig'

const STORAGE_PREFIX = 'tsm_ratelimit_'

class RateLimiter {
  constructor() {
    this.memoryStore = new Map()
  }

  // Generate a composite key combining client session and account identifier
  getCompositeKey(action, identifier = '') {
    const cleanId = (identifier || '').trim().toLowerCase()
    return `${STORAGE_PREFIX}${action}_${cleanId || 'anon'}`
  }

  // Retrieve current record from memory or localStorage
  getRecord(key) {
    if (this.memoryStore.has(key)) {
      return this.memoryStore.get(key)
    }

    try {
      const stored = sessionStorage.getItem(key)
      if (stored) {
        const parsed = JSON.parse(stored)
        this.memoryStore.set(key, parsed)
        return parsed
      }
    } catch {}

    return {
      attempts: 0,
      failures: 0,
      firstAttempt: Date.now(),
      lastAttempt: 0,
      nextAllowedAt: 0,
    }
  }

  // Persist record
  saveRecord(key, record) {
    this.memoryStore.set(key, record)
    try {
      sessionStorage.setItem(key, JSON.stringify(record))
    } catch {}
  }

  /**
   * Check Auth Route Rate Limit with Exponential Backoff
   * @param {string} action - 'login' | 'register' | 'forgot_password' | 'reset_password'
   * @param {string} accountIdentifier - user email or phone
   * @returns {{ allowed: boolean, waitSeconds: number, attemptsRemaining: number, message?: string }}
   */
  checkAuthLimit(action, accountIdentifier = '') {
    const key = this.getCompositeKey(action, accountIdentifier)
    const config = SECURITY_CONFIG.RATE_LIMITS.AUTH
    const now = Date.now()
    const record = this.getRecord(key)

    // Reset window if expired
    if (now - record.firstAttempt > config.WINDOW_MS) {
      record.attempts = 0
      record.failures = 0
      record.firstAttempt = now
      record.nextAllowedAt = 0
      this.saveRecord(key, record)
    }

    // Check if currently backed off
    if (record.nextAllowedAt && now < record.nextAllowedAt) {
      const waitSeconds = Math.ceil((record.nextAllowedAt - now) / 1000)
      return {
        allowed: false,
        waitSeconds,
        attemptsRemaining: 0,
        message: `Too many attempts for this account. Please wait ${waitSeconds}s before trying again.`,
      }
    }

    // Check if maximum total attempts within window exceeded
    if (record.attempts >= config.MAX_ATTEMPTS) {
      const windowRemainingSeconds = Math.ceil((record.firstAttempt + config.WINDOW_MS - now) / 1000)
      return {
        allowed: false,
        waitSeconds: windowRemainingSeconds,
        attemptsRemaining: 0,
        message: `Maximum attempts reached. Please wait ${windowRemainingSeconds}s before trying again.`,
      }
    }

    return {
      allowed: true,
      waitSeconds: 0,
      attemptsRemaining: Math.max(0, config.MAX_ATTEMPTS - record.attempts),
    }
  }

  /**
   * Record a failed auth attempt to apply exponential backoff
   */
  recordAuthFailure(action, accountIdentifier = '') {
    const key = this.getCompositeKey(action, accountIdentifier)
    const config = SECURITY_CONFIG.RATE_LIMITS.AUTH
    const now = Date.now()
    const record = this.getRecord(key)

    record.attempts += 1
    record.failures += 1
    record.lastAttempt = now

    // Exponential backoff calculation:
    // Delay escalates: initialBackoff * (backoffFactor ^ (failures - 1))
    // e.g. 2s, 4s, 8s, 16s, 32s, up to maxBackoffMs (60s)
    if (record.failures >= 2) {
      const multiplier = Math.pow(config.BACKOFF_FACTOR, Math.min(record.failures - 2, 6))
      const backoffMs = Math.min(config.INITIAL_BACKOFF_MS * multiplier, config.MAX_BACKOFF_MS)
      record.nextAllowedAt = now + backoffMs
    }

    this.saveRecord(key, record)
    return record
  }

  /**
   * Reset rate limit upon successful authentication
   */
  recordAuthSuccess(action, accountIdentifier = '') {
    const key = this.getCompositeKey(action, accountIdentifier)
    this.memoryStore.delete(key)
    try {
      sessionStorage.removeItem(key)
    } catch {}
  }

  /**
   * Check Public Rate Limit (e.g. Enquiry submissions, searches)
   */
  checkPublicLimit(action, identifier = '', windowMs = 60000, maxRequests = 30) {
    const key = this.getCompositeKey(`public_${action}`, identifier)
    const now = Date.now()
    const record = this.getRecord(key)

    if (now - record.firstAttempt > windowMs) {
      record.attempts = 1
      record.firstAttempt = now
      this.saveRecord(key, record)
      return { allowed: true, waitSeconds: 0 }
    }

    if (record.attempts >= maxRequests) {
      const waitSeconds = Math.ceil((record.firstAttempt + windowMs - now) / 1000)
      return {
        allowed: false,
        waitSeconds,
        message: `Too many requests. Please wait ${waitSeconds}s before trying again.`,
      }
    }

    record.attempts += 1
    this.saveRecord(key, record)
    return { allowed: true, waitSeconds: 0 }
  }

  /**
   * Check Authenticated User Action Limit (e.g. Cart, Wishlist, Profile)
   */
  checkAuthenticatedLimit(userId, action = 'action') {
    if (!userId) return { allowed: true, waitSeconds: 0 }
    const key = this.getCompositeKey(`auth_user_${action}`, userId)
    const config = SECURITY_CONFIG.RATE_LIMITS.AUTHENTICATED
    const now = Date.now()
    const record = this.getRecord(key)

    if (now - record.firstAttempt > config.WINDOW_MS) {
      record.attempts = 1
      record.firstAttempt = now
      this.saveRecord(key, record)
      return { allowed: true, waitSeconds: 0 }
    }

    if (record.attempts >= config.MAX_REQUESTS) {
      const waitSeconds = Math.ceil((record.firstAttempt + config.WINDOW_MS - now) / 1000)
      return {
        allowed: false,
        waitSeconds,
        message: `Action limit reached. Please wait ${waitSeconds}s.`,
      }
    }

    record.attempts += 1
    this.saveRecord(key, record)
    return { allowed: true, waitSeconds: 0 }
  }
}

export const rateLimiter = new RateLimiter()
