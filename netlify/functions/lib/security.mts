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

/**
 * Validates the shared app secret sent by our own frontend in the
 * x-app-secret header.
 *
 * HONEST LIMITATION: this is a shared secret baked into the client bundle,
 * not real authentication. It stops casual/scripted abuse (randos hitting
 * the endpoint URL directly without inspecting the app's network requests),
 * but it does NOT stop a determined attacker who opens devtools, copies the
 * header from a real request, and replays it. Treat it as a speed bump, not
 * a lock. The real protection against cost abuse is the DB-backed usage
 * quota in lib/usage.mts.
 *
 * Fails OPEN (returns true) if APP_SHARED_SECRET is not configured, so local
 * dev keeps working without extra setup. A warning is logged once per cold
 * start in that case so it's not silently bypassed in a deployed environment
 * by accident.
 */
let warnedMissingSecretThisInstance = false

export function validateAppSecret(req: Request): boolean {
  const expectedSecret = Netlify.env.get('APP_SHARED_SECRET')

  if (!expectedSecret) {
    if (!warnedMissingSecretThisInstance) {
      console.warn(
        'SECURITY WARNING: APP_SHARED_SECRET is not set. Shared-secret check ' +
        'is failing OPEN (allowing all requests through this layer). This is ' +
        'expected for local dev but should be configured in production.'
      )
      warnedMissingSecretThisInstance = true
    }
    return true
  }

  const providedSecret = req.headers.get('x-app-secret')
  if (!providedSecret) {
    return false
  }

  return safeCompare(providedSecret, expectedSecret)
}
