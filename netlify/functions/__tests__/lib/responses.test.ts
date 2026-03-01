import { describe, it, expect } from 'vitest'

import {
  jsonResponse,
  errorResponse,
  listResponse,
  rawJsonResponse,
  methodNotAllowed,
  unauthorized,
  forbidden,
  notFound,
  badRequest,
  serverError,
  rateLimited,
} from '../../lib/responses.mts'

// Helper to parse response body
async function parseBody<T>(response: Response): Promise<T> {
  return response.json() as Promise<T>
}

describe('responses lib', () => {
  describe('jsonResponse', () => {
    it('should wrap data with success flag', async () => {
      const response = jsonResponse({ name: 'test' })
      const body = await parseBody<{ data: { name: string }; success: boolean }>(response)

      expect(response.status).toBe(200)
      expect(body.success).toBe(true)
      expect(body.data).toEqual({ name: 'test' })
    })

    it('should use custom status code', async () => {
      const response = jsonResponse({ id: 1 }, 201)

      expect(response.status).toBe(201)
    })

    it('should set JSON content type', () => {
      const response = jsonResponse({})

      expect(response.headers.get('Content-Type')).toBe('application/json')
    })

    it('should handle null data', async () => {
      const response = jsonResponse(null)
      const body = await parseBody<{ data: null; success: boolean }>(response)

      expect(body.data).toBeNull()
      expect(body.success).toBe(true)
    })

    it('should handle array data', async () => {
      const response = jsonResponse([1, 2, 3])
      const body = await parseBody<{ data: number[]; success: boolean }>(response)

      expect(body.data).toEqual([1, 2, 3])
    })
  })

  describe('errorResponse', () => {
    it('should return error message with status', async () => {
      const response = errorResponse('Something went wrong', 400)
      const body = await parseBody<{ error: string }>(response)

      expect(response.status).toBe(400)
      expect(body.error).toBe('Something went wrong')
    })

    it('should include error code when provided', async () => {
      const response = errorResponse('Bad input', 400, 'VALIDATION_ERROR')
      const body = await parseBody<{ error: string; code: string }>(response)

      expect(body.code).toBe('VALIDATION_ERROR')
    })

    it('should omit code when not provided', async () => {
      const response = errorResponse('Oops')
      const body = await parseBody<{ error: string; code?: string }>(response)

      expect(body.code).toBeUndefined()
    })

    it('should default to 400 status', () => {
      const response = errorResponse('Bad')

      expect(response.status).toBe(400)
    })
  })

  describe('listResponse', () => {
    it('should wrap items with pagination metadata', async () => {
      const items = [{ id: 1 }, { id: 2 }]
      const response = listResponse(items, 10, true)
      const body = await parseBody<{
        data: { items: { id: number }[]; total: number; hasMore: boolean }
        success: boolean
      }>(response)

      expect(body.success).toBe(true)
      expect(body.data.items).toEqual(items)
      expect(body.data.total).toBe(10)
      expect(body.data.hasMore).toBe(true)
    })

    it('should handle empty items', async () => {
      const response = listResponse([], 0, false)
      const body = await parseBody<{
        data: { items: unknown[]; total: number; hasMore: boolean }
      }>(response)

      expect(body.data.items).toEqual([])
      expect(body.data.total).toBe(0)
      expect(body.data.hasMore).toBe(false)
    })
  })

  describe('rawJsonResponse', () => {
    it('should return data without wrapper', async () => {
      const response = rawJsonResponse({ key: 'value' })
      const body = await parseBody<{ key: string }>(response)

      expect(body).toEqual({ key: 'value' })
      expect(response.status).toBe(200)
    })

    it('should support custom status', () => {
      const response = rawJsonResponse({ created: true }, 201)

      expect(response.status).toBe(201)
    })
  })

  describe('common error responses', () => {
    it('methodNotAllowed returns 405', async () => {
      const response = methodNotAllowed()
      const body = await parseBody<{ error: string; code: string }>(response)

      expect(response.status).toBe(405)
      expect(body.code).toBe('METHOD_NOT_ALLOWED')
    })

    it('unauthorized returns 401', async () => {
      const response = unauthorized()
      const body = await parseBody<{ error: string; code: string }>(response)

      expect(response.status).toBe(401)
      expect(body.code).toBe('UNAUTHORIZED')
    })

    it('forbidden returns 403', async () => {
      const response = forbidden()
      const body = await parseBody<{ error: string; code: string }>(response)

      expect(response.status).toBe(403)
      expect(body.code).toBe('FORBIDDEN')
    })

    it('notFound returns 404 with default message', async () => {
      const response = notFound()
      const body = await parseBody<{ error: string; code: string }>(response)

      expect(response.status).toBe(404)
      expect(body.error).toBe('Resource not found')
      expect(body.code).toBe('NOT_FOUND')
    })

    it('notFound returns 404 with custom resource name', async () => {
      const response = notFound('Attraction')
      const body = await parseBody<{ error: string }>(response)

      expect(body.error).toBe('Attraction not found')
    })

    it('badRequest returns 400', async () => {
      const response = badRequest('Missing field: name')
      const body = await parseBody<{ error: string; code: string }>(response)

      expect(response.status).toBe(400)
      expect(body.error).toBe('Missing field: name')
      expect(body.code).toBe('BAD_REQUEST')
    })

    it('serverError returns 500 with default message', async () => {
      const response = serverError()
      const body = await parseBody<{ error: string; code: string }>(response)

      expect(response.status).toBe(500)
      expect(body.error).toBe('Internal server error')
      expect(body.code).toBe('SERVER_ERROR')
    })

    it('serverError returns 500 with custom message', async () => {
      const response = serverError('Database connection failed')
      const body = await parseBody<{ error: string }>(response)

      expect(body.error).toBe('Database connection failed')
    })

    it('rateLimited returns 429', async () => {
      const response = rateLimited()
      const body = await parseBody<{ error: string; code: string }>(response)

      expect(response.status).toBe(429)
      expect(body.code).toBe('RATE_LIMITED')
    })
  })
})
