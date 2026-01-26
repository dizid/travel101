import { createRemoteJWKSet, jwtVerify, type JWTPayload } from 'jose'

/**
 * Authentication helper for Netlify Functions.
 *
 * SECURITY NOTE: The x-user-id header is currently client-controlled and NOT verified.
 * This helper provides infrastructure for proper JWT validation.
 *
 * TODO: Configure Neon Auth JWKS endpoint and enable JWT validation in production.
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

// Neon Auth JWKS endpoint - set via environment variable
// Example: https://your-project.auth.neon.tech/.well-known/jwks.json
let jwks: ReturnType<typeof createRemoteJWKSet> | null = null

function getJwks() {
  if (!jwks) {
    const neonAuthUrl = Netlify.env.get('NEON_AUTH_JWKS_URL')
    if (neonAuthUrl) {
      jwks = createRemoteJWKSet(new URL(neonAuthUrl))
    }
  }
  return jwks
}

/**
 * Validates the Authorization header and extracts user information.
 *
 * If NEON_AUTH_JWKS_URL is configured, it will verify JWT tokens.
 * Otherwise, falls back to trusting the x-user-id header (NOT RECOMMENDED FOR PRODUCTION).
 *
 * @param req - The incoming request
 * @returns AuthResult with authentication status and user info
 */
export async function validateAuth(req: Request): Promise<AuthResult> {
  // Try JWT validation first if JWKS is configured
  const authHeader = req.headers.get('authorization')
  const jwksUrl = getJwks()

  if (authHeader && jwksUrl) {
    const token = authHeader.replace(/^Bearer\s+/i, '')
    if (token) {
      try {
        const { payload } = await jwtVerify(token, jwksUrl, {
          // Add issuer validation when known
          // issuer: 'https://your-project.auth.neon.tech',
        })
        const neonPayload = payload as NeonAuthPayload
        return {
          authenticated: true,
          userId: neonPayload.sub,
          email: neonPayload.email,
        }
      } catch (error) {
        console.error('JWT validation failed:', error)
        return {
          authenticated: false,
          userId: null,
          error: 'Invalid or expired token',
        }
      }
    }
  }

  // Fallback: Trust x-user-id header (INSECURE - for development only)
  // WARNING: This allows any client to impersonate any user!
  const userId = req.headers.get('x-user-id')
  if (userId) {
    console.warn(
      'SECURITY WARNING: Using unverified x-user-id header. ' +
      'Configure NEON_AUTH_JWKS_URL for production.'
    )
    return {
      authenticated: true,
      userId,
    }
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
 * Helper to create 401 Unauthorized response
 */
export function unauthorized(message = 'Unauthorized'): Response {
  return new Response(
    JSON.stringify({ error: message }),
    { status: 401, headers: { 'Content-Type': 'application/json' } }
  )
}
