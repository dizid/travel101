import { describe, it, expect, beforeEach, vi } from 'vitest'
import '../__mocks__/db'
import { setMockQueryResult, clearMockResults, getMockQueryLog, mockSql } from '../__mocks__/db'
import { createMockRequest, parseResponse } from './helpers.js'
import userHandler from '../user.mts'

// Mock context
const mockContext = {
  geo: { city: 'Bangkok' },
  ip: '127.0.0.1',
}

describe('user function', () => {
  beforeEach(() => {
    clearMockResults()
    vi.clearAllMocks()
  })

  describe('authentication', () => {
    it('should return 401 when x-user-id header is missing', async () => {
      const req = createMockRequest('GET', '/api/user', {
        headers: {},
      })

      const response = await userHandler(req, mockContext as never)
      const data = await parseResponse(response)

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })

    it('should return 401 when x-user-id header is empty', async () => {
      const req = createMockRequest('GET', '/api/user', {
        headers: { 'x-user-id': '' },
      })

      const response = await userHandler(req, mockContext as never)

      // Empty string is falsy, should be 401
      expect(response.status).toBe(401)
    })
  })

  describe('GET /api/user', () => {
    it('should return user profile when found', async () => {
      const mockUser = {
        user_id: 'user-123',
        prefs: { nationality: 'US' },
        is_pro: true,
        stripe_customer_id: 'cus_123',
      }
      setMockQueryResult('SELECT * FROM user_profiles', [mockUser])

      const req = createMockRequest('GET', '/api/user', {
        headers: { 'x-user-id': 'user-123' },
      })

      const response = await userHandler(req, mockContext as never)
      const data = await parseResponse(response)

      expect(response.status).toBe(200)
      expect(data.user_id).toBe('user-123')
      expect(data.is_pro).toBe(true)
    })

    it('should return 404 when user not found', async () => {
      setMockQueryResult('SELECT * FROM user_profiles', [])

      const req = createMockRequest('GET', '/api/user', {
        headers: { 'x-user-id': 'nonexistent' },
      })

      const response = await userHandler(req, mockContext as never)
      const data = await parseResponse(response)

      expect(response.status).toBe(404)
      expect(data.error).toBe('User not found')
    })
  })

  describe('POST /api/user', () => {
    it('should create new user profile', async () => {
      const newUser = {
        user_id: 'user-123',
        prefs: { nationality: 'GB' },
        is_pro: false,
      }
      setMockQueryResult('INSERT INTO user_profiles', [newUser])

      const req = createMockRequest('POST', '/api/user', {
        headers: { 'x-user-id': 'user-123' },
        body: { prefs: { nationality: 'GB' } },
      })

      const response = await userHandler(req, mockContext as never)
      const data = await parseResponse(response)

      expect(response.status).toBe(201)
      expect(data.user_id).toBe('user-123')
    })

    it('should upsert on conflict', async () => {
      const updatedUser = {
        user_id: 'user-123',
        prefs: { nationality: 'US', travelStyle: ['adventure'] },
        is_pro: false,
      }
      setMockQueryResult('INSERT INTO user_profiles', [updatedUser])

      const req = createMockRequest('POST', '/api/user', {
        headers: { 'x-user-id': 'user-123' },
        body: { prefs: { nationality: 'US', travelStyle: ['adventure'] } },
      })

      const response = await userHandler(req, mockContext as never)
      const data = await parseResponse(response)

      expect(response.status).toBe(201)
      expect(data.prefs.travelStyle).toContain('adventure')

      // Check that ON CONFLICT is in the query
      const queries = getMockQueryLog()
      expect(queries.some(q => q.query.includes('ON CONFLICT'))).toBe(true)
    })

    it('should handle empty prefs', async () => {
      const newUser = {
        user_id: 'user-123',
        prefs: {},
        is_pro: false,
      }
      setMockQueryResult('INSERT INTO user_profiles', [newUser])

      const req = createMockRequest('POST', '/api/user', {
        headers: { 'x-user-id': 'user-123' },
        body: {},
      })

      const response = await userHandler(req, mockContext as never)

      expect(response.status).toBe(201)
    })
  })

  describe('PUT /api/user', () => {
    it('should update user preferences', async () => {
      const updatedUser = {
        user_id: 'user-123',
        prefs: { nationality: 'AU', budget: 'mid-range' },
        is_pro: true,
      }
      setMockQueryResult('UPDATE user_profiles', [updatedUser])

      const req = createMockRequest('PUT', '/api/user', {
        headers: { 'x-user-id': 'user-123' },
        body: { prefs: { nationality: 'AU', budget: 'mid-range' } },
      })

      const response = await userHandler(req, mockContext as never)
      const data = await parseResponse(response)

      expect(response.status).toBe(200)
      expect(data.prefs.nationality).toBe('AU')
      expect(data.prefs.budget).toBe('mid-range')
    })

    it('should return 404 when user to update not found', async () => {
      setMockQueryResult('UPDATE user_profiles', [])

      const req = createMockRequest('PUT', '/api/user', {
        headers: { 'x-user-id': 'nonexistent' },
        body: { prefs: { nationality: 'US' } },
      })

      const response = await userHandler(req, mockContext as never)
      const data = await parseResponse(response)

      expect(response.status).toBe(404)
      expect(data.error).toBe('User not found')
    })
  })

  describe('DELETE /api/user', () => {
    it('should delete user and return 204', async () => {
      setMockQueryResult('DELETE FROM user_profiles', [])

      const req = createMockRequest('DELETE', '/api/user', {
        headers: { 'x-user-id': 'user-123' },
      })

      const response = await userHandler(req, mockContext as never)

      expect(response.status).toBe(204)
      expect(response.body).toBeNull()
    })
  })

  describe('unsupported methods', () => {
    it('should return 405 for PATCH method', async () => {
      const req = createMockRequest('PATCH', '/api/user', {
        headers: { 'x-user-id': 'user-123' },
      })

      const response = await userHandler(req, mockContext as never)
      const data = await parseResponse(response)

      expect(response.status).toBe(405)
      expect(data.error).toBe('Method not allowed')
    })
  })

  describe('error handling', () => {
    it('should return 500 on database error', async () => {
      mockSql.mockRejectedValueOnce(new Error('Database connection failed'))

      const req = createMockRequest('GET', '/api/user', {
        headers: { 'x-user-id': 'user-123' },
      })

      const response = await userHandler(req, mockContext as never)
      const data = await parseResponse(response)

      expect(response.status).toBe(500)
      expect(data.error).toBe('Internal server error')
    })
  })
})
