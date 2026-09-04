// Centralized Error Sanitizer & Handler
// Prevents internal table names, SQL constraints, stack traces, and database codes from leaking to the user interface.

const SENSITIVE_PATTERNS = [
  /row-level\s+security/i,
  /violates\s+foreign\s+key/i,
  /violates\s+unique\s+constraint/i,
  /violates\s+check\s+constraint/i,
  /relation\s+["'].*?["']\s+does\s+not\s+exist/i,
  /syntax\s+error\s+at\s+or\s+near/i,
  /database\s+error/i,
  /postgrest/i,
  /pgrst\d+/i,
  /\b42\d{3}\b/, // Postgres error codes e.g. 42501
  /\b23\d{3}\b/, // Postgres constraint codes e.g. 23505
  /supabase_secret/i,
  /service_role/i,
  /auth\.users/i,
  /public\./i,
  /at\s+[\w\s.]+\s+\(.*?:[0-9]+:[0-9]+\)/i, // Stack trace line
  /file:\/\/\//i,
  /([A-Za-z]:\\[^:\n\r]+)/, // Windows paths
  /(\/(?:usr|var|etc|node_modules|src)\/[^:\n\r]+)/, // Unix paths
]

/**
 * Sanitizes technical error messages to safe user-facing text
 * @param {Error|object|string} error - The caught error
 * @param {string} fallbackMessage - Safe default message
 * @returns {string} Sanitized, user-friendly message
 */
export function sanitizeErrorMessage(error, fallbackMessage = 'An unexpected error occurred. Please try again.') {
  if (!error) return fallbackMessage

  const rawMessage = typeof error === 'string'
    ? error
    : error.message || error.error_description || error.error || ''

  // Always log technical details safely for developers in non-production
  if (import.meta.env.DEV) {
    console.debug('[DEV Error Details]:', error)
  }

  if (!rawMessage || typeof rawMessage !== 'string') {
    return fallbackMessage
  }

  // Check if error contains sensitive internal details
  const isSensitive = SENSITIVE_PATTERNS.some((pattern) => pattern.test(rawMessage))
  if (isSensitive) {
    // Categorize common sensitive cases into friendly messages
    if (/row-level\s+security|42501/i.test(rawMessage)) {
      return 'You do not have permission to perform this action.'
    }
    if (/violates\s+unique/i.test(rawMessage)) {
      return 'A record with these details already exists.'
    }
    return fallbackMessage
  }

  // Handle specific known auth messages with clean wording
  const lower = rawMessage.toLowerCase()
  if (lower.includes('invalid login credentials') || lower.includes('invalid credentials')) {
    return 'Incorrect email or password.'
  }
  if (lower.includes('email not confirmed')) {
    return 'Please verify your email address before logging in.'
  }
  if (lower.includes('rate limit') || lower.includes('too many requests')) {
    return 'Too many requests. Please wait a moment and try again.'
  }
  if (lower.includes('network') || lower.includes('failed to fetch')) {
    return 'Network connection error. Please check your internet connection.'
  }
  if (lower.includes('jwt expired') || lower.includes('token has expired')) {
    return 'Your session has expired. Please sign in again.'
  }

  // If length is suspiciously long or contains newlines, treat as potentially raw dump
  if (rawMessage.length > 200 || rawMessage.includes('\n')) {
    return fallbackMessage
  }

  return rawMessage
}
