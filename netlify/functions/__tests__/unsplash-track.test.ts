import { describe, it, expect, beforeEach, vi } from 'vitest'
import handler from '../unsplash-track.mts'
import { createMockRequest, createMockContext, parseResponse } from './helpers'

describe('unsplash-track', () => {
  const mockContext = createMockContext()

  beforeEach(() => {
    vi.clearAllMocks()
    // Set default env
    process.env.UNSPLASH_ACCESS_KEY = 'test-unsplash-key'
  })

  it('returns 400 when photo id is missing', async () => {
    const req = createMockRequest('GET', '/api/unsplash-track')
    const res = await handler(req, mockContext)
    expect(res.status).toBe(400)
    const data = await parseResponse(res)
    expect(data).toEqual({ error: 'Missing photo id' })
  })

  it('returns 500 when UNSPLASH_ACCESS_KEY is not configured', async () => {
    delete process.env.UNSPLASH_ACCESS_KEY
    const req = createMockRequest('GET', '/api/unsplash-track?id=photo123')
    const res = await handler(req, mockContext)
    expect(res.status).toBe(500)
    const data = await parseResponse(res)
    expect(data).toEqual({ error: 'Unsplash not configured' })
  })

  it('calls Unsplash API with correct authorization and returns success', async () => {
    const mockFetch = vi.fn().mockResolvedValue({ ok: true })
    global.fetch = mockFetch

    const req = createMockRequest('GET', '/api/unsplash-track?id=photo123')
    const res = await handler(req, mockContext)

    expect(res.status).toBe(200)
    const data = await parseResponse(res)
    expect(data).toEqual({ success: true })

    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.unsplash.com/photos/photo123/download',
      { headers: { Authorization: 'Client-ID test-unsplash-key' } }
    )
  })

  it('returns error status when Unsplash API responds with non-ok', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      text: () => Promise.resolve('Not Found'),
    })
    global.fetch = mockFetch

    const req = createMockRequest('GET', '/api/unsplash-track?id=nonexistent')
    const res = await handler(req, mockContext)

    expect(res.status).toBe(404)
    const data = await parseResponse(res)
    expect(data).toEqual({ error: 'Tracking failed' })
  })

  it('returns 500 when fetch throws an error', async () => {
    const mockFetch = vi.fn().mockRejectedValue(new Error('Network error'))
    global.fetch = mockFetch

    const req = createMockRequest('GET', '/api/unsplash-track?id=photo123')
    const res = await handler(req, mockContext)

    expect(res.status).toBe(500)
    const data = await parseResponse(res)
    expect(data).toEqual({ error: 'Internal error' })
  })

  it('passes different photo IDs correctly', async () => {
    const mockFetch = vi.fn().mockResolvedValue({ ok: true })
    global.fetch = mockFetch

    const req = createMockRequest('GET', '/api/unsplash-track?id=abc-xyz-789')
    await handler(req, mockContext)

    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.unsplash.com/photos/abc-xyz-789/download',
      expect.any(Object)
    )
  })
})
