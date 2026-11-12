import { createRemoteJWKSet, jwtVerify, type JWTPayload } from 'jose'

/**
 * Authentication helper for Netlify Functions.
 *
 * Who is calling is decided ONLY by a Neon Auth JWT in the Authorization header
 * (T-0555, Nov 2026). The browser mints it at /neon-auth/token (src/lib/authToken.ts)
 * and we verify it against Neon Auth's public JWKS. Before T-0555 the functions
 * believed a bare `x-user-id` header, so anyone who knew a user's id could act as
 * that user (read trips and chats, open their billing page).
 *
 * The x-user-id header is still sent by the app but ignored, unless
 * ALLOW_UNVERIFIED_USER_ID=true (set only by the unit tests; never on Netlify).
 */

interface AuthResult {
  authenticated: boolean
  userId: string | null
  email?: string
  error?: string
}

interface NeonAuthPayload extends JWTPayload {
  sub: string
  email?: string
}

// HappyRoam's Neon Auth: the same host the /neon-auth/* proxy in netlify.toml points
// at. Its JWKS and issuer are public, so they live in code (no env var needed);
// NEON_AUTH_JWKS_URL / NEON_AUTH_ISSUER override them if the auth project ever moves.
// Neon Auth sets both the issuer and the audience of its tokens to this origin.
const NEON_AUTH_ORIGIN = 'https://ep-royal-art-abpqmm55.neonauth.eu-west-2.aws.neon.tech'
const DEFAULT_JWKS_URL = `${NEON_AUTH_ORIGIN}/neondb/auth/.well-known/jwks.json`

let jwks: ReturnType<typeof createRemoteJWKSet> | null = null

function getJwks() {
  if (!jwks) {
    const jwksUrl = Netlify.env.get('NEON_AUTH_JWKS_URL') || DEFAULT_JWKS_URL
    jwks = createRemoteJWKSet(new URL(jwksUrl))
  }
  return jwks
}

function expectedIssuer(): string {
  return Netlify.env.get('NEON_AUTH_ISSUER') || NEON_AUTH_ORIGIN
}

/** Test-only escape hatch: accept the unverified x-user-id header. */
function allowUnverifiedUserId(): boolean {
  return Netlify.env.get('ALLOW_UNVERIFIED_USER_ID') === 'true'
}

/**
 * Validates the Authorization header and extracts user information.
 *
 * - `Authorization: Bearer <Neon Auth JWT>` that verifies (signature, expiry, issuer)
 *   -> authenticated as the token's `sub` (the Neon Auth user id).
 * - A token that doesn't verify -> not authenticated (never falls back).
 * - No token -> not authenticated (anonymous), except in unit tests.
 *
 * @param req - The incoming request
 * @returns AuthResult with authentication status and user info
 */
export async function validateAuth(req: Request): Promise<AuthResult> {
  const authHeader = req.headers.get('authorization') || ''
  const token = authHeader.match(/^Bearer\s+(\S+)$/i)?.[1]

  if (token) {
    try {
      const { payload } = await jwtVerify(token, getJwks(), {
        issuer: expectedIssuer(),
        audience: expectedIssuer(),
      })
      const neonPayload = payload as NeonAuthPayload
      if (!neonPayload.sub) {
        return { authenticated: false, userId: null, error: 'Invalid or expired token' }
      }
      return {
        authenticated: true,
        userId: neonPayload.sub,
        email: neonPayload.email,
      }
    } catch (error) {
      console.error('JWT validation failed:', error instanceof Error ? error.message : error)
      return {
        authenticated: false,
        userId: null,
        error: 'Invalid or expired token',
      }
    }
  }

  // Unit tests only: trust x-user-id (see allowUnverifiedUserId).
  const userId = req.headers.get('x-user-id')
  if (userId && allowUnverifiedUserId()) {
    return { authenticated: true, userId }
  }

  return {
    authenticated: false,
    userId: null,
    error: 'No authentication provided',
  }
}

/**
 * Helper to extract user ID from request.
 * Throws 401 response if not authenticated.
 *
 * @param req - The incoming request
 * @returns User ID if authenticated
 * @throws Response with 401 status if not authenticated
 */
export async function requireAuth(req: Request): Promise<string> {
  const auth = await validateAuth(req)
  if (!auth.authenticated || !auth.userId) {
    throw new Response(
      JSON.stringify({ error: auth.error || 'Unauthorized' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    )
  }
  return auth.userId
}

/**
 * Optional auth - returns userId if authenticated, null otherwise.
 * Use for endpoints that work for both authenticated and anonymous users.
 */
export async function optionalAuth(req: Request): Promise<string | null> {
  const auth = await validateAuth(req)
  return auth.authenticated ? auth.userId : null
}

/**
 * Helper to create 401 Unauthorized response
 */
export function unauthorized(message = 'Unauthorized'): Response {
  return new Response(
    JSON.stringify({ error: message }),
    { status: 401, headers: { 'Content-Type': 'application/json' } }
  )
}
