import { timingSafeEqual } from 'crypto'

/**
 * Constant-time string comparison to prevent timing attacks.
 * Returns true if strings are equal, false otherwise.
 */
export function safeCompare(a: string, b: string): boolean {
  // Handle empty/null cases
  if (!a || !b) return false

  // Convert to buffers for constant-time comparison
  const bufA = Buffer.from(a, 'utf-8')
  const bufB = Buffer.from(b, 'utf-8')

  // If lengths differ, still do the comparison to maintain constant time
  // but use a fixed-length buffer for the shorter string
  if (bufA.length !== bufB.length) {
    // Compare against itself to maintain timing, then return false
    timingSafeEqual(bufA, bufA)
    return false
  }

  return timingSafeEqual(bufA, bufB)
}

/**
 * Validates admin API key from request headers.
 * Returns true if valid, false if missing or invalid.
 */
export function validateAdminKey(req: Request): boolean {
  const adminKey = req.headers.get('x-admin-key')
  const expectedKey = Netlify.env.get('ADMIN_API_KEY')

  // Require both keys to exist
  if (!expectedKey || !adminKey) {
    return false
  }

  return safeCompare(adminKey, expectedKey)
}
