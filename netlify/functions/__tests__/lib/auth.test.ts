import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setMockEnv, clearMockEnv } from '../setup.js'

// Mock jose for JWT verification
const mockJwtVerify = vi.fn()
const mockCreateRemoteJWKSet = vi.fn()

vi.mock('jose', () => ({
  jwtVerify: (...args: unknown[]) => mockJwtVerify(...args),
  createRemoteJWKSet: (...args: unknown[]) => mockCreateRemoteJWKSet(...args),
}))

// Must import after mocking
import { validateAuth, requireAuth, optionalAuth, unauthorized } from '../../lib/auth.mts'

describe('auth lib', () => {
  beforeEach(() => {
    clearMockEnv()
    vi.clearAllMocks()
    mockJwtVerify.mockReset()
    mockCreateRemoteJWKSet.mockReset()
  })

  describe('validateAuth', () => {
    it('should return authenticated with user ID from JWT when JWKS is configured', async () => {
      setMockEnv('NEON_AUTH_JWKS_URL', 'https://auth.neon.tech/.well-known/jwks.json')
      const mockJwksSet = vi.fn()
      mockCreateRemoteJWKSet.mockReturnValue(mockJwksSet)
      mockJwtVerify.mockResolvedValue({
        payload: { sub: 'user-jwt-123', email: 'test@example.com' },
      })

      const req = new Request('http://localhost/api/test', {
        headers: { authorization: 'Bearer valid-token' },
      })

      const result = await validateAuth(req)

      expect(result.authenticated).toBe(true)
      expect(result.userId).toBe('user-jwt-123')
      expect(result.email).toBe('test@example.com')
    })

    it('should return unauthenticated when JWT verification fails', async () => {
      setMockEnv('NEON_AUTH_JWKS_URL', 'https://auth.neon.tech/.well-known/jwks.json')
      const mockJwksSet = vi.fn()
      mockCreateRemoteJWKSet.mockReturnValue(mockJwksSet)
      mockJwtVerify.mockRejectedValue(new Error('Token expired'))

      const req = new Request('http://localhost/api/test', {
        headers: { authorization: 'Bearer expired-token' },
      })

      const result = await validateAuth(req)

      expect(result.authenticated).toBe(false)
      expect(result.userId).toBeNull()
      expect(result.error).toBe('Invalid or expired token')
    })

    it('accepts x-user-id only through the test-only ALLOW_UNVERIFIED_USER_ID switch', async () => {
      const req = new Request('http://localhost/api/test', {
        headers: { 'x-user-id': 'user-header-456' },
      })

      const result = await validateAuth(req)

      expect(result.authenticated).toBe(true)
      expect(result.userId).toBe('user-header-456')
    })

    it('should return unauthenticated when no auth is provided', async () => {
      const req = new Request('http://localhost/api/test')

      const result = await validateAuth(req)

      expect(result.authenticated).toBe(false)
      expect(result.userId).toBeNull()
      expect(result.error).toBe('No authentication provided')
    })

    it('accepts x-user-id without a token while the test switch is on', async () => {
      setMockEnv('NEON_AUTH_JWKS_URL', 'https://auth.neon.tech/.well-known/jwks.json')
      mockCreateRemoteJWKSet.mockReturnValue(vi.fn())

      const req = new Request('http://localhost/api/test', {
        headers: { 'x-user-id': 'fallback-user' },
      })

      const result = await validateAuth(req)

      expect(result.authenticated).toBe(true)
      expect(result.userId).toBe('fallback-user')
    })
  })

  describe('validateAuth in production mode (T-0555: no x-user-id trust)', () => {
    beforeEach(() => {
      // Production: the test-only switch is off.
      setMockEnv('ALLOW_UNVERIFIED_USER_ID', 'false')
    })

    it('rejects a bare x-user-id header (anyone could send any id)', async () => {
      const req = new Request('http://localhost/api/test', {
        headers: { 'x-user-id': 'someone-elses-id' },
      })

      const result = await validateAuth(req)

      expect(result.authenticated).toBe(false)
      expect(result.userId).toBeNull()
      expect(mockJwtVerify).not.toHaveBeenCalled()
    })

    it('uses the verified token subject, never the x-user-id header', async () => {
      mockCreateRemoteJWKSet.mockReturnValue(vi.fn())
      mockJwtVerify.mockResolvedValue({ payload: { sub: 'real-user', email: 'r@example.com' } })

      const req = new Request('http://localhost/api/test', {
        headers: { authorization: 'Bearer good-token', 'x-user-id': 'forged-user' },
      })

      const result = await validateAuth(req)

      expect(result.authenticated).toBe(true)
      expect(result.userId).toBe('real-user')
    })

    it('does not fall back to x-user-id when the token fails, even with the test switch on', async () => {
      setMockEnv('ALLOW_UNVERIFIED_USER_ID', 'true')
      mockCreateRemoteJWKSet.mockReturnValue(vi.fn())
      mockJwtVerify.mockRejectedValue(new Error('signature verification failed'))

      const req = new Request('http://localhost/api/test', {
        headers: { authorization: 'Bearer forged-token', 'x-user-id': 'forged-user' },
      })

      const result = await validateAuth(req)

      expect(result.authenticated).toBe(false)
      expect(result.userId).toBeNull()
    })

    it('rejects a verified token without a subject', async () => {
      mockCreateRemoteJWKSet.mockReturnValue(vi.fn())
      mockJwtVerify.mockResolvedValue({ payload: { email: 'no-sub@example.com' } })

      const req = new Request('http://localhost/api/test', {
        headers: { authorization: 'Bearer token-without-sub' },
      })

      const result = await validateAuth(req)

      expect(result.authenticated).toBe(false)
    })

    it("checks the token's issuer (HappyRoam's Neon Auth)", async () => {
      mockCreateRemoteJWKSet.mockReturnValue(vi.fn())
      mockJwtVerify.mockResolvedValue({ payload: { sub: 'u1' } })

      await validateAuth(new Request('http://localhost/api/test', {
        headers: { authorization: 'Bearer t' },
      }))

      expect(mockJwtVerify).toHaveBeenCalledWith('t', expect.anything(), {
        issuer: 'https://ep-royal-art-abpqmm55.neonauth.eu-west-2.aws.neon.tech',
      })
    })

    it("uses Neon Auth's public JWKS when NEON_AUTH_JWKS_URL is not set", async () => {
      vi.resetModules()
      mockCreateRemoteJWKSet.mockReturnValue(vi.fn())
      mockJwtVerify.mockResolvedValue({ payload: { sub: 'u1' } })
      const fresh = await import('../../lib/auth.mts')

      const result = await fresh.validateAuth(new Request('http://localhost/api/test', {
        headers: { authorization: 'Bearer t' },
      }))

      expect(result.userId).toBe('u1')
      const url = mockCreateRemoteJWKSet.mock.calls[0][0] as URL
      expect(url.href).toBe(
        'https://ep-royal-art-abpqmm55.neonauth.eu-west-2.aws.neon.tech/neondb/auth/.well-known/jwks.json'
      )
    })
  })

  describe('requireAuth', () => {
    it('should return user ID when authenticated', async () => {
      const req = new Request('http://localhost/api/test', {
        headers: { 'x-user-id': 'user-123' },
      })

      const userId = await requireAuth(req)

      expect(userId).toBe('user-123')
    })

    it('should throw 401 Response when not authenticated', async () => {
      const req = new Request('http://localhost/api/test')

      try {
        await requireAuth(req)
        expect.fail('Should have thrown')
      } catch (error) {
        expect(error).toBeInstanceOf(Response)
        const response = error as Response
        expect(response.status).toBe(401)
        const body = await response.json()
        expect(body.error).toBe('No authentication provided')
      }
    })
  })

  describe('optionalAuth', () => {
    it('should return userId when authenticated', async () => {
      const req = new Request('http://localhost/api/test', {
        headers: { 'x-user-id': 'user-opt-123' },
      })

      const userId = await optionalAuth(req)

      expect(userId).toBe('user-opt-123')
    })

    it('should return null when not authenticated', async () => {
      const req = new Request('http://localhost/api/test')

      const userId = await optionalAuth(req)

      expect(userId).toBeNull()
    })
  })

  describe('unauthorized', () => {
    it('should create 401 response with default message', () => {
      const response = unauthorized()

      expect(response.status).toBe(401)
    })

    it('should create 401 response with custom message', async () => {
      const response = unauthorized('Token expired')

      expect(response.status).toBe(401)
      const body = await response.json()
      expect(body.error).toBe('Token expired')
    })
  })
})
