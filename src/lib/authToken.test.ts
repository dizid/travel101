import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mockFetch, createMockResponse } from '@/test/setup'

// The global test setup stubs this module; here we test the real one.
type AuthTokenModule = typeof import('./authToken')

function makeJwt(payload: Record<string, unknown>): string {
  const encode = (value: object) =>
    btoa(JSON.stringify(value)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
  return `${encode({ alg: 'EdDSA' })}.${encode(payload)}.signature`
}

describe('authToken (real module)', () => {
  let mod: AuthTokenModule

  beforeEach(async () => {
    vi.resetModules()
    mod = await vi.importActual<AuthTokenModule>('./authToken')
  })

  it('mints a token at /neon-auth/token on our own domain with the session cookie', async () => {
    const token = makeJwt({ sub: 'u1', exp: Math.floor(Date.now() / 1000) + 900 })
    mockFetch.mockResolvedValueOnce(createMockResponse({ token }))

    expect(await mod.getAuthToken()).toBe(token)
    expect(mockFetch).toHaveBeenCalledWith(`${window.location.origin}/neon-auth/token`, {
      credentials: 'include',
    })
  })

  it('reuses a token until a minute before it expires', async () => {
    const token = makeJwt({ sub: 'u1', exp: Math.floor(Date.now() / 1000) + 900 })
    mockFetch.mockResolvedValueOnce(createMockResponse({ token }))

    await mod.getAuthToken()
    await mod.getAuthToken()

    expect(mockFetch).toHaveBeenCalledTimes(1)
  })

  it('mints a new token when the cached one is about to expire', async () => {
    const soon = makeJwt({ sub: 'u1', exp: Math.floor(Date.now() / 1000) + 30 })
    const fresh = makeJwt({ sub: 'u1', exp: Math.floor(Date.now() / 1000) + 900 })
    mockFetch
      .mockResolvedValueOnce(createMockResponse({ token: soon }))
      .mockResolvedValueOnce(createMockResponse({ token: fresh }))

    await mod.getAuthToken()
    expect(await mod.getAuthToken()).toBe(fresh)
    expect(mockFetch).toHaveBeenCalledTimes(2)
  })

  it('shares one /token request between concurrent callers', async () => {
    const token = makeJwt({ sub: 'u1', exp: Math.floor(Date.now() / 1000) + 900 })
    mockFetch.mockResolvedValueOnce(createMockResponse({ token }))

    const [a, b] = await Promise.all([mod.getAuthToken(), mod.getAuthToken()])

    expect(a).toBe(token)
    expect(b).toBe(token)
    expect(mockFetch).toHaveBeenCalledTimes(1)
  })

  it('returns null when signed out (401) or the request fails', async () => {
    mockFetch.mockResolvedValueOnce(createMockResponse({ message: 'Unauthorized' }, 401))
    expect(await mod.getAuthToken()).toBeNull()

    mockFetch.mockRejectedValueOnce(new Error('offline'))
    expect(await mod.getAuthToken()).toBeNull()
  })

  it('mints again after clearAuthToken', async () => {
    const first = makeJwt({ sub: 'u1', exp: Math.floor(Date.now() / 1000) + 900 })
    const second = makeJwt({ sub: 'u1', exp: Math.floor(Date.now() / 1000) + 900, n: 2 })
    mockFetch
      .mockResolvedValueOnce(createMockResponse({ token: first }))
      .mockResolvedValueOnce(createMockResponse({ token: second }))

    await mod.getAuthToken()
    mod.clearAuthToken()

    expect(await mod.getAuthToken()).toBe(second)
  })

  it('reads exp from a base64url payload', () => {
    expect(mod.readTokenExpiry(makeJwt({ exp: 1893456000 }))).toBe(1893456000)
  })
})
