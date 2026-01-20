import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useApi } from './useApi'
import { useUserStore } from '@/stores/userStore'
import {
  mockFetch,
  createMockResponse,
  createErrorResponse,
  createNoContentResponse,
  createNetworkError,
  flushPromises,
} from '@/test/setup'

describe('useApi', () => {
  let userStore: ReturnType<typeof useUserStore>

  beforeEach(() => {
    userStore = useUserStore()
  })

  describe('request', () => {
    it('should make a GET request to the correct URL', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ data: 'test' }))
      const { get } = useApi()

      await get('/test')

      expect(mockFetch).toHaveBeenCalledWith('/api/test', expect.objectContaining({
        method: 'GET',
      }))
    })

    it('should add auth header when user is authenticated', async () => {
      userStore.setAuthUser('user-123', 'test@example.com')
      mockFetch.mockResolvedValueOnce(createMockResponse({ data: 'test' }))
      const { get } = useApi()

      await get('/test')

      expect(mockFetch).toHaveBeenCalledWith('/api/test', expect.objectContaining({
        headers: expect.objectContaining({
          'x-user-id': 'user-123',
        }),
      }))
    })

    it('should not add auth header when user is not authenticated', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ data: 'test' }))
      const { get } = useApi()

      await get('/test')

      const callArgs = mockFetch.mock.calls[0][1] as RequestInit
      expect(callArgs.headers).not.toHaveProperty('x-user-id')
    })

    it('should not add auth header when requiresAuth is false', async () => {
      userStore.setAuthUser('user-123')
      mockFetch.mockResolvedValueOnce(createMockResponse({ data: 'test' }))
      const { get } = useApi()

      await get('/test', { requiresAuth: false })

      const callArgs = mockFetch.mock.calls[0][1] as RequestInit
      expect(callArgs.headers).not.toHaveProperty('x-user-id')
    })

    it('should always include Content-Type header', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ data: 'test' }))
      const { get } = useApi()

      await get('/test')

      expect(mockFetch).toHaveBeenCalledWith('/api/test', expect.objectContaining({
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
        }),
      }))
    })

    it('should merge custom headers', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ data: 'test' }))
      const { get } = useApi()

      await get('/test', { headers: { 'X-Custom': 'value' } })

      expect(mockFetch).toHaveBeenCalledWith('/api/test', expect.objectContaining({
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          'X-Custom': 'value',
        }),
      }))
    })
  })

  describe('loading state', () => {
    it('should set loading to true during request', async () => {
      let resolveRequest: (value: Response) => void
      const pendingResponse = new Promise<Response>((resolve) => {
        resolveRequest = resolve
      })
      mockFetch.mockReturnValueOnce(pendingResponse)

      const { loading, get } = useApi()

      expect(loading.value).toBe(false)

      const promise = get('/test')
      await flushPromises()

      expect(loading.value).toBe(true)

      resolveRequest!(await createMockResponse({ data: 'test' }))
      await promise

      expect(loading.value).toBe(false)
    })

    it('should set loading to false after error', async () => {
      mockFetch.mockResolvedValueOnce(createErrorResponse('Server error', 500))
      const { loading, get } = useApi()

      await get('/test')

      expect(loading.value).toBe(false)
    })

    it('should set loading to false after network error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'))
      const { loading, get } = useApi()

      await get('/test')

      expect(loading.value).toBe(false)
    })
  })

  describe('error handling', () => {
    it('should set error state on HTTP error', async () => {
      mockFetch.mockResolvedValueOnce(createErrorResponse('Not found', 404))
      const { error, get } = useApi()

      await get('/test')

      expect(error.value).toBe('Not found')
    })

    it('should set error state on network error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network failure'))
      const { error, get } = useApi()

      await get('/test')

      expect(error.value).toBe('Network failure')
    })

    it('should set default error message for HTTP errors without body', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: () => Promise.reject(new Error('Invalid JSON')),
      } as Response)
      const { error, get } = useApi()

      await get('/test')

      expect(error.value).toBe('HTTP 500')
    })

    it('should return null on error', async () => {
      mockFetch.mockResolvedValueOnce(createErrorResponse('Error', 500))
      const { get } = useApi()

      const result = await get('/test')

      expect(result).toBeNull()
    })

    it('should clear previous error on new request', async () => {
      mockFetch
        .mockResolvedValueOnce(createErrorResponse('First error', 500))
        .mockResolvedValueOnce(createMockResponse({ data: 'success' }))

      const { error, get } = useApi()

      await get('/test')
      expect(error.value).toBe('First error')

      await get('/test')
      expect(error.value).toBeNull()
    })
  })

  describe('response handling', () => {
    it('should return parsed JSON response', async () => {
      const testData = { id: 1, name: 'Test' }
      mockFetch.mockResolvedValueOnce(createMockResponse(testData))
      const { get } = useApi()

      const result = await get<typeof testData>('/test')

      expect(result).toEqual(testData)
    })

    it('should return null for 204 No Content', async () => {
      mockFetch.mockResolvedValueOnce(createNoContentResponse())
      const { get } = useApi()

      const result = await get('/test')

      expect(result).toBeNull()
    })
  })

  describe('HTTP methods', () => {
    it('should make POST request with body', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ success: true }))
      const { post } = useApi()
      const body = { name: 'Test', value: 123 }

      await post('/test', body)

      expect(mockFetch).toHaveBeenCalledWith('/api/test', expect.objectContaining({
        method: 'POST',
        body: JSON.stringify(body),
      }))
    })

    it('should make PUT request with body', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ success: true }))
      const { put } = useApi()
      const body = { name: 'Updated' }

      await put('/test', body)

      expect(mockFetch).toHaveBeenCalledWith('/api/test', expect.objectContaining({
        method: 'PUT',
        body: JSON.stringify(body),
      }))
    })

    it('should make DELETE request', async () => {
      mockFetch.mockResolvedValueOnce(createNoContentResponse())
      const { del } = useApi()

      await del('/test/123')

      expect(mockFetch).toHaveBeenCalledWith('/api/test/123', expect.objectContaining({
        method: 'DELETE',
      }))
    })

    it('should make DELETE request with body', async () => {
      mockFetch.mockResolvedValueOnce(createNoContentResponse())
      const { del } = useApi()
      const body = { reason: 'test' }

      await del('/test/123', body)

      expect(mockFetch).toHaveBeenCalledWith('/api/test/123', expect.objectContaining({
        method: 'DELETE',
        body: JSON.stringify(body),
      }))
    })

    it('should make GET request without body', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ data: 'test' }))
      const { get } = useApi()

      await get('/test')

      expect(mockFetch).toHaveBeenCalledWith('/api/test', expect.objectContaining({
        method: 'GET',
        body: undefined,
      }))
    })
  })

  describe('endpoint URL construction', () => {
    it('should prepend /api to endpoint', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({}))
      const { get } = useApi()

      await get('/users')

      expect(mockFetch).toHaveBeenCalledWith('/api/users', expect.any(Object))
    })

    it('should handle endpoint with query params', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({}))
      const { get } = useApi()

      await get('/users?page=1&limit=10')

      expect(mockFetch).toHaveBeenCalledWith('/api/users?page=1&limit=10', expect.any(Object))
    })
  })
})
