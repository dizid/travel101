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

    it('should fall back to x-user-id header when no JWKS configured', async () => {
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

    it('should fall back to x-user-id when no Authorization header present and JWKS configured', async () => {
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
