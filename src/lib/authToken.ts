/**
 * Short-lived Neon Auth JWT for our own API (T-0555, Nov 2026).
 *
 * The functions only trust `Authorization: Bearer <JWT>` (netlify/functions/lib/auth.mts);
 * they verify it against Neon Auth's public keys. The token comes from Neon Auth's
 * /token endpoint, reached through our own domain (/neon-auth/*, the netlify.toml
 * proxy) so the first-party session cookie goes along. Tokens live 15 minutes; we
 * reuse one until a minute before it expires, then mint a new one.
 */

interface CachedToken {
  token: string
  /** Expiry in Unix seconds (the JWT's `exp`). */
  exp: number
}

// Renew this many seconds before the token expires (clock skew, slow requests).
const RENEW_MARGIN_S = 60
// If a token has no readable `exp`, reuse it for at most this long.
const FALLBACK_TTL_S = 300

let cached: CachedToken | null = null
let inflight: Promise<string | null> | null = null

function nowSeconds(): number {
  return Math.floor(Date.now() / 1000)
}

/** Reads the `exp` claim (no verification: the server verifies). */
export function readTokenExpiry(token: string): number {
  try {
    const payloadPart = token.split('.')[1]
    if (!payloadPart) return nowSeconds() + FALLBACK_TTL_S
    const base64 = payloadPart.replace(/-/g, '+').replace(/_/g, '/')
    const payload = JSON.parse(atob(base64)) as { exp?: unknown }
    return typeof payload.exp === 'number' ? payload.exp : nowSeconds() + FALLBACK_TTL_S
  } catch {
    return nowSeconds() + FALLBACK_TTL_S
  }
}

async function mintToken(): Promise<string | null> {
  try {
    const response = await fetch(`${window.location.origin}/neon-auth/token`, {
      credentials: 'include',
    })
    if (!response.ok) {
      cached = null
      return null
    }
    const data = (await response.json()) as { token?: unknown }
    if (typeof data.token !== 'string' || !data.token) {
      cached = null
      return null
    }
    cached = { token: data.token, exp: readTokenExpiry(data.token) }
    return data.token
  } catch {
    // Network blip or Neon Auth unreachable: the call goes out without a token
    // and the server treats it as signed out (401 on member-only endpoints).
    return null
  }
}

/**
 * Returns a valid token for the signed-in user, or null (signed out, or minting failed).
 * Concurrent callers share one /token request.
 */
export async function getAuthToken(): Promise<string | null> {
  if (typeof window === 'undefined') return null
  if (cached && cached.exp - RENEW_MARGIN_S > nowSeconds()) return cached.token
  if (!inflight) {
    inflight = mintToken().finally(() => {
      inflight = null
    })
  }
  return inflight
}

/** Forget the cached token (after a 401, or on sign-out). */
export function clearAuthToken(): void {
  cached = null
}
