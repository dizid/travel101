/**
 * In-memory IP-based token-bucket rate limiter for Netlify Functions.
 *
 * LIMITATION (read before relying on this for anything serious):
 * Netlify Functions run as separate, potentially concurrent function
 * instances/containers. This module's state is per-instance and resets
 * on every cold start. It is NOT a shared/distributed rate limit — two
 * concurrent requests hitting two different warm instances each get
 * their own bucket. This is a cheap first line of defense against
 * casual scripted abuse (e.g. a tight retry loop hitting one warm
 * instance), NOT the real control. The real backstop is the DB-backed
 * usage quota (see lib/usage.mts) which is consistent across instances.
 * Do not remove the DB quota check and rely on this alone.
 */

interface Bucket {
  tokens: number
  lastRefillMs: number
}

const buckets = new Map<string, Bucket>()

// Periodically sweep stale buckets so memory doesn't grow unbounded
// across a long-lived warm instance handling many distinct IPs.
const MAX_BUCKETS = 5000
const STALE_AFTER_MS = 10 * 60 * 1000 // 10 minutes

function sweepIfNeeded() {
  if (buckets.size <= MAX_BUCKETS) return
  const now = Date.now()
  for (const [key, bucket] of buckets) {
    if (now - bucket.lastRefillMs > STALE_AFTER_MS) {
      buckets.delete(key)
    }
  }
}

export interface RateLimitResult {
  allowed: boolean
  remaining: number
}

/**
 * Check and consume one token from the caller's bucket.
 *
 * @param key - Identifier for the caller, typically the client IP, optionally
 *              namespaced per-endpoint (e.g. `${ip}:ai`) so one function's
 *              traffic doesn't exhaust another's budget.
 * @param maxTokens - Bucket capacity = max requests per window.
 * @param windowMs - Time window in milliseconds for a full refill (e.g. 60_000 for per-minute).
 */
export function checkRateLimit(
  key: string,
  maxTokens = 10,
  windowMs = 60_000
): RateLimitResult {
  sweepIfNeeded()

  const now = Date.now()
  const refillRatePerMs = maxTokens / windowMs

  let bucket = buckets.get(key)
  if (!bucket) {
    bucket = { tokens: maxTokens, lastRefillMs: now }
    buckets.set(key, bucket)
  }

  // Refill tokens based on elapsed time since last check.
  const elapsedMs = now - bucket.lastRefillMs
  bucket.tokens = Math.min(maxTokens, bucket.tokens + elapsedMs * refillRatePerMs)
  bucket.lastRefillMs = now

  if (bucket.tokens < 1) {
    return { allowed: false, remaining: 0 }
  }

  bucket.tokens -= 1
  return { allowed: true, remaining: Math.floor(bucket.tokens) }
}

/**
 * Extract the best-effort client IP from a Netlify Function request/context.
 * Falls back through common headers, then to a constant so callers from
 * test environments (no real network info) still get a stable bucket key
 * rather than crashing.
 */
export function getClientIp(req: Request, context: { ip?: string }): string {
  return addressGroup(
    context.ip ||
    req.headers.get('x-nf-client-connection-ip') ||
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    'unknown'
  )
}

/**
 * IPv6 callers are grouped by their /64 network (T-0571): one home or server line
 * usually gets a whole /64, so counting full addresses let one caller rotate through
 * endless 'addresses' and skip every per-address limit. IPv4 (also IPv4-mapped IPv6)
 * stays the plain address.
 */
export function addressGroup(ip: string): string {
  const value = ip.trim().toLowerCase()
  if (!value.includes(':')) return value
  const mapped = value.match(/^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/)
  if (mapped) return mapped[1]
  const [head, tail] = value.split('%')[0].split('::')
  const headGroups = head ? head.split(':') : []
  const tailGroups = tail !== undefined && tail !== '' ? tail.split(':') : []
  const missing = 8 - headGroups.length - tailGroups.length
  const groups = tail !== undefined
    ? [...headGroups, ...Array(Math.max(0, missing)).fill('0'), ...tailGroups]
    : headGroups
  const prefix = groups.slice(0, 4).map(group => (group.replace(/^0+(?=.)/, '') || '0'))
  if (prefix.length < 4 || prefix.some(group => !/^[0-9a-f]{1,4}$/.test(group))) return value
  return `${prefix.join(':')}::/64`
}

/**
 * Clears all rate-limit buckets. Test-only helper so each test file/case can
 * start from a clean state instead of inheriting exhausted buckets from
 * earlier tests that share the same mock IP.
 */
export function resetRateLimitsForTests(): void {
  buckets.clear()
}
